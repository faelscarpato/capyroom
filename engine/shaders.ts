
export const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_curve_lut;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_whites;
uniform float u_blacks;
uniform float u_vibrance;
uniform float u_saturation;
uniform float u_temp;
uniform float u_tint;
uniform float u_texture;
uniform float u_vignette;
uniform float u_grain;

// HSL Mixers: 8 colors
uniform float u_hsl_h[8];
uniform float u_hsl_s[8];
uniform float u_hsl_l[8];

in vec2 v_texCoord;
out vec4 outColor;

vec3 rgb2hsl(vec3 c) {
    float max_c = max(max(c.r, c.g), c.b);
    float min_c = min(min(c.r, c.g), c.b);
    float delta = max_c - min_c;
    float h = 0.0;
    float s = 0.0;
    float l = (max_c + min_c) / 2.0;
    if (delta > 0.0) {
        s = l < 0.5 ? delta / (max_c + min_c) : delta / (2.0 - max_c - min_c);
        if (max_c == c.r) h = (c.g - c.b) / delta + (c.g < c.b ? 6.0 : 0.0);
        else if (max_c == c.g) h = (c.b - c.r) / delta + 2.0;
        else h = (c.r - c.g) / delta + 4.0;
        h /= 6.0;
    }
    return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(vec3 c) {
    float r, g, b;
    if (c.y == 0.0) {
        r = g = b = c.z;
    } else {
        float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
        float p = 2.0 * c.z - q;
        r = hue2rgb(p, q, c.x + 1.0/3.0);
        g = hue2rgb(p, q, c.x);
        b = hue2rgb(p, q, c.x - 1.0/3.0);
    }
    return vec3(r, g, b);
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec4 color = texture(u_image, v_texCoord);
    vec3 rgb = color.rgb;

    // Apply Temperature and Tint
    rgb.r += u_temp * 0.05;
    rgb.b -= u_temp * 0.05;
    rgb.g -= u_tint * 0.05;

    // Exposure and Contrast
    rgb *= pow(2.0, u_exposure / 50.0);
    rgb = (rgb - 0.5) * (1.0 + u_contrast / 100.0) + 0.5;

    // Apply Tone Curve via LUT
    rgb.r = texture(u_curve_lut, vec2(clamp(rgb.r, 0.0, 1.0), 0.5)).r;
    rgb.g = texture(u_curve_lut, vec2(clamp(rgb.g, 0.0, 1.0), 0.5)).r;
    rgb.b = texture(u_curve_lut, vec2(clamp(rgb.b, 0.0, 1.0), 0.5)).r;

    // Highlights and Shadows mask
    float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));
    float h_mask = smoothstep(0.5, 1.0, luminance);
    float s_mask = smoothstep(0.5, 0.0, luminance);
    rgb += h_mask * (u_highlights / 200.0);
    rgb += s_mask * (u_shadows / 200.0);

    vec3 hsl = rgb2hsl(rgb);
    
    // Per-color HSL
    float h = hsl.x;
    float weights[8];
    float centers[8] = float[](0.0, 0.083, 0.166, 0.333, 0.5, 0.666, 0.777, 0.888);
    for(int i = 0; i < 8; i++) {
        float d = abs(h - centers[i]);
        if (i == 0) d = min(d, abs(h - 1.0));
        weights[i] = smoothstep(0.15, 0.0, d);
    }
    
    float total_h = 0.0;
    float total_s = 0.0;
    float total_l = 0.0;
    for(int i = 0; i < 8; i++) {
        total_h += u_hsl_h[i] * weights[i];
        total_s += u_hsl_s[i] * weights[i];
        total_l += u_hsl_l[i] * weights[i];
    }
    
    hsl.x = fract(hsl.x + (total_h / 360.0));
    hsl.y = clamp(hsl.y + (total_s / 100.0), 0.0, 1.0);
    hsl.z = clamp(hsl.z + (total_l / 100.0), 0.0, 1.0);

    // Global Vibrance & Saturation
    float vib = (1.0 - hsl.y) * (u_vibrance / 100.0);
    hsl.y = clamp(hsl.y + vib + (u_saturation / 100.0), 0.0, 1.0);
    rgb = hsl2rgb(hsl);

    if (u_texture != 0.0) {
       rgb = mix(rgb, rgb * rgb, u_texture * 0.002);
    }

    float dist = distance(v_texCoord, vec2(0.5));
    float vig = smoothstep(0.8, 0.2, dist * (1.5 - u_vignette / 100.0));
    rgb *= mix(1.0, vig, abs(u_vignette) / 100.0 * (u_vignette < 0.0 ? 1.0 : 0.0));

    if (u_grain > 0.0) {
        float noise = (random(v_texCoord) - 0.5) * (u_grain / 100.0);
        rgb += noise;
    }

    outColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
}
`;
