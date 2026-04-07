extends VBoxContainer
## Premium X-like Social Feed UI for NEON REIGN Community Hub
## Displays posts, trends, kill feed, live streams with high-fidelity styling

var posts: Array = []
var trends: Array = []
var kill_feed: Array = []
var live_streams: Array = []

@onready var scroll_container = ScrollContainer.new()
@onready var post_list = VBoxContainer.new()

func _ready() -> void:
	# Setup scroll area
	scroll_container.custom_minimum_size = Vector2(800, 600)
	scroll_container.add_child(post_list)
	post_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	post_list.add_theme_constant_override("separation", 12)
	add_child(scroll_container)
	
	# Initialize sample data
	_load_sample_posts()
	_load_sample_trends()
	_load_sample_kill_feed()
	_load_sample_streams()
	
	# Render UI
	_refresh_posts()
	_refresh_trends()
	_refresh_kill_feed()
	
	print("[FEED] Community feed initialized with %d posts" % posts.size())

func _load_sample_posts() -> void:
	posts = [
		{
			"author": "SovereignCitizen",
			"avatar": "🏆",
			"username": "@sovereign",
			"handle": "Civic Pioneer",
			"timestamp": "2m ago",
			"content": "Just won a 32-player BR with 12 kills. The new double-jump vault mechanic is 🔥",
			"likes": 2340,
			"comments": 156,
			"reposts": 420,
			"liked": false,
			"category": "kill",
			"reputation": "Sovereign"
		},
		{
			"author": "NeonRegent",
			"avatar": "👑",
			"username": "@neonregent",
			"handle": "Fashion Influencer",
			"timestamp": "5m ago",
			"content": "New holographic armor cosmetics dropping today. The neon cyan glow is INSANE. 🎮✨",
			"likes": 5600,
			"comments": 892,
			"reposts": 1200,
			"liked": false,
			"category": "cosmetic",
			"reputation": "Influencer"
		},
		{
			"author": "CivicGamer",
			"avatar": "⚔️",
			"username": "@civicgamer",
			"handle": "Streamer",
			"timestamp": "8m ago",
			"content": "LIVE NOW: 6-hour BR grind stream. 50+ viewer bounty active. Come challenge me! 🔴 LIVE",
			"likes": 892,
			"comments": 445,
			"reposts": 234,
			"liked": false,
			"category": "stream",
			"reputation": "Creator",
			"is_live": true
		},
		{
			"author": "CivicWatch",
			"avatar": "📹",
			"username": "@civicwatch",
			"handle": "Official News",
			"timestamp": "12m ago",
			"content": "Weekly BR tournament finals tomorrow at 8 PM UTC. Prize pool: 50,000 CIVIC. Register now! 🏅",
			"likes": 3200,
			"comments": 567,
			"reposts": 1890,
			"liked": false,
			"category": "event",
			"reputation": "Official"
		},
		{
			"author": "ReputationMaster",
			"avatar": "⭐",
			"username": "@repmaster",
			"handle": "Reputation Tracker",
			"timestamp": "15m ago",
			"content": "Reputation leaderboard updated! Top 10 players now eligible for Sovereign tier cosmetics. Check standings! 📊",
			"likes": 1234,
			"comments": 189,
			"reposts": 456,
			"liked": false,
			"category": "reputation",
			"reputation": "System"
		}
	]

func _load_sample_trends() -> void:
	trends = [
		{"tag": "#DoubleJumpMeta", "posts": 12400, "trending": true},
		{"tag": "#VaultTricks", "posts": 8900, "trending": true},
		{"tag": "#NeonArmorSkins", "posts": 7600, "trending": true},
		{"tag": "#BRTournament", "posts": 5200, "trending": false},
		{"tag": "#CoverShootout", "posts": 4100, "trending": false},
		{"tag": "#SovereignTier", "posts": 3800, "trending": false},
		{"tag": "#ReputationFarm", "posts": 2900, "trending": false},
		{"tag": "#WalletTips", "posts": 2100, "trending": false}
	]

func _load_sample_kill_feed() -> void:
	kill_feed = [
		{"killer": "SovereignCitizen", "victim": "NoobSlayer42", "weapon": "Energy Blaster", "time": "now"},
		{"killer": "NeonRegent", "victim": "StreeterAI", "weapon": "Plasma Rifle", "time": "1s ago"},
		{"killer": "CivicGamer", "victim": "ShadowNinja", "weapon": "Sniper", "time": "3s ago"},
		{"killer": "FrostByte", "victim": "IceQueen", "weapon": "Shotgun", "time": "5s ago"},
		{"killer": "SovereignCitizen", "victim": "PhantomEdge", "weapon": "Energy Blaster", "time": "8s ago"},
		{"killer": "VortexMaster", "victim": "CyberKnight", "weapon": "Railgun", "time": "12s ago"},
		{"killer": "NeonRegent", "victim": "GhostWalker", "weapon": "Plasma Rifle", "time": "15s ago"},
		{"killer": "CivicGamer", "victim": "DarkSoul", "weapon": "Pistol", "time": "18s ago"},
	]

func _load_sample_streams() -> void:
	live_streams = [
		{"streamer": "CivicGamer", "viewers": 1240, "game": "NEON REIGN BR", "title": "6h grind for Sovereign tier", "category": "competitive"},
		{"streamer": "DebugGenius", "viewers": 856, "game": "NEON REIGN", "title": "Learning parkour mechanics", "category": "tutorial"},
		{"streamer": "NeonRegent", "viewers": 2100, "game": "NEON REIGN", "title": "New cosmetics showcase", "category": "fashion"},
		{"streamer": "VaultKing", "viewers": 634, "game": "NEON REIGN BR", "title": "Vault tech mastery", "category": "tips"},
	]

func _refresh_posts() -> void:
	# Clear existing posts
	for child in post_list.get_children():
		child.queue_free()
	
	# Render each post
	for post in posts:
		var post_panel = _create_post_panel(post)
		post_list.add_child(post_panel)

func _create_post_panel(post: Dictionary) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _get_post_style(post.get("category", "normal")))
	panel.custom_minimum_size = Vector2(760, 0)
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	panel.add_child(vbox)
	
	# Header (author, time)
	var header = HBoxContainer.new()
	header.add_theme_constant_override("separation", 12)
	
	var avatar = Label.new()
	avatar.text = post.get("avatar", "👤")
	avatar.add_theme_font_size_override("font_size", 32)
	header.add_child(avatar)
	
	var author_info = VBoxContainer.new()
	var author_line = HBoxContainer.new()
	
	var author_name = Label.new()
	author_name.text = post.get("author", "Unknown")
	author_name.add_theme_color_override("font_color", Color.WHITE)
	author_name.add_theme_font_size_override("font_size", 14)
	author_line.add_child(author_name)
	
	var reputation_badge = Label.new()
	var rep = post.get("reputation", "Player")
	match rep:
		"Sovereign":
			reputation_badge.text = "👑 SOVEREIGN"
			reputation_badge.add_theme_color_override("font_color", Color(1.0, 0.84, 0.0))
		"Influencer":
			reputation_badge.text = "⭐ INFLUENCER"
			reputation_badge.add_theme_color_override("font_color", Color(1.0, 0.5, 1.0))
		"Creator":
			reputation_badge.text = "🎬 CREATOR"
			reputation_badge.add_theme_color_override("font_color", Color(1.0, 0.2, 0.2))
		"Official":
			reputation_badge.text = "✅ OFFICIAL"
			reputation_badge.add_theme_color_override("font_color", Color(0.0, 1.0, 0.8))
		_:
			reputation_badge.text = "📊 PLAYER"
			reputation_badge.add_theme_color_override("font_color", Color(0.5, 0.5, 1.0))
	
	reputation_badge.add_theme_font_size_override("font_size", 10)
	author_line.add_child(reputation_badge)
	author_info.add_child(author_line)
	
	var handle_line = HBoxContainer.new()
	var handle = Label.new()
	handle.text = "%s • %s" % [post.get("username", "@user"), post.get("timestamp", "")]
	handle.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	handle.add_theme_font_size_override("font_size", 11)
	handle_line.add_child(handle)
	author_info.add_child(handle_line)
	
	header.add_child(author_info)
	vbox.add_child(header)
	
	# Content
	var content = Label.new()
	content.text = post.get("content", "")
	content.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_theme_color_override("font_color", Color.WHITE)
	content.add_theme_font_size_override("font_size", 13)
	vbox.add_child(content)
	
	# Live indicator
	if post.get("is_live", false):
		var live_label = Label.new()
		live_label.text = "🔴 LIVE NOW"
		live_label.add_theme_color_override("font_color", Color(1.0, 0.0, 0.0))
		live_label.add_theme_font_size_override("font_size", 12)
		vbox.add_child(live_label)
	
	# Stats footer
	var stats = HBoxContainer.new()
	stats.add_theme_constant_override("separation", 24)
	
	var likes = Label.new()
	likes.text = "❤️ %d" % post.get("likes", 0)
	likes.add_theme_color_override("font_color", Color(1.0, 0.2, 0.2))
	stats.add_child(likes)
	
	var comments = Label.new()
	comments.text = "💬 %d" % post.get("comments", 0)
	comments.add_theme_color_override("font_color", Color(0.2, 0.8, 1.0))
	stats.add_child(comments)
	
	var reposts = Label.new()
	reposts.text = "🔄 %d" % post.get("reposts", 0)
	reposts.add_theme_color_override("font_color", Color(0.0, 1.0, 0.5))
	stats.add_child(reposts)
	
	vbox.add_child(stats)
	
	return panel

func _get_post_style(category: String) -> StyleBox:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.08, 0.12, 0.95)
	style.set_border_enabled_all(true)
	style.set_border_width_all(2)
	style.content_margin_all = 16
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	
	# Color by category - neon accents
	match category:
		"kill":
			style.border_color = Color(1.0, 0.0, 0.0, 0.7)  # Red kill feed
			style.bg_color = Color(0.15, 0.05, 0.05, 0.95)
		"cosmetic":
			style.border_color = Color(1.0, 0.0, 1.0, 0.7)  # Pink cosmetics
			style.bg_color = Color(0.12, 0.05, 0.12, 0.95)
		"stream":
			style.border_color = Color(1.0, 0.2, 0.2, 0.9)  # Live red
			style.bg_color = Color(0.18, 0.05, 0.05, 0.95)
		"event":
			style.border_color = Color(0.0, 1.0, 0.8, 0.7)  # Cyan events
			style.bg_color = Color(0.05, 0.12, 0.12, 0.95)
		"reputation":
			style.border_color = Color(1.0, 0.84, 0.0, 0.7)  # Gold rewards
			style.bg_color = Color(0.15, 0.12, 0.05, 0.95)
		_:
			style.border_color = Color(0.3, 0.3, 0.4, 0.5)
	
	return style

func _refresh_trends() -> void:
	# Called to refresh trends display (implement in parent scene)
	pass

func _refresh_kill_feed() -> void:
	# Called to refresh kill feed display (implement in parent scene)
	pass

# Public API
func like_post(post_index: int) -> void:
	if post_index >= 0 and post_index < posts.size():
		posts[post_index]["liked"] = !posts[post_index]["liked"]
		if posts[post_index]["liked"]:
			posts[post_index]["likes"] += 1
		else:
			posts[post_index]["likes"] -= 1
		_refresh_posts()

func add_post(author: String, content: String, category: String = "normal") -> void:
	posts.insert(0, {
		"author": author,
		"username": "@" + author.to_lower(),
		"content": content,
		"likes": 0,
		"comments": 0,
		"reposts": 0,
		"timestamp": "now",
		"category": category,
		"liked": false,
		"avatar": "👤"
	})
	_refresh_posts()

func add_kill_event(killer: String, victim: String, weapon: String) -> void:
	kill_feed.insert(0, {
		"killer": killer,
		"victim": victim,
		"weapon": weapon,
		"time": "now"
	})
	if kill_feed.size() > 15:
		kill_feed.pop_back()
	_refresh_kill_feed()

func get_trends() -> Array:
	return trends

func get_live_streams() -> Array:
	return live_streams
