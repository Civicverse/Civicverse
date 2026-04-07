# RealisticWeapon.gd
# NEON REIGN: AAA High-Detail Weapon Controller

extends Node3D

@export var fire_rate = 0.15
@export var damage = 25.0
@export var recoil_amount = 0.08
@export var muzzle_flash_path: String = "res://assets/particles/muzzle_flash.tscn"

var can_fire = true

func fire():
	if not can_fire: return
	can_fire = false
	
	# Recoil Animation (Procedural)
	var tween = get_tree().create_tween()
	tween.tween_property(self, "position:z", 0.05, 0.05).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "position:z", 0.0, 0.1).set_ease(Tween.EASE_IN)
	
	# Muzzle Flash logic
	_spawn_muzzle_flash()
	
	# Wait for fire rate
	await get_tree().create_timer(fire_rate).timeout
	can_fire = true

func _spawn_muzzle_flash():
	# Instance the PBR muzzle flash particle effect
	pass
