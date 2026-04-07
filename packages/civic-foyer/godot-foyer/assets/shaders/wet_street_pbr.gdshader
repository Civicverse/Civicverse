shader_type spatial;

// NEON REIGN: AAA Wet Street Shader
// Features: Dynamic puddles, Screen-space reflections support, Micro-roughness variation

uniform vec3 base_color : source_color = vec3(0.05, 0.05, 0.07);
uniform sampler2D roughness_texture : hint_default_white;
uniform sampler2D normal_texture : hint_normal;

@export_group("Wetness Settings")
uniform float wetness : hint_range(0.0, 1.0) = 0.8;
uniform float puddle_threshold : hint_range(0.0, 1.0) = 0.6;
uniform vec3 puddle_color : source_color = vec3(0.02, 0.02, 0.03);

@export_group("Reflections")
uniform float static_ssr_strength : hint_range(0.0, 1.0) = 0.5;

void fragment() {
    vec3 n = texture(normal_texture, UV).rgb * 2.0 - 1.0;
    float rough = texture(roughness_texture, UV).r;
    
    // Simulate puddles using a noise-based threshold (placeholder noise)
    float puddle_mask = smoothstep(puddle_threshold - 0.1, puddle_threshold + 0.1, rough);
    
    // Wet surfaces are darker and smoother
    ALBEDO = mix(base_color, puddle_color, (1.0 - puddle_mask) * wetness);
    
    // Puddles are perfectly smooth (roughness 0)
    ROUGHNESS = mix(rough, 0.02, (1.0 - puddle_mask) * wetness);
    
    // Puddles have flat normals (pointing up)
    NORMAL_MAP = mix(n, vec3(0.0, 0.0, 1.0), (1.0 - puddle_mask) * wetness);
    
    METALLIC = 0.1; // Concrete/Asphalt is slightly metallic when wet
    SPECULAR = 0.5;
}
