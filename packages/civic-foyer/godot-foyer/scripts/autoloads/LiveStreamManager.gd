# LiveStreamManager.gd
# NEON REIGN CivicWatch Video Integration
# Streams live CivicWatch missions, gameplay, and civic content

extends Node

signal stream_started(stream_name, stream_url)
signal stream_stopped
signal stream_updated(current_viewers)

var active_streams = []
var current_stream = null
var stream_catalog = {
	"CivicMission_Alpha": {"url": "res://assets/videos/civic_mission_alpha.ogv", "title": "Alpha Squad Mission", "viewers": 1200},
	"LandbotProtocol": {"url": "res://assets/videos/landbot_protocol.ogv", "title": "Landbot Verification Live", "viewers": 850},
	"ReputationLeaderboard": {"url": "res://assets/videos/reputation_lb.ogv", "title": "Weekly Leaderboard Update", "viewers": 2100},
	"MerchantsCollective": {"url": "res://assets/videos/merchants.ogv", "title": "Marketplace Showcase", "viewers": 450}
}

func _ready():
	print("[STREAM] Manager initialized with %d catalogs" % stream_catalog.size())

func get_active_streams() -> Array:
	"""Get list of active streams."""
	return active_streams.duplicate()

func start_stream(stream_key: String) -> bool:
	"""Start playing a CivicWatch stream."""
	if not stream_key in stream_catalog:
		push_error("Stream not found: %s" % stream_key)
		return false
	
	var stream_data = stream_catalog[stream_key]
	current_stream = {
		"key": stream_key,
		"title": stream_data["title"],
		"url": stream_data["url"],
		"started_at": Time.get_ticks_msec(),
		"viewers": stream_data["viewers"]
	}
	
	active_streams.append(stream_key)
	emit_signal("stream_started", stream_key, stream_data["url"])
	print("[STREAM] Started: %s (%d viewing)" % [stream_data["title"], stream_data["viewers"]])
	
	return true

func stop_stream() -> void:
	"""Stop current stream."""
	if current_stream:
		active_streams.erase(current_stream["key"])
		print("[STREAM] Stopped: %s" % current_stream["title"])
		current_stream = null
		emit_signal("stream_stopped")

func update_viewer_count() -> void:
	"""Simulate viewer count updates."""
	if current_stream:
		current_stream["viewers"] = max(0, current_stream["viewers"] + randi_range(-100, 150))
		emit_signal("stream_updated", current_stream["viewers"])

func get_stream_info(stream_key: String) -> Dictionary:
	"""Get info about a specific stream."""
	return stream_catalog.get(stream_key, {})

func get_current_stream() -> Dictionary:
	"""Get currently active stream."""
	return current_stream if current_stream else {}

func get_all_streams() -> Dictionary:
	"""Get all available streams."""
	return stream_catalog.duplicate()

func add_custom_stream(stream_key: String, stream_url: String, title: String = "") -> void:
	"""Register a custom stream (for user-generated shards)."""
	stream_catalog[stream_key] = {
		"url": stream_url,
		"title": title if title else stream_key,
		"viewers": 0
	}
	print("[STREAM] Registered custom: %s" % stream_key)

func get_stream_file_path(stream_key: String) -> String:
	"""Get the file path for a stream."""
	if stream_key in stream_catalog:
		return stream_catalog[stream_key].get("url", "")
	return ""
