# PlayerController.gd
# Advanced 3D Character Controller for NEON REIGN.
# Includes Parkour, Shooting, Driving, and Social Integration.

extends CharacterBody3D

@onready var camera_pivot = $CameraPivot
@onready var camera = $CameraPivot/Camera3D
@onready var interact_ray = $CameraPivot/Camera3D/InteractRay
@onready var weapon_manager = $WeaponManager

# Movement Settings
const SPEED = 7.0
const SPRINT_SPEED = 12.0
const JUMP_VELOCITY = 6.5
const GRAVITY = 15.0

# Parkour Variables
var is_sliding = false
var can_double_jump = true
var is_wall_running = false

# Input Variables
var mouse_sensitivity = 0.002
var direction = Vector3.ZERO

func _ready():
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	# Apply initial Civic ID avatar visuals
	CivicAvatarManager.apply_neon_visuals(self)

func _input(event):
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * mouse_sensitivity)
		camera_pivot.rotate_x(-event.relative.y * mouse_sensitivity)
		camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, -deg_to_rad(80), deg_to_rad(80))
	
	if event.is_action_pressed("toggle_feed"):
		toggle_civic_feed()
	
	if event.is_action_pressed("interact"):
		handle_interaction()

func _physics_process(delta):
	# Add Gravity
	if not is_on_floor() and not is_wall_running:
		velocity.y -= GRAVITY * delta

	# Handle Jump / Double Jump
	if Input.is_action_just_pressed("ui_accept"):
		if is_on_floor():
			velocity.y = JUMP_VELOCITY
			can_double_jump = true
		elif can_double_jump:
			velocity.y = JUMP_VELOCITY
			can_double_jump = false

	# Handle Sprint/Slide
	var current_speed = SPEED
	if Input.is_action_pressed("sprint"):
		current_speed = SPRINT_SPEED
	
	# Movement Logic
	var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	if direction:
		velocity.x = direction.x * current_speed
		velocity.z = direction.z * current_speed
	else:
		velocity.x = move_toward(velocity.x, 0, current_speed)
		velocity.z = move_toward(velocity.z, 0, current_speed)

	move_and_slide()
	
	# Handle Shooting
	if Input.is_action_pressed("fire") and weapon_manager:
		weapon_manager.fire()

func handle_interaction():
	if interact_ray.is_colliding():
		var target = interact_ray.get_collider()
		if target.has_method("interact"):
			target.interact(self)

func toggle_civic_feed():
	# UI Logic to show/hide the CivicFeed panel
	print("Toggling CivicFeed Social Media Layer...")
	# Emit signal to UI singleton
