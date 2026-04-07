extends CharacterBody3D

const SPEED = 5.0
const JUMP_VELOCITY = 4.5
const ROTATION_SPEED = 10.0

# Get the gravity from the project settings to be synced with RigidBody nodes.
var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

@onready var visual = $Visual
@onready var camera_pivot = $CameraPivot
@onready var anim_player = $Visual/AnimationPlayer
@onready var name_tag = $NameTag

var character_data = {
	"username": "Unknown Citizen",
	"trustScore": 0,
	"level": 1,
	"customization": {
		"skinColor": "#ffffff",
		"shirtColor": "#333333",
		"pantsColor": "#111111"
	}
}

func _ready():
	# If we're the local player
	if is_multiplayer_authority():
		Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
		$CameraPivot/SpringArm3D/Camera3D.make_current()
		
		# Try to get data from JavaScript if running on Web
		if OS.has_feature("web"):
			var js_bridge = JavaScriptBridge.get_interface("window")
			if js_bridge:
				var data = js_bridge.getCivicID()
				if data:
					# Assuming data is a Dictionary passed from JS
					character_data = data
					update_visuals()
					rpc("sync_character_data", character_data)

func _physics_process(delta):
	if not is_multiplayer_authority():
		return

	# Add the gravity.
	if not is_on_floor():
		velocity.y -= gravity * delta

	# Handle Jump.
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = JUMP_VELOCITY

	# Get the input direction
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	# Rotate direction based on camera
	direction = direction.rotated(Vector3.UP, camera_pivot.rotation.y)

	if direction:
		velocity.x = direction.x * SPEED
		velocity.z = direction.z * SPEED
		
		# Rotate visual to face direction
		var target_rotation = atan2(direction.x, direction.z)
		visual.rotation.y = lerp_angle(visual.rotation.y, target_rotation, ROTATION_SPEED * delta)
		
		if anim_player and anim_player.has_animation("run"):
			anim_player.play("run")
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		velocity.z = move_toward(velocity.z, 0, SPEED)
		
		if anim_player and anim_player.has_animation("idle"):
			anim_player.play("idle")

	move_and_slide()

@rpc("any_peer", "call_local")
func sync_character_data(data):
	character_data = data
	update_visuals()

func update_visuals():
	if name_tag:
		name_tag.text = character_data.username
		if character_data.has("verified") and character_data.verified:
			name_tag.text += " [✓]"
	
	# Update colors based on customization
	if character_data.has("customization"):
		var cust = character_data.customization
		if cust.has("skinColor"):
			_set_material_color("Skin", Color(cust.skinColor))
		if cust.has("shirtColor"):
			_set_material_color("Shirt", Color(cust.shirtColor))
		if cust.has("pantsColor"):
			_set_material_color("Pants", Color(cust.pantsColor))

func _set_material_color(mesh_name: String, color: Color):
	# Placeholder for material update logic
	pass

func _input(event):
	if not is_multiplayer_authority():
		return

	if event is InputEventMouseMotion:
		camera_pivot.rotate_y(-event.relative.x * 0.005)
		var spring_arm = camera_pivot.get_node("SpringArm3D")
		spring_arm.rotate_x(-event.relative.y * 0.005)
		spring_arm.rotation.x = clamp(spring_arm.rotation.x, -1.2, 0.5)
	
	if event.is_action_pressed("ui_cancel"):
		if Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		else:
			Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
