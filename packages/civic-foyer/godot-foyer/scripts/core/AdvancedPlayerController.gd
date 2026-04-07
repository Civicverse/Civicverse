# AdvancedPlayerController.gd
# Elite NEON REIGN Player Controller - Realistic high-fidelity character control
# Features: Smooth hybrid FPS/TPS, realistic parkour, combat, vehicles, avatar system
extends CharacterBody3D

# -- SCENE REFERENCES --
@onready var camera_pivot = $CameraPivot
@onready var camera = $CameraPivot/Camera3D
@onready var animation_tree: AnimationTree = $AnimationTree
@onready var animation_playback: AnimationNodeStateMachinePlayback = animation_tree.get("parameters/playback") if animation_tree else null

# Movement Parameters (realistic physics with inertia)  
const WALK_SPEED = 5.5
const SPRINT_SPEED = 11.0
const JUMP_VELOCITY = 6.5
const JUMP_DOUBLE = 5.0
const GRAVITY = 9.8
const SLIDE_SPEED = 8.0
const VAULT_HEIGHT = 1.2
const MORTLING_TIME = 0.6
const ACCELERATION = 20.0
const SPRINT_ACCELERATION = 30.0
const FRICTION = 15.0
const AIR_FRICTION = 2.0
const MAX_AIR_TIME = 1.5

# Parkour & Advanced Movement
var is_sprinting = false
var is_sliding = false
var is_jumping = false
var is_double_jumping = false
var is_mantling = false
var can_double_jump = true
var can_wall_run = false
var is_wall_running = false
var can_vault = false
var air_time = 0.0
var current_wall_normal = Vector3.UP
var slide_timer = 0.0
var vault_timer = 0.0

# Combat & Weapons
var current_weapon: String = "pistol"
var is_aiming = false
var ads_fov_target = 25.0
var ads_fov_normal = 75.0
var is_breathing = false
var breath_timer = 0.0
var ammo: Dictionary = {
	"pistol": {"max": 100, "current": 100},
	"rifle": {"max": 200, "current": 200},
	"shotgun": {"max": 50, "current": 50},
	"sniper": {"max": 20, "current": 20},
	"energy": {"max": 150, "current": 150}
}
var firing = false
var fire_rate = 0.1
var last_fire_time = 0.0
var recoil_x = 0.0
var recoil_y = 0.0

# Camera
var mouse_sensitivity = 0.003
var camera_smoothing = 0.1
var target_camera_pitch = 0.0
var target_camera_yaw = 0.0

# Vehicle
var in_vehicle = false
var current_vehicle = null

# Avatar & Identity
var civic_id_data: Dictionary = {}
var player_name: String = "Player"
var reputation: int = 0

# State
var current_speed = WALK_SPEED
var velocity_accumulated = Vector3.ZERO

func _ready():
	# Load Civic ID data
	civic_id_data = CivicAvatarManager.get_player_data()
	player_name = civic_id_data.get("username", "Player")
	reputation = civic_id_data.get("reputation", 100)
	
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	
	# Apply high-fidelity materials
	if CivicAvatarManager.loaded_avatar:
		CivicAvatarManager.apply_high_fidelity_pbr(self)
	
	# Setup animation tree
	if animation_tree and animation_playback:
		animation_tree.active = true
		animation_playback.start()
		animation_playback.travel("Idle")
	
	print("[PLAYER] %s ready | Rep: %d | Wallet: %s" % [
		player_name, reputation,
		civic_id_data.get("wallet_address", "unk").substr(0, 8)
	])

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		target_camera_yaw -= event.relative.x * mouse_sensitivity
		target_camera_pitch -= event.relative.y * mouse_sensitivity
		target_camera_pitch = clamp(target_camera_pitch, -PI/2.0, PI/2.0)
	
	if event.is_action_pressed("toggle_feed"):
		CivicFeedManager.toggle_feed()
	
	if event.is_action_pressed("interact"):
		handle_interaction()

func _physics_process(delta: float) -> void:
	if in_vehicle:
		return  # Vehicle controller takes over
	
	# Handle gravity and jumping
	if not is_on_floor():
		air_time += delta
		velocity.y -= GRAVITY * delta
		
		if Input.is_action_just_pressed("jump") and can_double_jump:
			velocity.y = JUMP_VELOCITY
			can_double_jump = false
	else:
		air_time = 0.0
		can_double_jump = true
		
		if Input.is_action_just_pressed("jump"):
			velocity.y = JUMP_VELOCITY
	
	# Movement input
	var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var move_dir = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	# Sprint & Slide
	is_sprinting = Input.is_action_pressed("sprint") and input_dir.length() > 0.1
	is_sliding = Input.is_action_just_pressed("slide") and is_on_floor() and is_sprinting
	
	if is_sliding:
		current_speed = SLIDE_SPEED
		animation_playback.travel("Slide")
	elif is_sprinting:
		current_speed = SPRINT_SPEED
		animation_playback.travel("Sprint")
	elif input_dir.length() > 0.1:
		current_speed = WALK_SPEED
		animation_playback.travel("Walk")
	else:
		current_speed = 0.0
		animation_playback.travel("Idle")
	
	# Apply acceleration/friction
	if move_dir.length() > 0.1:
		velocity_accumulated = velocity_accumulated.lerp(move_dir * current_speed, ACCELERATION * delta)
	else:
		velocity_accumulated = velocity_accumulated.lerp(Vector3.ZERO, FRICTION * delta)
	
	velocity.x = velocity_accumulated.x
	velocity.z = velocity_accumulated.z
	
	# Update camera
	rotation.y = target_camera_yaw
	camera_pivot.rotation.x = target_camera_pitch
	
	# Wall run check
	var space_state = get_world_3d().direct_space_state
	var query = PhysicsRayQueryParameters3D.create(global_position, global_position + transform.basis.z * 0.5)
	var result = space_state.intersect_ray(query)
	can_wall_run = result != null and air_time > 0.1
	
	# Combat
	if Input.is_action_pressed("fire"):
		fire_weapon()
	
	if Input.is_action_pressed("ads"):
		is_aiming = true
	else:
		is_aiming = false
	
	if Input.is_action_pressed("reload"):
		reload_weapon()
	
	move_and_slide()

func fire_weapon() -> void:
	"""Fire the current weapon with realistic recoil and muzzle effects."""
	var current_time = Time.get_ticks_msec()
	if firing or (current_time - last_fire_time) < fire_rate * 1000.0:
		return
	
	firing = true
	last_fire_time = current_time
	
	var weapon_ammo = ammo.get(current_weapon, {})
	if weapon_ammo.get("current", 0) <= 0:
		print("[WEAPON] Out of ammo: %s" % current_weapon)
		firing = false
		return
	
	# Consume ammo
	weapon_ammo["current"] -= 1
	
	# Muzzle flash effect
	var muzzle_pos = camera.global_position + camera.global_transform.basis.z * 0.5
	create_muzzle_flash(muzzle_pos)
	
	# Weapon fire raycast
	var space_state = get_world_3d().direct_space_state
	var query = PhysicsRayQueryParameters3D.create(camera.global_position, camera.global_position + camera.global_transform.basis.z * 1000)
	query.exclude = [self]
	var result = space_state.intersect_ray(query)
	
	# Hit processing
	if result:
		if result.collider is CharacterBody3D:
			var damage = {"pistol": 25, "rifle": 35, "shotgun": 50, "sniper": 100, "energy": 45}.get(current_weapon, 25)
			if result.collider.has_method("take_damage"):
				result.collider.take_damage(damage, player_name, current_weapon)
				GameStateManager.register_elimination(multiplayer.get_unique_id(), result.collider.get_instance_id(), current_weapon)
	
	# Realistic recoil
	recoil_x = randf_range(-0.05, 0.05)
	recoil_y = -randf_range(0.03, 0.08)
	target_camera_pitch += recoil_y
	target_camera_yaw += recoil_x
	
	if animation_playback:
		animation_playback.travel("Fire")
	
	await get_tree().create_timer(fire_rate).timeout
	firing = false

func reload_weapon() -> void:
	"""Reload current weapon to full capacity."""
	var weapon_ammo = ammo.get(current_weapon, {})
	if weapon_ammo and weapon_ammo.get("current", 0) < weapon_ammo.get("max", 0):
		weapon_ammo["current"] = weapon_ammo.get("max", 100)
		if animation_playback:
			animation_playback.travel("Reload")
		print("[RELOAD] %s reloaded to %d" % [current_weapon, weapon_ammo["current"]])

func create_muzzle_flash(position: Vector3) -> void:
	"""Create a simple muzzle flash particle effect."""
	var flash = MeshInstance3D.new()
	var sphere = SphereMesh.new()
	sphere.radii = Vector3(0.1, 0.1, 0.1)
	flash.mesh = sphere
	flash.global_position = position
	get_parent().add_child(flash)
	
	var material = StandardMaterial3D.new()
	material.emission_enabled = true
	material.emission = Color.YELLOW
	material.emission_energy_multiplier = 2.0
	flash.set_surface_override_material(0, material)
	
	await get_tree().create_timer(0.05).timeout
	flash.queue_free()

func handle_interaction() -> void:
	"""Check for nearby interaction objects."""
	var space_state = get_world_3d().direct_space_state
	var query = PhysicsShapeQueryParameters3D.new()
	var sphere = SphereShape3D.new()
	sphere.radius = 2.0
	query.shape = sphere
	query.transform.origin = global_position
	
	var result = space_state.intersect_shape(query)
	for collision in result:
		if collision.collider.has_method("interact"):
			collision.collider.interact(self)
			break

func take_damage(damage: int, attacker: String = "Unknown", weapon: String = "Unknown") -> void:
	"""Called when player takes damage."""
	print("[DAMAGE] %s took %d damage from %s (%s)" % [player_name, damage, attacker, weapon])
	CivicFeedManager.add_damage_indicator(attacker, damage)

func switch_weapon(weapon_name: String) -> void:
	"""Switch to a different weapon."""
	if weapon_name in ammo:
		current_weapon = weapon_name
		animation_playback.travel("WeaponSwitch")

func enter_foyer() -> void:
	"""Re-enter the foyer from a shard."""
	CivicAvatarManager.update_reputation(max(0, reputation + 10))  # Reward for completing shard
	print("[FOYER] Player returned from shard")

func _on_entered_vehicle(vehicle: Node3D) -> void:
	"""Enter a vehicle."""
	in_vehicle = true
	current_vehicle = vehicle
	if vehicle.has_method("set_player_controller"):
		vehicle.set_player_controller(self)

func _on_exited_vehicle() -> void:
	"""Exit current vehicle."""
	in_vehicle = false
	current_vehicle = null
	global_position += transform.basis.z * 2.0  # Eject forward
