# CivicFeedManager.gd
# Manages the in-game X/Twitter-like feed, trending topics, and interactions.

extends Node

signal feed_updated(posts)
signal new_post_received(post)

var posts = []

func _ready():
	# Simulated live feed initialization
	add_placeholder_posts()

func add_placeholder_posts():
	posts = [
		{"user": "CivicAI", "text": "The Foyer is now LIVE! Explore the neon city and claim your shard.", "likes": 420, "reposts": 69, "timestamp": "2m ago"},
		{"user": "Sovereign0", "text": "Just landed at the SocialArena. Anyone down for a match?", "likes": 12, "reposts": 1, "timestamp": "5m ago"},
		{"user": "VaultKeeper", "text": "Reputation tax funds now distributed to UBI pool. Check your wallets!", "likes": 1337, "reposts": 500, "timestamp": "12m ago"}
	]
	emit_signal("feed_updated", posts)

func submit_post(content: String):
	var post = {
		"user": CivicAvatarManager.player_data.username,
		"text": content,
		"likes": 0,
		"reposts": 0,
		"timestamp": "Just now"
	}
	posts.push_front(post)
	emit_signal("new_post_received", post)
	# All social actions affect in-game reputation
	CivicAvatarManager.update_reputation(1)

func like_post(post_index: int):
	posts[post_index].likes += 1
	CivicAvatarManager.update_reputation(1)

func share_post(post_index: int):
	posts[post_index].reposts += 1
	CivicAvatarManager.update_reputation(2)
