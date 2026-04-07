# CivicFeedManager.gd
# NEON REIGN Social Media Layer - X/Twitter/Instagram integrated into gameplay
# Features: feed, kill feed, trending, video streams, chat, reputation-based content

extends Node

signal feed_updated(posts)
signal new_post_received(post)
signal kill_feed_event(kill_data)
signal damage_indicator(attacker, damage)
signal feed_visibility_changed(visible)
signal new_chat_message(username, message, is_local)

var posts = []
var kill_feed = []  # Last 10 kills in match
var chat_messages = []
var trending_topics = []
var active_video_stream = null
var feed_visible = false
var video_streams = [
	"CivicWatch Mission Alpha",
	"SocialArena Championship Live",
	"Marketplace Showcase",
	"Reputation Leaderboard Update"
]

func _ready():
	add_placeholder_posts()
	update_trending_topics()
	print("[CIVIC FEED] Social media layer initialized")

func add_placeholder_posts():
	"""Initialize feed with realistic civic-focused posts."""
	posts = [
		{
			"user": "CivicAI_Official",
			"text": "🌃 NEON REIGN: The Foyer is LIVE! Explore the cyber-tropical city, earn reputation, and join the decentralized revolution.",
			"likes": 4200,
			"reposts": 690,
			"replies": 142,
			"timestamp": "2m ago",
			"has_media": false,
			"verified": true,
			"reputation_required": 0
		},
		{
			"user": "Sovereign0x",
			"text": "Just hit 5-kill streak at the SocialArena! Neon Reign is absolutely insane 🔥",
			"likes": 543,
			"reposts": 89,
			"replies": 23,
			"timestamp": "5m ago",
			"has_media": true,
			"verified": false,
			"reputation_required": 10
		},
		{
			"user": "VaultKeeper",
			"text": "💰 Weekly reputation tax distribution complete! 1% microtax funded UBI pool increased to 42,000 CIVIC tokens.",
			"likes": 13370,
			"reposts": 5000,
			"replies": 892,
			"timestamp": "12m ago",
			"has_media": false,
			"verified": true,
			"reputation_required": 0
		},
		{
			"user": "NFT_Wearables",
			"text": "✨ New neon cyber-gear collection drops tomorrow! Limited edition cell-shader cosmetics for your avatar.",
			"likes": 892,
			"reposts": 234,
			"replies": 156,
			"timestamp": "45m ago",
			"has_media": true,
			"verified": true,
			"reputation_required": 50
		}
	]
	emit_signal("feed_updated", posts)
	print("[FEED] Loaded %d posts" % posts.size())

func update_trending_topics():
	"""Update trending topics based on player reputation and location."""
	var reputation = CivicAvatarManager.player_data.get("reputation", 100)
	
	trending_topics = [
		{"tag": "#NeonReign", "count": 42000, "trend_rank": 1},
		{"tag": "#BR_Arena", "count": 15000, "trend_rank": 2},
		{"tag": "#CivicID", "count": 12500, "trend_rank": 3},
		{"tag": "#DecentralizedGaming", "count": 9800, "trend_rank": 4},
		{"tag": "#ReputationEconomy", "count": 7600, "trend_rank": 5},
		{"tag": "#MetaverseShard", "count": 5400, "trend_rank": 6}
	]
	
	# High-reputation players see exclusive topics
	if reputation > 1000:
		trending_topics.insert(0, {"tag": "#EliteLeague", "count": 3200, "trend_rank": 0})

func submit_post(content: String) -> void:
	"""Create a new post in the feed."""
	var post = {
		"user": CivicAvatarManager.player_data.get("username", "Player"),
		"text": content,
		"likes": 0,
		"reposts": 0,
		"replies": 0,
		"timestamp": "Just now",
		"has_media": false,
		"verified": CivicAvatarManager.player_data.get("verified", false),
		"reputation_required": 0
	}
	posts.push_front(post)
	emit_signal("new_post_received", post)
	
	# Social actions affect reputation
	CivicAvatarManager.update_reputation(1)
	print("[POST] %s posted: %s" % [post["user"], content])

func like_post(post_index: int) -> void:
	"""Like a post in the feed."""
	if post_index < posts.size():
		posts[post_index]["likes"] += 1
		CivicAvatarManager.update_reputation(1)

func repost(post_index: int) -> void:
	"""Repost a post from the feed."""
	if post_index < posts.size():
		posts[post_index]["reposts"] += 1
		CivicAvatarManager.update_reputation(2)

func reply_to_post(post_index: int, reply_text: String) -> void:
	"""Reply to a post."""
	if post_index < posts.size():
		posts[post_index]["replies"] += 1
		CivicAvatarManager.update_reputation(1)
		print("[REPLY] %s replied to post" % CivicAvatarManager.player_data.get("username", "Player"))

func add_kill_feed_event(kill_data: Dictionary) -> void:
	"""Add a kill to the kill feed (max 10 items)."""
	kill_feed.push_front(kill_data)
	if kill_feed.size() > 10:
		kill_feed.pop_back()
	
	emit_signal("kill_feed_event", kill_data)
	print("[KILL FEED] %s -> %s with %s" % [kill_data["killer"], kill_data["victim"], kill_data.get("weapon", "Unknown")])

func add_damage_indicator(attacker: String, damage: int) -> void:
	"""Show damage indicator (who shot me and how much damage)."""
	emit_signal("damage_indicator", attacker, damage)

func send_chat_message(message: String, is_global: bool = false) -> void:
	"""Send a chat message to the lobby."""
	var chat_msg = {
		"username": CivicAvatarManager.player_data.get("username", "Player"),
		"message": message,
		"timestamp": Time.get_ticks_msec(),
		"verified": CivicAvatarManager.player_data.get("verified", false),
		"is_global": is_global
	}
	chat_messages.append(chat_msg)
	emit_signal("new_chat_message", chat_msg["username"], message, true)
	
	# Keep last 50 messages
	if chat_messages.size() > 50:
		chat_messages.pop_front()

func get_filtered_feed(min_reputation: int = 0) -> Array:
	"""Get feed filtered by player reputation."""
	var filtered = []
	var player_rep = CivicAvatarManager.player_data.get("reputation", 100)
	
	for post in posts:
		if post.get("reputation_required", 0) <= player_rep:
			filtered.append(post)
	
	return filtered

func get_trending_for_player() -> Array:
	"""Get trending topics personalized to player reputation and location."""
	update_trending_topics()
	return trending_topics

func get_kill_feed() -> Array:
	"""Get the last 10 kills in the current match."""
	return kill_feed

func start_video_stream(stream_name: String, video_path: String = "") -> void:
	"""Start a CivicWatch video stream."""
	active_video_stream = {
		"name": stream_name,
		"path": video_path if video_path else "res://assets/videos/%s.ogv" % stream_name.to_lower().replace(" ", "_"),
		"started_at": Time.get_ticks_msec(),
		"viewer_count": randi_range(50, 5000)
	}
	print("[STREAM] Started: %s (Viewers: %d)" % [stream_name, active_video_stream["viewer_count"]])

func get_active_stream() -> Dictionary:
	"""Get current active video stream."""
	return active_video_stream if active_video_stream else {}

func toggle_feed() -> void:
	"""Toggle feed visibility."""
	feed_visible = !feed_visible
	emit_signal("feed_visibility_changed", feed_visible)
	print("[FEED] Visibility: %s" % ("ON" if feed_visible else "OFF"))

func get_feed_posts() -> Array:
	"""Get all posts in the feed."""
	return posts

func simulate_online_activity() -> void:
	"""Simulate real-time feed updates (for offline play)."""
	if randf() > 0.7:  # 30% chance per frame
		var random_user = ["CivicAI", "Sovereign0", "VaultKeeper", "NFT_Wearables"].pick_random()
		var sentiment = ["just earned", "completed", "achieved", "discovered"].pick_random()
		submit_post("%s %s something awesome in The Foyer!" % [random_user, sentiment])

