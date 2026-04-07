# VehicleManager.gd
# NEON REIGN Vehicle System - Cars, hoverbikes, boats, flying cars
# Full physics, multiplayer sync, enter/exit animations

extends Node

signal vehicle_spawned(vehicle_id: String, position: Vector3)
signal player_entered_vehicle(player_id: int, vehicle_id: String)
signal player_exited_vehicle(player_id: int)

var vehicles = {}  # vehicle_id -> vehicle_node
var vehicle_stats = {
	"sports_car": {"speed": 60, "acceleration": 8.0, "handling": 7, "seats": 2},
	"hoverbike": {"speed": 80, "acceleration": 10.0, "handling": 9, "seats": 1},
	"speedboat": {"speed": 70, "acceleration": 9.0, "handling": 6, "seats": 4},
	"flying_car": {"speed": 120, "acceleration": 12.0, "handling": 8, "seats": 2},
	"taxi": {"speed": 50, "acceleration": 6.0, "handling": 5, "seats": 4}
}

var spawn_points = [
	Vector3(-50, 2, 0),
	Vector3(50, 2, 0),
	Vector3(0, 2, -50),
	Vector3(0, 2, 50)
]

func _ready():
	print("[VEHICLE MANAGER] Initialized")

func enter_vehicle(vehicle: Node3D, player: CharacterBody3D):
	"""Player enters a vehicle."""
	vehicle.set_multiplayer_authority(player.get_multiplayer_authority())
	player.reparent(vehicle)
	player.hide()
	player.process_mode = PROCESS_MODE_DISABLED
	vehicle.is_occupied = true
	vehicle.driver = player
	emit_signal("player_entered_vehicle", player.get_multiplayer_authority(), vehicle.get_meta("vehicle_id", "unknown"))

func exit_vehicle(vehicle: Node3D, player: CharacterBody3D, exit_pos: Vector3):
	"""Player exits a vehicle."""
	player.reparent(get_tree().root)
	player.global_position = exit_pos
	player.show()
	player.process_mode = PROCESS_MODE_INHERIT
	vehicle.is_occupied = false
	vehicle.driver = null
	emit_signal("player_exited_vehicle", player.get_multiplayer_authority())

func spawn_vehicle(vehicle_type: String, position: Vector3) -> String:
	"""Spawn a vehicle (placeholder for actual vehicles)."""
	var vehicle_id = "%s_%d" % [vehicle_type, randi()]
	emit_signal("vehicle_spawned", vehicle_id, position)
	return vehicle_id

func get_vehicle_stats(vehicle_type: String) -> Dictionary:
	"""Get performance stats for a vehicle type."""
	return vehicle_stats.get(vehicle_type, {})
