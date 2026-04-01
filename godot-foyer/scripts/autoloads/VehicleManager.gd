# VehicleManager.gd
# Syncs vehicle states across the multiplayer network.

extends Node

func enter_vehicle(vehicle: Node3D, player: CharacterBody3D):
	vehicle.set_multiplayer_authority(player.get_multiplayer_authority())
	player.reparent(vehicle)
	player.hide()
	player.process_mode = PROCESS_MODE_DISABLED
	vehicle.is_occupied = true
	vehicle.driver = player

func exit_vehicle(vehicle: Node3D, player: CharacterBody3D, exit_pos: Vector3):
	player.reparent(get_tree().root)
	player.global_position = exit_pos
	player.show()
	player.process_mode = PROCESS_MODE_INHERIT
	vehicle.is_occupied = false
	vehicle.driver = null
