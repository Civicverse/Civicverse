extends Node3D

@onready var portal_ui = $UI/PortalUI
@onready var newsstand_ui = $UI/NewsstandUI
@onready var commerce_ui = $UI/CommerceUI
@onready var social_arena_ui = $UI/SocialArenaUI

var peer = ENetMultiplayerPeer.new()
@export var player_scene: PackedScene

func _ready():
	# JavaScript bridge for bidirectional communication
	if OS.has_feature("web"):
		var js_bridge = JavaScriptBridge.get_interface("window")
		if js_bridge:
			# Define a callback for JavaScript to call Godot
			var callback = JavaScriptBridge.create_callback(_on_js_event)
			js_bridge.setGodotCallback(callback)
			
	# Basic multiplayer setup
	# In a real scenario, you'd connect to a dedicated server or use WebRTC for browser
	# For this lite version, we'll just spawn the local player
	_spawn_player(1)
	
	# Future: Connect to backend WS
	# var ws_url = "ws://localhost:8080/foyer"
	# _connect_to_multiplayer(ws_url)

func _connect_to_multiplayer(url):
	# Placeholder for WebSocketPeer setup
	pass

func _spawn_player(id):
	var player = player_scene.instantiate()
	player.name = str(id)
	player.set_multiplayer_authority(id)
	add_child(player)
	player.global_position = $SpawnPoint.global_position

func _on_js_event(args):
	var event_name = args[0]
	var data = args[1]
	
	match event_name:
		"update_identity":
			# Find local player and update
			var local_player = get_node_or_null(str(multiplayer.get_unique_id()))
			if local_player:
				local_player.character_data = data
				local_player.update_visuals()
				local_player.rpc("sync_character_data", data)
		"logout":
			# Exit to React
			_exit_to_react()

func _on_social_arena_body_entered(body):
	if body.is_in_group("player") and body.is_multiplayer_authority():
		social_arena_ui.show()

func _on_social_arena_body_exited(body):
	if body.is_in_group("player") and body.is_multiplayer_authority():
		social_arena_ui.hide()

func _on_universe_portal_body_entered(body):
	if body.is_in_group("player") and body.is_multiplayer_authority():
		portal_ui.show()
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

func _on_exit_portal_pressed():
	_exit_to_react()

func _exit_to_react():
	if OS.has_feature("web"):
		var js_bridge = JavaScriptBridge.get_interface("window")
		if js_bridge:
			js_bridge.exitFoyer()
	else:
		get_tree().quit()
