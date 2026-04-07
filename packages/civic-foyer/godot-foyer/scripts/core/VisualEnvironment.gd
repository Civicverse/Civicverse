# VisualEnvironment.gd
# NEON REIGN: AAA Cinematic Environment Controller (GTA 5 Style Night)

extends Node

func apply_aaa_environment(env: WorldEnvironment):
	var e = env.environment
	if not e: return
	
	# 1. LIGHTING & GI (Realistic Night)
	e.sdfgi_enabled = true
	e.sdfgi_use_occlusion = true
	e.sdfgi_bounce_feedback = 1.2
	e.sdfgi_min_cell_size = 0.2
	e.sdfgi_cascade0_distance = 12.8
	e.sdfgi_max_distance = 204.8
	
	# 2. ATMOSPHERE (Volumetric Fog)
	e.volumetric_fog_enabled = true
	e.volumetric_fog_density = 0.015
	e.volumetric_fog_albedo = Color(0.1, 0.15, 0.25)
	e.volumetric_fog_emission = Color(0.05, 0.05, 0.1)
	e.volumetric_fog_length = 64.0
	e.volumetric_fog_ambient_inject = 0.5
	
	# 3. POST-PROCESSING (Cinematic Polish)
	e.tonemap_mode = Environment.TONEMAP_ACES
	e.tonemap_exposure = 1.0
	e.tonemap_white = 1.0
	
	e.ssao_enabled = true
	e.ssao_intensity = 2.5
	e.ssao_power = 1.5
	
	e.ssil_enabled = true
	e.ssil_intensity = 1.5
	
	e.ssr_enabled = true
	e.ssr_max_steps = 128
	e.ssr_fade_in = 0.1
	e.ssr_fade_out = 2.0
	
	e.glow_enabled = true
	e.glow_normalized = true
	e.glow_intensity = 1.2
	e.glow_strength = 1.0
	e.glow_bloom = 0.2
	e.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT
	
	# 4. COLOR GRADING (Tropical Night)
	e.adjustment_enabled = true
	e.adjustment_contrast = 1.2
	e.adjustment_saturation = 1.3
	e.adjustment_brightness = 1.05
	
	print("[VISUALS] GTA-Level Environment active with SDFGI + Volumetric Fog")

func setup_sunlight(light: DirectionalLight3D):
	light.light_color = Color(0.2, 0.3, 0.5) # Dark Blue Moonlight
	light.light_energy = 0.8
	light.light_volumetric_fog_energy = 3.0
	light.shadow_enabled = true
	light.shadow_blur = 2.0
	light.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	print("[VISUALS] Moonlight configured")
