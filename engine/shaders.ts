
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

uniform float u_exposure, u_contrast, u_highlights, u_shadows, u_vibrance, u_saturation;
uniform float u_temp, u_tint, u_texture, u_vignette, u_grain;
uniform float u_lensCorrection, u_chromaticAberration, u_straighten, u_rotation;
uniform vec2 u_flip;
uniform vec4 u_crop; // x, y, w, h (normalized)

uniform float u_hsl_h[8], u_hsl_s[8], u_hsl_l[8];

in vec2 v_texCoord;
out vec4 outColor;

vec3 rgb2hsl(vec3 c) {
    float max_c = max(max(c.r, c.g), c.b), min_c = min(min(c.r, c.g), c.b);
    float delta = max_c - min_c, h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
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
    if (t < 0.0) t += 1.0; if (t > 1.0) t -= 1.0;
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

float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

vec2 distorter(vec2 uv, float k) {
    vec2 p = uv - 0.5;
    float r2 = dot(p, p);
    return 0.5 + p * (1.0 + k * r2 + k * 0.5 * r2 * r2);
}

void main() {
    // 1. Coordenadas base
    vec2 uv = v_texCoord;
    
    // Aplicação de Crop (Janelamento)
    // Para evitar distorção, o uv original (0-1) é mapeado para a sub-região u_crop
    uv = u_crop.xy + uv * u_crop.zw;

    // Rotação e Endireitamento
    float angle = u_rotation + radians(u_straighten);
    vec2 centered = uv - 0.5;
    float cosA = cos(angle), sinA = sin(angle);
    uv = vec2(centered.x * cosA - centered.y * sinA, centered.x * sinA + centered.y * cosA) + 0.5;

    // Flip
    uv = (uv - 0.5) * u_flip + 0.5;

    // 2. Ótica (Distorção de Lente)
    float k = u_lensCorrection * 0.15;
    vec2 uvD = distorter(uv, k);
    
    vec4 color;
    if (u_chromaticAberration > 0.5) {
        vec2 uvR = distorter(uv, k + 0.01);
        vec2 uvB = distorter(uv, k - 0.01);
        color = vec4(texture(u_image, uvR).r, texture(u_image, uvD).g, texture(u_image, uvB).b, texture(u_image, uvD).a);
    } else {
        color = texture(u_image, uvD);
    }

    // Border Check (Opcional: descarta se estiver fora do range 0-1)
    if (uvD.x < 0.0 || uvD.x > 1.0 || uvD.y < 0.0 || uvD.y > 1.0) {
        discard;
    }

    vec3 rgb = color.rgb;
    
    // Ajustes de Cor Básicos
    rgb.r += u_temp * 0.001; rgb.b -= u_temp * 0.001; rgb.g -= u_tint * 0.001;
    rgb *= pow(2.0, u_exposure / 50.0);
    rgb = (rgb - 0.5) * (1.0 + u_contrast / 100.0) + 0.5;

    // Curvas via LUT
    rgb.r = texture(u_curve_lut, vec2(clamp(rgb.r, 0.0, 1.0), 0.5)).r;
    rgb.g = texture(u_curve_lut, vec2(clamp(rgb.g, 0.0, 1.0), 0.5)).r;
    rgb.b = texture(u_curve_lut, vec2(clamp(rgb.b, 0.0, 1.0), 0.5)).r;

    // HSL Mixer
    vec3 hsl = rgb2hsl(rgb);
    float centers[8] = float[](0.0, 0.083, 0.166, 0.333, 0.5, 0.666, 0.777, 0.888);
    float th = 0.0, ts = 0.0, tl = 0.0;
    for(int i = 0; i < 8; i++) {
        float d = min(abs(hsl.x - centers[i]), abs(hsl.x - centers[i] - 1.0));
        float w = smoothstep(0.12, 0.0, d);
        th += u_hsl_h[i] * w; ts += u_hsl_s[i] * w; tl += u_hsl_l[i] * w;
    }
    hsl.x = fract(hsl.x + (th / 360.0));
    hsl.y = clamp(hsl.y + (ts / 100.0), 0.0, 1.0);
    hsl.z = clamp(hsl.z + (tl / 100.0), 0.0, 1.0);
    
    // Vibratilidade e Saturação Global
    hsl.y = clamp(hsl.y + (1.0 - hsl.y) * (u_vibrance / 100.0) + (u_saturation / 100.0), 0.0, 1.0);
    rgb = hsl2rgb(hsl);

    // Efeitos de Textura e Vinheta
    float dist = distance(v_texCoord, vec2(0.5));
    rgb *= mix(1.0, smoothstep(0.8, 0.2, dist * (1.5 - u_vignette / 100.0)), abs(u_vignette) / 100.0 * (u_vignette < 0.0 ? 1.0 : 0.0));
    if (u_grain > 0.0) rgb += (random(uvD) - 0.5) * (u_grain / 100.0);

    outColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
}
`;
