# ReputationSystem.gd
# NEON REIGN Reputation & Progression System
# Tracks karma, trust scores, DAO voting weight, skill trees, and cosmetic unlocks

extends Node

signal reputation_changed(old_val, new_val)
signal badge_earned(badge_name, description)
signal rank_changed(new_rank, rank_name)
signal cosmetic_unlocked(cosmetic_name)

var badges = []
var cosmetics_unlocked = []
var current_rank = 0
var rank_names = [
	"Newcomer",
	"Civic Contributor",
	"Trusted Member",
	"Reputation Pioneer",
	"Neon Guardian",
	"Sovereign Elite",
	"Civic Legend"
]

var rank_thresholds = [0, 100, 500, 1000, 2500, 5000, 10000]

var badge_definitions = {
	"first_kill": {"name": "First Blood", "description": "Earned your first elimination", "points": 50},
	"triple_kill": {"name": "Triple Kill", "description": "3 eliminations in rapid succession", "points": 100},
	"win_streak_5": {"name": "Dominator", "description": "Won 5 matches in a row", "points": 150},
	"community_contributor": {"name": "UBI Supporter", "description": "Contributed to community fund", "points": 25},
	"veteran_100": {"name": "Centennial", "description": "Completed 100 matches", "points": 200},
	"social_butterfly": {"name": "Social Butterfly", "description": "Posted 50 times in CivicFeed", "points": 75},
	"marketplace_trader": {"name": "Merchant", "description": "Completed 20 marketplace transactions", "points": 80}
}

var cosmetic_definitions = {
	"neon_cyan_suit": {"rep_required": 100, "description": "Glowing cyan tactical suit"},
	"magenta_visor": {"rep_required": 200, "description": "Bright magenta AR visor"},
	"gold_nano_armor": {"rep_required": 500, "description": "Neural-reactive gold armor plating"},
	"holographic_wings": {"rep_required": 1000, "description": "Shimmering holographic particle wings"},
	"void_cloak": {"rep_required": 2500, "description": "Dark matter-infused invisibility cloak"},
	"crowned_sovereign": {"rep_required": 5000, "description": "Golden crown of civic sovereignty"}
}

func _ready():
	print("[REPUTATION] System initialized with %d ranks and %d badges" % [rank_names.size(), badge_definitions.size()])

func add_badge(badge_key: String) -> bool:
	"""Earn a badge and add to collection."""
	if badge_key in badges:
		return false  # Already earned
	
	if not badge_key in badge_definitions:
		push_error("Unknown badge: %s" % badge_key)
		return false
	
	var badge = badge_definitions[badge_key]
	badges.append(badge_key)
	
	# Update reputation
	var points = badge.get("points", 50)
	CivicAvatarManager.update_reputation(points)
	
	emit_signal("badge_earned", badge_key, badge["description"])
	print("[BADGE] Earned: %s (+%d rep)" % [badge["name"], points])
	
	# Check for rank up
	_check_rank_up()
	
	return true

func _check_rank_up() -> void:
	"""Check if player has advanced to a new rank."""
	var current_rep = CivicAvatarManager.player_data.get("reputation", 0)
	var new_rank = 0
	
	for i in range(rank_thresholds.size() - 1, -1, -1):
		if current_rep >= rank_thresholds[i]:
			new_rank = i
			break
	
	if new_rank > current_rank:
		current_rank = new_rank
		emit_signal("rank_changed", current_rank, rank_names[current_rank])
		print("[RANK UP] Now: %s" % rank_names[current_rank])

func get_current_rank() -> String:
	"""Get current rank name."""
	return rank_names[current_rank] if current_rank < rank_names.size() else "Unknown"

func check_cosmetic_unlock(cosmetic_key: String) -> bool:
	"""Check if a cosmetic can be unlocked."""
	if cosmetic_key in cosmetics_unlocked:
		return true  # Already unlocked
	
	if not cosmetic_key in cosmetic_definitions:
		return false
	
	var current_rep = CivicAvatarManager.player_data.get("reputation", 0)
	var required_rep = cosmetic_definitions[cosmetic_key].get("rep_required", 0)
	
	if current_rep >= required_rep:
		cosmetics_unlocked.append(cosmetic_key)
		emit_signal("cosmetic_unlocked", cosmetic_key)
		print("[COSMETIC] Unlocked: %s" % cosmetic_key)
		return true
	
	return false

func get_all_cosmetics() -> Dictionary:
	"""Get all available cosmetics."""
	return cosmetic_definitions.duplicate()

func get_unlocked_cosmetics() -> Array:
	"""Get player's unlocked cosmetics."""
	return cosmetics_unlocked.duplicate()

func get_all_badges() -> Dictionary:
	"""Get all available badges."""
	return badge_definitions.duplicate()

func get_earned_badges() -> Array:
	"""Get player's earned badges."""
	return badges.duplicate()

func get_progress_to_next_rank() -> Dictionary:
	"""Get progress towards next rank."""
	var current_rep = CivicAvatarManager.player_data.get("reputation", 0)
	var current_threshold = rank_thresholds[current_rank]
	var next_threshold = rank_thresholds[current_rank + 1] if current_rank + 1 < rank_thresholds.size() else rank_thresholds[-1]
	
	var progress = float(current_rep - current_threshold) / float(next_threshold - current_threshold)
	
	return {
		"current_rank": rank_names[current_rank],
		"next_rank": rank_names[current_rank + 1] if current_rank + 1 < rank_names.size() else "Max",
		"current_rep": current_rep,
		"next_threshold": next_threshold,
		"progress_percent": min(progress, 1.0) * 100.0
	}
