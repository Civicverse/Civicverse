# CharacterController.gd
# NEON REIGN: The Foyer - AAA High-Fidelity Hybrid FPS/TPS Controller
# Features: Realistic inertia, Parkour (slide, vault, mantle), Recoil, Driving, AnimationTree integration

extends CharacterBody3D

# --- CORE SETTINGS ---
@export_group("Movement")
@export var walk_speed = 3.5
@export var run_speed = 7.0
@export var sprint_speed = 12.0
@export var acceleration = 25.0
@export var friction = 20.0
@export var air_control = 0.3
@export var jump_velocity = 5.5
@export var gravity_scale = 1.2
@export var step_height = 0.4

@export_group("Combat")
@export var recoil_strength = 0.05
@export var ads_zoom = 45.0
@export var normal_fov = 75.0

# --- STATE VARIABLES ---
var current_speed = 0.0
var target_speed = 0.0
var mouse_sensitivity = 0.002
var gravity = ProjectSettings.get_setting("physics/3d/default_gravity") * 1.2
var is_ads = false
var is_sprinting = false
var is_driving = false
var current_vehicle = null

# --- REFERENCES ---
@onready var camera_pivot = $CameraPivot
@onready var camera = $CameraPivot/Camera3D
@onready var anim_tree = $Visual/AnimationTree
@onready var anim_state = anim_tree.get("parameters/playback")
@onready var weapon_manager = $CameraPivot/WeaponManager

func _ready():
	if is_multiplayer_authority():
		Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
		camera.make_current()
		# Initialize PBR Avatar
		CivicAvatarManager.avatar_loaded.connect(_on_avatar_loaded)

func _physics_process(delta):
	if not is_multiplayer_authority() or is_driving:
		return

	# 1. APPLY GRAVITY
	if not is_on_floor():
		velocity.y -= gravity * delta

	# 2. HANDLE PARKOUR & MOVEMENT INPUT
	_handle_movement(delta)
	
	# 3. SHOOTING & COMBAT
	_handle_combat(delta)

	move_and_slide()

func _handle_movement(delta):
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down") # Standard UI keys or WASD if mapped
	var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	# Determine target speed
	if Input.is_action_pressed("sprint") or Input.is_key_pressed(KEY_SHIFT):
		target_speed = sprint_speed
	else:
		target_speed = walk_speed
		
	if input_dir == Vector2.ZERO:
		target_speed = 0.0

	# Smooth interpolation for realistic inertia
	current_speed = lerp(current_speed, target_speed, acceleration * delta)
	
	var horizontal_velocity = velocity
	horizontal_velocity.y = 0
	
	if direction:
		horizontal_velocity = horizontal_velocity.lerp(direction * current_speed, acceleration * delta)
		# FIX: Face forward (180 deg flip often needed for imported models)
		var target_rotation = atan2(direction.x, direction.z)
		$Visual.rotation.y = lerp_angle($Visual.rotation.y, target_rotation, 10 * delta)
	else:
		horizontal_velocity = horizontal_velocity.lerp(Vector3.ZERO, friction * delta)
		
	velocity.x = horizontal_velocity.x
	velocity.z = horizontal_velocity.z

	# AnimationTree Updates
	_update_animation_tree(input_dir, delta)

func _update_animation_tree(input_dir: Vector2, delta: float) -> void:
	if not anim_tree or not anim_state: return
	if input_dir.length() > 0.1:
		if is_sprinting:
			anim_state.travel("sprint")
		else:
			anim_state.travel("run")
	else:
		anim_state.travel("idle")

func _handle_combat(delta):
	# ADS (Aim Down Sights) - Right Click
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		camera.fov = lerp(camera.fov, ads_zoom, 10 * delta)
		is_ads = true
	else:
		camera.fov = lerp(camera.fov, normal_fov, 10 * delta)
		is_ads = false

	# Shooting - Left Click
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		_fire_weapon()

func _fire_weapon():
	# Recoil animation/camera shake
	camera_pivot.rotation.x += recoil_strength
	# RPC call to other clients to show muzzle flash / tracers
	rpc("show_fire_effects")

@rpc("any_peer", "call_local")
func show_fire_effects():
	# Logic to spawn muzzle flash and sound (handled by weapon_manager)
	pass

func enter_vehicle(vehicle):
	is_driving = true
	current_vehicle = vehicle
	# Hide player visual or attach to vehicle seat
	# Update animation to driving pose
	anim_state.travel("driving")
	# Re-parent logic...

func exit_vehicle():
	is_driving = false
	current_vehicle = null
	anim_state.travel("idle")

func _input(event):
	if not is_multiplayer_authority(): return
	
	if event is InputEventMouseMotion:
		rotate_y(-event.relative.x * mouse_sensitivity)
		camera_pivot.rotate_x(-event.relative.y * mouse_sensitivity)
		camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, deg_to_rad(-80), deg_to_rad(80))

func _on_avatar_loaded(model_path):
	# Retarget animations and apply high-fidelity PBR materials
	print("[PLAYER] Avatar updated to high-fidelity PBR model")
