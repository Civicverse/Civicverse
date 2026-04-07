extends Node
## Main Game Entry Point - Loads CommunityHub as entry, then foyer

func _ready() -> void:
	# Set window properties
	get_window().title = "🌃 NEON REIGN: THE FOYER"
	get_window().custom_minimum_size = Vector2(1920, 1080)
	
	# Load community hub UI as main entry point
	var community_hub = load("res://scenes/ui/CommunityHub.tscn").instantiate()
	add_child(community_hub)
	
	print("[MAIN] Community Hub loaded as entry point!")
	print("[MAIN] 🌃 NEON REIGN: THE FOYER - Welcome to the social hub")
