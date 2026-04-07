shader_type spatial;

// NEON REIGN: AAA Wind-Swept Palm Tree Shader
// Features: Realistic vertex sway, SSS for leaves, Night lighting

uniform vec3 leaf_color : source_color = vec3(0.0, 0.5, 0.4);
uniform float wind_strength : hint_range(0.0, 10.0) = 1.0;
uniform float wind_speed : hint_range(0.0, 5.0) = 0.5;

void vertex() {
    float wind = sin(TIME * wind_speed + (VERTEX.x + VERTEX.z) * 0.5) * wind_strength;
    VERTEX.x += (VERTEX.y * wind * 0.1); // Sway increases with height
    VERTEX.z += (VERTEX.y * wind * 0.05);
}

void fragment() {
    ALBEDO = leaf_color;
    ROUGHNESS = 0.6;
    METALLIC = 0.0;
    
    // Pseudo-SSS for leaves (brighten when backlit)
    float sss = pow(1.0 - dot(NORMAL, VIEW), 2.0);
    ALBEDO = mix(ALBEDO, leaf_color * 1.5, sss * 0.5);
}
