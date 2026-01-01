
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

// Global Adjustments
uniform float u_exposure;
uniform float u_contrast;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_vibrance;
uniform float u_saturation;
uniform float u_temp;
uniform float u_tint;
uniform float u_texture;
uniform float u_vignette;
uniform float u_grain;

// Optics
uniform float u_lensCorrection; // k1 factor
uniform float u_chromaticAberration; // boolean 0 or 1

// Geometry
uniform float u_straighten;
uniform float u_rotation; // radians
uniform vec2 u_flip; // x: flipH, y: flipV (1.0 or -1.0)
uniform vec4 u_crop; // x, y, w, h (normalized)

// HSL Mixers
uniform float u_hsl_h[8];
uniform float u_hsl_s[8];
uniform float u_hsl_l[8];

in vec2 v_texCoord;
out vec4 outColor;

vec3 rgb2hsl(vec3 c) {
    float max_c = max(max(c.r, c.g), c.b);
    float min_c = min(min(c.r, c.g), c.b);
    float delta = max_c - min_c;
    float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
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
    if (c.y == 0.0) return vec3(c.z);
    float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
    float p = 2.0 * c.z - q;
    return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0));
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Lens distortion: k is the strength
vec2 distorter(vec2 uv, float k) {
    vec2 p = uv - 0.5;
    float r2 = dot(p, p);
    // Brown-Conrady model simplified
    return 0.5 + p * (1.0 + k * r2 + k * 0.5 * r2 * r2);
}

void main() {
    // 1. Basic UV setup from geometry
    vec2 uv = v_texCoord;

    // Apply Rotation & Straighten around center
    float angle = u_rotation + radians(u_straighten);
    vec2 centered = uv - 0.5;
    float cosA = cos(angle);
    float sinA = sin(angle);
    uv = vec2(
        centered.x * cosA - centered.y * sinA,
        centered.x * sinA + centered.y * cosA
    ) + 0.5;

    // Apply Flip
    uv = (uv - 0.5) * u_flip + 0.5;

    // Apply Crop
    uv = u_crop.xy + uv * u_crop.zw;

    // 2. Optics (Distorção de Lente)
    float k = u_lensCorrection * 0.15;
    
    vec4 color;
    if (u_chromaticAberration > 0.5) {
        // Radial shift for CA
        vec2 uvR = distorter(uv, k + 0.02);
        vec2 uvG = distorter(uv, k);
        vec2 uvB = distorter(uv, k - 0.02);
        
        color.r = texture(u_image, uvR).r;
        color.g = texture(u_image, uvG).g;
        color.b = texture(u_image, uvB).b;
        color.a = texture(u_image, uvG).a;
    } else {
        vec2 uvDistorted = distorter(uv, k);
        color = texture(u_image, uvDistorted);
    }

    // Border Check
    vec2 uvCheck = distorter(uv, k);
    if (uvCheck.x < 0.0 || uvCheck.x > 1.0 || uvCheck.y < 0.0 || uvCheck.y > 1.0) {
        discard;
    }

    vec3 rgb = color.rgb;

    // Basic Color Adjusts (Temp/Tint)
    rgb.r += u_temp * 0.001;
    rgb.b -= u_temp * 0.001;
    rgb.g -= u_tint * 0.001;

    // Exposure & Contrast
    rgb *= pow(2.0, u_exposure / 50.0);
    rgb = (rgb - 0.5) * (1.0 + u_contrast / 100.0) + 0.5;

    // LUT Curves
    rgb.r = texture(u_curve_lut, vec2(clamp(rgb.r, 0.0, 1.0), 0.5)).r;
    rgb.g = texture(u_curve_lut, vec2(clamp(rgb.g, 0.0, 1.0), 0.5)).r;
    rgb.b = texture(u_curve_lut, vec2(clamp(rgb.b, 0.0, 1.0), 0.5)).r;

    // Presence
    float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
    rgb += smoothstep(0.5, 1.0, luma) * (u_highlights / 200.0);
    rgb += smoothstep(0.5, 0.0, luma) * (u_shadows / 200.0);

    // HSL
    vec3 hsl = rgb2hsl(rgb);
    float h = hsl.x;
    float centers[8] = float[](0.0, 0.083, 0.166, 0.333, 0.5, 0.666, 0.777, 0.888);
    float th = 0.0, ts = 0.0, tl = 0.0;
    for(int i = 0; i < 8; i++) {
        float d = abs(h - centers[i]);
        if (i == 0) d = min(d, abs(h - 1.0));
        float w = smoothstep(0.15, 0.0, d);
        th += u_hsl_h[i] * w; ts += u_hsl_s[i] * w; tl += u_hsl_l[i] * w;
    }
    hsl.x = fract(hsl.x + (th / 360.0));
    hsl.y = clamp(hsl.y + (ts / 100.0), 0.0, 1.0);
    hsl.z = clamp(hsl.z + (tl / 100.0), 0.0, 1.0);

    // Vibrance & Saturation
    float vib = (1.0 - hsl.y) * (u_vibrance / 100.0);
    hsl.y = clamp(hsl.y + vib + (u_saturation / 100.0), 0.0, 1.0);
    rgb = hsl2rgb(hsl);

    // Vignette & Grain
    float dist = distance(uvCheck, vec2(0.5));
    rgb *= mix(1.0, smoothstep(0.8, 0.2, dist * (1.5 - u_vignette / 100.0)), abs(u_vignette) / 100.0 * (u_vignette < 0.0 ? 1.0 : 0.0));
    if (u_grain > 0.0) rgb += (random(uvCheck) - 0.5) * (u_grain / 100.0);

    outColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
}
`;
