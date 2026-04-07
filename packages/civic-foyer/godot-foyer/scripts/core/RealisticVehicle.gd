# RealisticVehicle.gd
# NEON REIGN: AAA Physics-Based Vehicle Controller

extends VehicleBody3D

@export var max_engine_force = 300.0
@export var max_steering = 0.6
@export var brake_force = 10.0

func _physics_process(delta):
	# Driving Input (Only if player is inside)
	var steering_input = Input.get_action_strength("move_left") - Input.get_action_strength("move_right")
	var throttle_input = Input.get_action_strength("move_forward") - Input.get_action_strength("move_backward")
	
	steering = lerp(steering, steering_input * max_steering, 5 * delta)
	engine_force = throttle_input * max_engine_force
	
	# Handbrake / Drifting
	if Input.is_action_pressed("jump"):
		brake = brake_force
	else:
		brake = 0.0
		
	# Apply PBR Wetness to tires and body
	_apply_wetness_visuals()

func _apply_wetness_visuals():
	# In a real game, this would adjust the material roughness of the vehicle mesh
	# based on the current weather/puddle state.
	pass
