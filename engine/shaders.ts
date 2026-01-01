
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

in vec2 v_texCoord;
out vec4 outColor;

// RGB to HSL helper
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

// HSL to RGB helper
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

    // 1. Temperature & Tint (White Balance)
    // Temperature: Amber-Blue shift
    rgb.r += u_temp * 0.1;
    rgb.b -= u_temp * 0.1;
    // Tint: Green-Magenta shift
    rgb.g -= u_tint * 0.1;
    rgb.r += u_tint * 0.05;
    rgb.b += u_tint * 0.05;

    // 2. Exposure
    rgb *= pow(2.0, u_exposure / 50.0);

    // 3. Contrast
    rgb = (rgb - 0.5) * (1.0 + u_contrast / 100.0) + 0.5;

    // 4. Highlights / Shadows (Simplified)
    float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));
    float h_mask = smoothstep(0.5, 1.0, luminance);
    float s_mask = smoothstep(0.5, 0.0, luminance);
    rgb += h_mask * (u_highlights / 200.0);
    rgb += s_mask * (u_shadows / 200.0);

    // 5. Vibrance & Saturation
    vec3 hsl = rgb2hsl(rgb);
    // Vibrance adjusts low saturation pixels more
    float vib = (1.0 - hsl.y) * (u_vibrance / 100.0);
    hsl.y = clamp(hsl.y + vib + (u_saturation / 100.0), 0.0, 1.0);
    rgb = hsl2rgb(hsl);

    // 6. Texture / Clarity (Very simplified as unsharp-like)
    // Real clarity needs multi-tap blur. Here we do a subtle high-pass simulation
    if (u_texture != 0.0) {
       rgb = mix(rgb, rgb * rgb, u_texture * 0.002);
    }

    // 7. Vignette
    float dist = distance(v_texCoord, vec2(0.5));
    float vig = smoothstep(0.8, 0.2, dist * (1.5 - u_vignette / 100.0));
    rgb *= mix(1.0, vig, abs(u_vignette) / 100.0 * (u_vignette < 0.0 ? 1.0 : 0.0));

    // 8. Grain
    if (u_grain > 0.0) {
        float noise = (random(v_texCoord) - 0.5) * (u_grain / 100.0);
        rgb += noise;
    }

    outColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
}
`;
