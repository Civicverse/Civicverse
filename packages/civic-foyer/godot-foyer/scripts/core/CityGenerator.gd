# CityGenerator.gd
# NEON REIGN: Procedural High-Density City Generator
# Creates a GTA-like vertical metropolis with neon, lights, and PBR props.

extends Node3D

@export var city_size = Vector2(200, 200)
@export var building_density = 0.4
@export var min_height = 20.0
@export var max_height = 120.0

const STREET_MAT = preload("res://assets/shaders/wet_street_pbr.gdshader")
const NEON_MAT = preload("res://assets/shaders/neon_pbr_high_fidelity.gdshader")

func _ready():
	generate_city()

func generate_city():
	# 1. Base Ground (Infinite Wet Street)
	var ground = CSGBox3D.new()
	ground.size = Vector3(city_size.x * 2, 1, city_size.y * 2)
	ground.position.y = -0.5
	ground.use_collision = true
	var mat = ShaderMaterial.new()
	mat.shader = STREET_MAT
	ground.material = mat
	add_child(ground)
	
	# 2. Generate Buildings & Palm Trees
	var step = 25.0
	for x in range(-city_size.x, city_size.x, step):
		for z in range(-city_size.y, city_size.y, step):
			if (abs(x) < 15 and abs(z) < 15): continue # Keep spawn clear
			
			if randf() < building_density:
				_spawn_tower(Vector3(x, 0, z))
				_spawn_street_light(Vector3(x + step/2, 0, z + step/2))
			
			# Add palm trees along "boulevards"
			if abs(x) % 50 == 0:
				_spawn_palm_tree(Vector3(x + 5, 0, z))
				_spawn_palm_tree(Vector3(x - 5, 0, z))

func _spawn_palm_tree(pos: Vector3):
	var trunk = CSGCylinder3D.new()
	trunk.radius = 0.3
	trunk.height = 8.0 + randf() * 4.0
	trunk.position = pos + Vector3(0, trunk.height/2, 0)
	
	# PBR Trunk Material
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.3, 0.2, 0.1)
	mat.roughness = 0.9
	trunk.material = mat
	add_child(trunk)
	
	# Simple procedural canopy (fronds)
	for i in range(8):
		var frond = CSGBox3D.new()
		frond.size = Vector3(4.0, 0.1, 0.8)
		frond.position = Vector3(0, trunk.height/2, 0)
		frond.rotation.y = i * PI/4
		frond.rotation.z = PI/6
		
		var f_mat = ShaderMaterial.new()
		f_mat.shader = NEON_MAT
		f_mat.set_shader_parameter("albedo_color", Color(0.1, 0.4, 0.1))
		f_mat.set_shader_parameter("neon_accent_color", Color.CYAN if randf() > 0.5 else Color.MAGENTA)
		f_mat.set_shader_parameter("neon_accent_strength", 1.5)
		frond.material = f_mat
		trunk.add_child(frond)

func _spawn_tower(pos: Vector3):
	var h = randf_range(min_height, max_height)
	var w = randf_range(10, 20)
	
	var tower = CSGBox3D.new()
	tower.size = Vector3(w, h, w)
	tower.position = pos + Vector3(0, h/2, 0)
	
	var mat = ShaderMaterial.new()
	mat.shader = STREET_MAT # Reuse dark reflective mat
	tower.material = mat
	add_child(tower)
	
	# Add Neon Accents (Windows/Signs)
	for i in range(5):
		_add_neon_strip(tower, h, w)

func _add_neon_strip(parent: Node3D, h: float, w: float):
	var strip = CSGBox3D.new()
	var side = randi() % 4
	var colors = [Color.CYAN, Color.MAGENTA, Color.YELLOW, Color.SPRING_GREEN]
	var color = colors[randi() % colors.size()]
	
	strip.size = Vector3(w + 0.2, 1.0, 0.2)
	if side > 1: strip.size = Vector3(0.2, 1.0, w + 0.2)
	
	strip.position.y = randf_range(-h/2 + 2, h/2 - 2)
	
	var mat = ShaderMaterial.new()
	mat.shader = NEON_MAT
	mat.set_shader_parameter("neon_accent_color", color)
	mat.set_shader_parameter("neon_accent_strength", 5.0)
	strip.material = mat
	parent.add_child(strip)

func _spawn_street_light(pos: Vector3):
	var pole = CSGCylinder3D.new()
	pole.radius = 0.2
	pole.height = 8.0
	pole.position = pos + Vector3(0, 4, 0)
	add_child(pole)
	
	var light = OmniLight3D.new()
	light.position = Vector3(0, 4, 0)
	light.light_color = Color(1.0, 0.8, 0.5)
	light.light_energy = 2.0
	light.omni_range = 15.0
	light.shadow_enabled = true
	pole.add_child(light)
