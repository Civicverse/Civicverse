# ShardPortalManager.gd
# Handles seamless additive loading of shards and carrying over player state.

extends Node

signal shard_transition_started(shard_name)
signal shard_transition_completed(shard_name)

var current_shard = null
var foyer_scene = "res://scenes/foyer/TheFoyer.tscn"
var player_foyer_position = Vector3.ZERO

func transition_to_shard(shard_scene_path: String):
	emit_signal("shard_transition_started", shard_scene_path)
	
	# Save current position if in Foyer
	var player = get_tree().get_first_node_in_group("player")
	if player and get_tree().current_scene.name == "TheFoyer":
		player_foyer_position = player.global_position
	
	# Transition logic (Additive or scene change)
	# For simplicity, we'll use change_scene_to_file but keep player state global
	get_tree().change_scene_to_file(shard_scene_path)
	
	# After loading, we would re-instantiate player and sync inventory
	# in a real implementation.
	emit_signal("shard_transition_completed", shard_scene_path)

func return_to_foyer():
	emit_signal("shard_transition_started", "Foyer")
	get_tree().change_scene_to_file(foyer_scene)
	# Logic to place player at player_foyer_position will be handled in TheFoyer _ready
	emit_signal("shard_transition_completed", "Foyer")
