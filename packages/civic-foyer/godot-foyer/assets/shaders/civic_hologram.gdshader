shader_type spatial;

// NEON REIGN: AAA CivicVerse Hologram Shader
// Features: Dynamic scanlines, Flickering, Transparency, Glow

uniform vec4 base_color : source_color = vec4(0.0, 1.0, 0.8, 0.5);
uniform sampler2D texture_albedo : source_color;
uniform float scanline_speed : hint_range(0.0, 10.0) = 2.0;
uniform float flicker_speed : hint_range(0.0, 20.0) = 10.0;

void fragment() {
    vec4 tex = texture(texture_albedo, UV);
    float scanline = sin(UV.y * 100.0 + TIME * scanline_speed) * 0.5 + 0.5;
    float flicker = sin(TIME * flicker_speed) * 0.1 + 0.9;
    
    ALBEDO = base_color.rgb * tex.rgb * flicker;
    ALPHA = base_color.a * tex.a * (0.5 + scanline * 0.5) * flicker;
    EMISSION = ALBEDO * 5.0; // High glow
}
