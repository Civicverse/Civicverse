# AudioManager.gd
# Manages all game audio: music, SFX, VOIP, ambient
extends Node

var master_volume: float = 0.7
var sfx_volume: float = 0.8
var music_volume: float = 0.6
var voice_volume: float = 0.8

var ambient_players: Dictionary = {}  # Named ambient layers
var current_music: AudioStreamPlayer = null

func _ready():
	AudioServer.bus_mute_get_index(AudioServer.get_bus_index("Master"))

func play_sfx(sound_path: String, volume_db: float = 0.0, pitch: float = 1.0) -> AudioStreamPlayer:
	"""Play a one-shot sound effect."""
	var player = AudioStreamPlayer.new()
	player.bus = "SFX"
	player.volume_db = volume_db
	player.pitch_scale = pitch
	add_child(player)
	
	var stream = load(sound_path)
	if stream:
		player.stream = stream
		player.play()
		await player.finished
		player.queue_free()
	
	return player

func play_music(music_path: String, fade_in: float = 2.0):
	"""Play background music with fade in."""
	if current_music:
		if current_music.stream.resource_path == music_path:
			return  # Already playing
		current_music.queue_free()
	
	current_music = AudioStreamPlayer.new()
	current_music.bus = "Music"
	current_music.volume_db = linear2db(music_volume) - 80  # Start silent
	add_child(current_music)
	
	var stream = load(music_path)
	if stream:
		current_music.stream = stream
		current_music.play()
		var tween = create_tween()
		tween.tween_property(current_music, "volume_db", linear2db(music_volume), fade_in)

func add_ambient_layer(layer_name: String, sound_path: String, loop: bool = true):
	"""Add a looping ambient sound layer."""
	if layer_name in ambient_players:
		return  # Already playing
	
	var player = AudioStreamPlayer.new()
	player.bus = "Ambient"
	player.volume_db = -10
	add_child(player)
	
	var stream = load(sound_path)
	if stream:
		if loop:
			stream.loop_mode = AudioStreamMP3.LOOP_FORWARD
		player.stream = stream
		player.play()
		ambient_players[layer_name] = player

func remove_ambient_layer(layer_name: String):
	"""Stop and remove an ambient layer."""
	if layer_name in ambient_players:
		ambient_players[layer_name].queue_free()
		ambient_players.erase(layer_name)

func set_bus_volume(bus_name: String, volume: float):
	"""Set volume for a specific audio bus (0.0 to 1.0)."""
	var bus_idx = AudioServer.get_bus_index(bus_name)
	if bus_idx != -1:
		AudioServer.set_bus_mute(bus_idx, volume == 0.0)
		AudioServer.set_bus_volume_db(bus_idx, linear2db(volume))
