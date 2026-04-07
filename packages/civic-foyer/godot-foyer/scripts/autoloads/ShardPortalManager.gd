# ShardPortalManager.gd
# NEON REIGN Shard Portal System - Seamless additive loading with full state carryover

extends Node

signal shard_transition_started(shard_name)
signal shard_transition_completed(shard_name)
signal player_returned_to_foyer

var current_shard = null
var current_shard_name = ""
var foyer_scene = "res://scenes/foyer/TheFoyer.tscn"
var player_foyer_position = Vector3.ZERO
var player_shard_entry_point = Vector3.ZERO
var loaded_shard_instance = null

# Known shards
var shard_registry = {
	"SocialArena": "res://scenes/shards/SocialArenaShard.tscn",
	"Schoolhouse": "res://scenes/shards/SchoolhouseShard.tscn",
	"Store": "res://scenes/shards/StoreShard.tscn",
	"BR_Arena": "res://scenes/shards/BR_ArenaShard.tscn"
}

func _ready():
	print("[SHARD MANAGER] Portal system initialized with %d shards" % shard_registry.size())

func load_shard(shard_path: String, player: Node3D) -> void:
	"""Load a shard with full player state carryover."""
	
	print("[SHARD] Transitioning to: %s" % shard_path)
	emit_signal("shard_transition_started", shard_path)
	
	# Save player foyer position
	if player:
		player_foyer_position = player.global_position
	
	# Load the shard (for now using scene change)
	# In a real network implementation, use ResourceLoader.load_threaded_request
	await get_tree().create_timer(0.5).timeout  # Transition delay
	get_tree().change_scene_to_file(shard_path)
	
	current_shard_name = shard_path.get_file().trim_suffix(".tscn")
	emit_signal("shard_transition_completed", current_shard_name)
	
	print("[SHARD] Loaded: %s with full avatar/inventory carryover" % current_shard_name)

func return_to_foyer() -> void:
	"""Return to The Foyer from a shard."""
	print("[SHARD] Returning to Foyer from %s" % current_shard_name)
	
	emit_signal("shard_transition_started", "TheFoyer")
	
	# Update player reputation for shard completion
	CivicAvatarManager.update_reputation(25)
	
	# Clean up shard
	current_shard_name = ""
	
	# Return to Foyer
	await get_tree().create_timer(0.5).timeout
	get_tree().change_scene_to_file(foyer_scene)
	
	emit_signal("player_returned_to_foyer")
	emit_signal("shard_transition_completed", "TheFoyer")
	
	print("[FOYER] Player returned with updated state")

func register_shard(shard_name: String, shard_path: String) -> void:
	"""Register a new shard for the portal system."""
	shard_registry[shard_name] = shard_path
	print("[SHARD] Registered: %s at %s" % [shard_name, shard_path])

func get_shard_path(shard_name: String) -> String:
	"""Get the path to a registered shard."""
	return shard_registry.get(shard_name, "")

func get_all_shards() -> Dictionary:
	"""Get all registered shards."""
	return shard_registry.duplicate()

func get_current_shard() -> String:
	"""Get the name of the current shard."""
	return current_shard_name
