shader_type spatial;

// NEON REIGN - AAA High-Fidelity PBR Shader
// Features: Skin SSS, Realistic Fabric, Micro-surface detail, Neon Rim lighting, Reflections

uniform vec4 albedo_color : source_color = vec4(1.0);
uniform sampler2D albedo_texture : source_color;
uniform sampler2D normal_texture : hint_normal;
uniform sampler2D roughness_texture : hint_default_black;
uniform sampler2D metallic_texture : hint_default_black;
uniform sampler2D ao_texture : hint_default_white;
uniform sampler2D emission_texture : hint_default_black;

@export_group("Surface Properties")
uniform float roughness_mult : hint_range(0.0, 2.0) = 1.0;
uniform float metallic_mult : hint_range(0.0, 2.0) = 1.0;
uniform float normal_strength : hint_range(0.0, 2.0) = 1.0;

@export_group("Realistic Skin (SSS)")
uniform bool is_skin = false;
uniform float sss_strength : hint_range(0.0, 2.0) = 0.5;
uniform vec4 sss_color : source_color = vec4(1.0, 0.2, 0.1, 1.0);

@export_group("Neon Accent")
uniform vec3 neon_accent_color : source_color = vec3(0.0, 1.0, 0.8);
uniform float neon_accent_strength : hint_range(0.0, 10.0) = 2.0;
uniform float neon_rim_power : hint_range(1.0, 10.0) = 3.0;

@export_group("Micro Detail")
uniform float detail_scale : hint_range(1.0, 100.0) = 20.0;
uniform float detail_strength : hint_range(0.0, 1.0) = 0.1;

void fragment() {
    vec4 albedo_tex = texture(albedo_texture, UV);
    ALBEDO = albedo_tex.rgb * albedo_color.rgb;
    
    // Normal Mapping
    vec3 n = texture(normal_texture, UV).rgb * 2.0 - 1.0;
    NORMAL_MAP = n;
    NORMAL_MAP_DEPTH = normal_strength;
    
    // PBR Channels
    float rough = texture(roughness_texture, UV).r * roughness_mult;
    float metal = texture(metallic_texture, UV).r * metallic_mult;
    ROUGHNESS = clamp(rough, 0.05, 1.0);
    METALLIC = metal;
    AO = texture(ao_texture, UV).r;
    
    // Micro detail (simulated pores or fabric weave)
    float micro = fract(sin(dot(UV * detail_scale, vec2(12.9898, 78.233))) * 43758.5453);
    ALBEDO = mix(ALBEDO, ALBEDO * (0.8 + micro * 0.4), detail_strength);
    
    // Subsurface Scattering (Pseudo-SSS for Godot 4 Spatial)
    if (is_skin) {
        float fresnel = pow(1.0 - dot(NORMAL, VIEW), 3.0);
        ALBEDO = mix(ALBEDO, sss_color.rgb * ALBEDO, fresnel * sss_strength);
    }
    
    // Emission & Neon Rim
    vec3 emission = texture(emission_texture, UV).rgb;
    float rim = pow(1.0 - dot(NORMAL, VIEW), neon_rim_power);
    vec3 neon_rim = neon_accent_color * rim * neon_accent_strength;
    
    EMISSION = (emission * neon_accent_strength) + neon_rim;
}
