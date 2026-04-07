# GameStateManager.gd
# Manages game state, multiplayer, rounds, and match data
extends Node

signal player_joined(player_id: int, player_data: Dictionary)
signal player_left(player_id: int)
signal match_started
signal match_ended(winners: Array)
signal storm_circle_updated(center: Vector3, radius: float)

var is_multiplayer: bool = false
var current_match_id: String = ""
var local_player_id: int = 0
var players: Dictionary = {}  # player_id -> player_data
var match_in_progress: bool = false
var eliminations: Array = []  # Track kills for feed

func _ready():
	if OS.has_feature("web"):
		is_multiplayer = false  # Server connection needed for web
	else:
		is_multiplayer = true

func start_match(player_count: int = 16):
	"""Initialize a new match with specified player count."""
	match_in_progress = true
	current_match_id = str(randi_range(100000, 999999))
	print("[MATCH] Started: %s with %d players" % [current_match_id, player_count])
	match_started.emit()

func end_match(winner_ids: Array):
	"""End the current match."""
	match_in_progress = false
	eliminations.clear()
	match_ended.emit(winner_ids)
	print("[MATCH] Ended. Winners: %s" % [winner_ids])

func register_elimination(killer_id: int, victim_id: int, weapon: String = "Unknown"):
	"""Log a kill for the feed."""
	var kill_data = {
		"killer": players.get(killer_id, {}).get("username", "Unknown"),
		"victim": players.get(victim_id, {}).get("username", "Unknown"),
		"weapon": weapon,
		"timestamp": Time.get_ticks_msec()
	}
	eliminations.append(kill_data)
	CivicFeedManager.add_kill_feed_event(kill_data)
	print("[KILL] %s eliminated %s with %s" % [kill_data["killer"], kill_data["victim"], weapon])

func update_storm_circle(center: Vector3, radius: float):
	"""Update the shrinking neon storm zone."""
	storm_circle_updated.emit(center, radius)
