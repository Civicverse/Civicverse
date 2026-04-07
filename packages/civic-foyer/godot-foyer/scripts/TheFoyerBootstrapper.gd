# TheFoyerBootstrapper.gd
# NEON REIGN: The Foyer - Main Scene Initializer
# Loads the foyer environment, initializes all systems, and manages the main lobby

extends Node3D

@onready var environment = $WorldEnvironment
@onready var players_container = $Players
@onready var vehicles_container = $Vehicles
@onready var portals_container = $Portals
@onready var ui_layer = $CanvasLayer/UI

var player_instance: CharacterBody3D
var match_timer = 0.0
var storm_radius = 200.0
var storm_center = Vector3.ZERO

func _ready():
	print("=" * 60)
	print("🌃 NEON REIGN: The Foyer - Starting Up")
	print("=" * 60)
	
	# Initialize all autoload systems
	initialize_systems()
	
	# Set up the environment
	setup_environment()
	
	# Spawn the player
	spawn_player()
	
	# Initialize portals to shards
	setup_portals()
	
	# Spawn initial vehicles
	VehicleManager.spawn_vehicles_at_points()
	
	# Start the match
	GameStateManager.start_match(16)
	
	# Load audio ambience
	AudioManager.add_ambient_layer("city_traffic", "res://assets/audio/ambient/city_traffic_loop.ogg")
	AudioManager.add_ambient_layer("neon_hum", "res://assets/audio/ambient/neon_hum.ogg")
	AudioManager.play_music("res://assets/audio/music/foyer_theme.ogg", 3.0)
	
	print("[FOYER] Initialization complete!")

func initialize_systems() -> void:
	"""Initialize all critical autoload systems."""
	if not CivicAvatarManager:
		push_error("CivicAvatarManager not loaded!")
	if not GameStateManager:
		push_error("GameStateManager not loaded!")
	if not VehicleManager:
		push_error("VehicleManager not loaded!")
	if not CivicFeedManager:
		push_error("CivicFeedManager not loaded!")
	if not WalletManager:
		push_error("WalletManager not loaded!")
	if not ReputationSystem:
		push_error("ReputationSystem not loaded!")
	if not AudioManager:
		push_error("AudioManager not loaded!")
	
	print("[INIT] All autoload systems verified")

func setup_environment() -> void:
	"""Configure the Foyer's neon-cyberpunk atmosphere."""
	
	# Create a beautiful WorldEnvironment with SDFGI (tropical mega-city at night)
	var env = Environment.new()

	# Sky & Ambient (Procedural sky plus ambient color layering for depth)
	env.background_mode = Environment.BG_SKY
	var sky_mat = ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.05, 0.06, 0.14, 1)
	sky_mat.sky_horizon_color = Color(0.09, 0.08, 0.14, 1)
	sky_mat.ground_bottom_color = Color(0.03, 0.03, 0.07, 1)
	sky_mat.ground_horizon_color = Color(0.08, 0.05, 0.1, 1)
	sky_mat.sky_curve = 1.05
	var procedural_sky = Sky.new()
	procedural_sky.sky_material = sky_mat
	env.sky = procedural_sky
	env.background_color = Color(0.02, 0.025, 0.08, 1.0)
	env.ambient_light_source = Environment.AMBIENT_LIGHT_SKY
	env.ambient_light_energy = 0.75
	env.ambient_light_color = Color(0.11, 0.09, 0.2)

	# SDFGI for high quality neon bouncing + wet-surface indirect lighting
	env.sdfgi_enabled = true
	env.sdfgi_cascade_count = 4
	env.sdfgi_min_cell_size = 0.06
	env.sdfgi_max_cell_size = 1.2
	env.sdfgi_trace_steps = 32
	env.sdfgi_bounce_count = 2
	env.sdfgi_full_spectrum = true
	env.sdfgi_use_occlusion = true
	env.sdfgi_y_scale = 1.0

	# SSR/SSAO/SSIL for depth
	env.ssr_enabled = true
	env.ssr_max_steps = 64
	env.ssr_thickness = 0.12
	env.ssao_enabled = true
	env.ssao_radius = 0.8
	env.ssao_intensity = 1.0
	env.ssil_enabled = true
	env.ssil_size = 3
	
	# Volumetric Fog + God rays
	env.volumetric_fog_enabled = true
	env.volumetric_fog_density = 0.012
	env.volumetric_fog_scatter = 0.38
	env.volumetric_fog_anisotropy = 0.28
	env.volumetric_fog_normal_disturbance = 0.15
	env.volumetric_fog_gi_inject = 1.0
	env.volumetric_fog_albedo = Color(0.24, 0.17, 0.28, 1)
	env.volumetric_fog_emission = Color(0.18, 0.08, 0.31, 1)

	# Glow/Bloom for neon accents
	env.glow_enabled = true
	env.glow_intensity = 1.48
	env.glow_strength = 2.1
	env.glow_bloom = 0.8
	env.glow_hdr_threshold = 0.72
	env.glow_hdr_scale = 2.1
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE

	# Color grading for Sims/WoW tropical night richness
	env.adjustment_enabled = true
	env.adjustment_brightness = 1.05
	env.adjustment_contrast = 1.25
	env.adjustment_saturation = 1.45
	env.adjustment_tone_mapper = Environment.TONE_MAPPER_ACES
	env.adjustment_color_correction = Color(1.1, 1.03, 1.0, 1)

	# Fog layering for lower street level and neon pools
	env.fog_enabled = true
	env.fog_depth_begin = 12.0
	env.fog_depth_end = 160.0
	env.fog_color = Color(0.04, 0.03, 0.05)
	env.fog_transmit_curve = 1.2

	environment.environment = env
	
	environment.environment = env
	
	# Sun light
	var sun = DirectionalLight3D.new()
	sun.light_energy = 0.3
	sun.light_color = Color(0.0, 0.8, 1.0)  # Cyan neon
	sun.rotation = Vector3(PI * 0.25, PI * 0.15, 0)
	add_child(sun)
	
	# Ambient neon lights
	var neon_light_1 = OmniLight3D.new()
	neon_light_1.light_energy = 2.0
	neon_light_1.light_color = Color(1.0, 0.0, 1.0)  # Magenta
	neon_light_1.omni_range = 200
	neon_light_1.global_position = Vector3(-100, 50, 100)
	add_child(neon_light_1)
	
	var neon_light_2 = OmniLight3D.new()
	neon_light_2.light_energy = 2.0
	neon_light_2.light_color = Color(0.0, 1.0, 0.8)  # Cyan
	neon_light_2.omni_range = 200
	neon_light_2.global_position = Vector3(100, 50, -100)
	add_child(neon_light_2)
	
	print("[ENV] Neon-cyberpunk environment initialized with SDFGI + volumetric fog")

func spawn_player() -> void:
	"""Instantiate the player with full controller."""
	var player_scene = preload("res://scenes/player/Player.tscn")
	if not player_scene:
		push_error("Player scene not found!")
		return
	
	player_instance = player_scene.instantiate()
	player_instance.global_position = Vector3(0, 2, 20)
	players_container.add_child(player_instance)
	
	print("[PLAYER] Spawned at %s" % player_instance.global_position)

func setup_portals() -> void:
	"""Create portals to shards."""
	var portal_configs = [
		{"name": "SocialArena", "position": Vector3(-40, 0, -40), "color": Color.CYAN, "target_shard": "res://scenes/shards/SocialArenaShard.tscn"},
		{"name": "Schoolhouse", "position": Vector3(40, 0, -40), "color": Color.MAGENTA, "target_shard": "res://scenes/shards/SchoolhouseShard.tscn"},
		{"name": "Store", "position": Vector3(-40, 0, 40), "color": Color.LIME, "target_shard": "res://scenes/shards/StoreShard.tscn"},
		{"name": "BR_Arena", "position": Vector3(40, 0, 40), "color": Color.YELLOW, "target_shard": "res://scenes/shards/BR_ArenaShard.tscn"}
	]
	
	for portal_config in portal_configs:
		create_portal(portal_config["name"], portal_config["position"], portal_config["color"], portal_config["target_shard"])

func create_portal(name: String, position: Vector3, color: Color, target_shard: String) -> void:
	"""Create an interactive portal to a shard."""
	var portal = Node3D.new()
	portal.name = name
	portal.global_position = position
	
	# Visual mesh (glowing cube)
	var mesh_inst = MeshInstance3D.new()
	var box_mesh = BoxMesh.new()
	box_mesh.size = Vector3(3, 4, 3)
	mesh_inst.mesh = box_mesh
	
	var material = StandardMaterial3D.new()
	material.emission_enabled = true
	material.emission = color
	material.emission_energy_multiplier = 2.0
	material.albedo_color = color.lerp(Color.BLACK, 0.5)
	mesh_inst.set_surface_override_material(0, material)
	
	portal.add_child(mesh_inst)
	
	# Collision area for interaction
	var area_3d = Area3D.new()
	var collision_shape = CollisionShape3D.new()
	var box_shape = BoxShape3D.new()
	box_shape.size = Vector3(3.2, 4.2, 3.2)
	collision_shape.shape = box_shape
	area_3d.add_child(collision_shape)
	portal.add_child(area_3d)
	
	# Script for portal interaction
	var portal_script = preload("res://scripts/components/PortalTrigger.gd")
	if portal_script:
		var script_instance = portal_script.new()
		portal.set_script(portal_script)
		portal.target_shard = target_shard
	
	portals_container.add_child(portal)
	print("[PORTAL] Created: %s -> %s" % [name, target_shard])

func _process(delta: float) -> void:
	"""Game loop for match management and storm simulation."""
	match_timer += delta
	
	# Simulate storm shrinkage (simplified)
	if match_timer > 30.0:  # Every 30 seconds
		storm_radius = max(10.0, storm_radius - 5.0)
		GameStateManager.update_storm_circle(storm_center, storm_radius)
		match_timer = 0.0
	
	# Simulate online activity (random feed updates)
	if randi() % 100 == 0:
		CivicFeedManager.simulate_online_activity()

func _exit_tree() -> void:
	"""Cleanup on scene exit."""
	AudioManager.remove_ambient_layer("city_traffic")
	AudioManager.remove_ambient_layer("neon_hum")
	print("[FOYER] Shutting down...")
