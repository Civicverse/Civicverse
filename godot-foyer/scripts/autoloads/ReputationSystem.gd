# ReputationSystem.gd
# Core system for tracking karma, trust scores, and DAO weights.

extends Node

signal reputation_changed(new_value)
signal badge_earned(badge_name)

var badges = []

func add_badge(badge_name: String):
	if not badge_name in badges:
		badges.append(badge_name)
		emit_signal("badge_earned", badge_name)
		CivicAvatarManager.update_reputation(50)
