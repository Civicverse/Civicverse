# PortalTrigger.gd
# Handles portal interactions and shard transitions with full avatar/inventory carryover

extends Node3D

var target_shard: String = ""
var can_interact = false

func _ready():
	var area = get_node_or_null("Area3D")
	if area:
		area.area_entered.connect(_on_area_entered)
		area.area_exited.connect(_on_area_exited)

func _on_area_entered(area: Area3D) -> void:
	"""Player entered portal range."""
	if area.is_in_group("player"):
		can_interact = true
		print("[PORTAL] %s ready to interact" % name)

func _on_area_exited(area: Area3D) -> void:
	"""Player left portal range."""
	if area.is_in_group("player"):
		can_interact = false

func interact(player: Node3D) -> void:
	"""Handle portal interaction."""
	if not can_interact or target_shard.is_empty():
		return
	
	print("[PORTAL] %s entering shard: %s" % [player.name, target_shard])
	
	# Save player state
	var player_state = {
		"position": player.global_position,
		"rotation": player.global_rotation,
		"health": player.get_meta("health", 100) if player.has_meta("health") else 100,
		"reputation": CivicAvatarManager.player_data.get("reputation", 100),
		"wallet": WalletManager.get_balance(),
		"inventory": {},  # Would contain weapons, ammo, etc.
		"avatar_data": CivicAvatarManager.player_data.duplicate()
	}
	
	# Store in global state manager
	GameStateManager.set_meta("last_foyer_position", player.global_position)
	GameStateManager.set_meta("player_state_before_shard", player_state)
	
	# Load shard
	ShardPortalManager.load_shard(target_shard, player)

func _input_event(camera: Node, event: InputEvent, position: Vector3, normal: Vector3, shape_idx: int) -> void:
	"""Handle click-based interaction."""
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if can_interact:
			interact(get_tree().root.get_child(0))  # Get player reference
