extends Control
## Community Hub Manager - Premium social media entry point to NEON REIGN
## Displays trends, kill feed, live streams, and feeds into the foyer

@onready var feed_ui: VBoxContainer = $MainLayout/CentralFeed/Feed
@onready var kill_list: VBoxContainer = $MainLayout/KillFeedPanel/VBoxContainer/KillList
@onready var trends_list: VBoxContainer = $MainLayout/TrendsPanel/TrendsContent/TrendsList
@onready var streams_list: VBoxContainer = $MainLayout/TrendsPanel/TrendsContent/StreamsList
@onready var enter_foyer_btn: Button = $MainLayout/CentralFeed/Navigation/NavContent/EnterFoyerBtn

var kill_feed_scroll: ScrollContainer = null
var trends_scroll: ScrollContainer = null
var streams_scroll: ScrollContainer = null

func _ready() -> void:
	# Setup kill feed
	kill_feed_scroll = ScrollContainer.new()
	kill_feed_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	kill_feed_scroll.max_height = 400
	kill_list.add_child(kill_feed_scroll)
	
	# Setup trends
	trends_scroll = ScrollContainer.new()
	trends_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	trends_scroll.max_height = 350
	trends_list.add_child(trends_scroll)
	
	# Setup streams
	streams_scroll = ScrollContainer.new()
	streams_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	streams_scroll.max_height = 250
	streams_list.add_child(streams_scroll)
	
	# Populate feeds
	_populate_kill_feed()
	_populate_trends()
	_populate_streams()
	
	# Connect button
	enter_foyer_btn.pressed.connect(_enter_foyer)
	
	# Start auto-refresh
	var timer = Timer.new()
	timer.wait_time = 3.0
	add_child(timer)
	timer.timeout.connect(_refresh_kill_feed)
	timer.start()

func _populate_kill_feed() -> void:
	var kill_vbox = VBoxContainer.new()
	kill_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	
	if feed_ui.has_method("kill_feed"):
		var kills = feed_ui.kill_feed
		for kill in kills:
			var kill_label = _create_kill_entry(kill)
			kill_vbox.add_child(kill_label)
	
	kill_feed_scroll.add_child(kill_vbox)

func _create_kill_entry(kill: Dictionary) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _get_kill_style())
	panel.custom_minimum_size = Vector2(230, 35)
	
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 4)
	panel.add_child(hbox)
	
	var killer_label = Label.new()
	killer_label.text = kill.get("killer", "?")
	killer_label.add_theme_color_override("font_color", Color(0, 1, 0.4, 1))
	killer_label.add_theme_font_size_override("font_size", 9)
	killer_label.custom_minimum_size.x = 70
	hbox.add_child(killer_label)
	
	var weapon_label = Label.new()
	weapon_label.text = kill.get("weapon", "Weapon")
	weapon_label.add_theme_color_override("font_color", Color(1, 1, 1, 0.6))
	weapon_label.add_theme_font_size_override("font_size", 8)
	weapon_label.custom_minimum_size.x = 50
	hbox.add_child(weapon_label)
	
	var victim_label = Label.new()
	victim_label.text = kill.get("victim", "?")
	victim_label.add_theme_color_override("font_color", Color(1, 0.2, 0.2, 1))
	victim_label.add_theme_font_size_override("font_size", 9)
	victim_label.custom_minimum_size.x = 70
	hbox.add_child(victim_label)
	
	var time_label = Label.new()
	time_label.text = kill.get("time", "")
	time_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 0.7))
	time_label.add_theme_font_size_override("font_size", 8)
	time_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(time_label)
	
	return panel

func _get_kill_style() -> StyleBox:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.03, 0.03, 0.8)
	style.border_color = Color(1, 0.2, 0.2, 0.3)
	style.set_border_enabled_all(true)
	style.set_border_width_all(1)
	style.content_margin_all = 6
	return style

func _populate_trends() -> void:
	var trends_vbox = VBoxContainer.new()
	trends_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	trends_vbox.add_theme_constant_override("separation", 12)
	
	if feed_ui and feed_ui.has_method("get_trends"):
		var trends = feed_ui.get_trends()
		for trend in trends.slice(0, 8):  # Top 8 trends
			var trend_panel = _create_trend_entry(trend)
			trends_vbox.add_child(trend_panel)
	
	trends_scroll.add_child(trends_vbox)

func _create_trend_entry(trend: Dictionary) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _get_trend_style(trend.get("trending", false)))
	panel.custom_minimum_size = Vector2(256, 0)
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	
	var vbox = VBoxContainer.new()
	panel.add_child(vbox)
	
	var tag_label = Label.new()
	tag_label.text = trend.get("tag", "#trend")
	tag_label.add_theme_color_override("font_color", Color(0, 1, 0.8, 1))
	tag_label.add_theme_font_size_override("font_size", 11)
	vbox.add_child(tag_label)
	
	var posts_label = Label.new()
	posts_label.text = "%d posts 🔥" % trend.get("posts", 0) if trend.get("trending", false) else "%d posts" % trend.get("posts", 0)
	posts_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 0.8))
	posts_label.add_theme_font_size_override("font_size", 9)
	vbox.add_child(posts_label)
	
	return panel

func _get_trend_style(is_trending: bool) -> StyleBox:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.05, 0.08, 0.7)
	style.border_color = Color(0, 1, 0.8, 0.3) if is_trending else Color(0.3, 0.3, 0.4, 0.2)
	style.set_border_enabled_all(true)
	style.set_border_width_all(1)
	style.content_margin_all = 8
	return style

func _populate_streams() -> void:
	var streams_vbox = VBoxContainer.new()
	streams_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	streams_vbox.add_theme_constant_override("separation", 8)
	
	if feed_ui and feed_ui.has_method("get_live_streams"):
		var streams = feed_ui.get_live_streams()
		for stream in streams.slice(0, 4):  # Top 4 streams
			var stream_panel = _create_stream_entry(stream)
			streams_vbox.add_child(stream_panel)
	
	streams_scroll.add_child(streams_vbox)

func _create_stream_entry(stream: Dictionary) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _get_stream_style())
	panel.custom_minimum_size = Vector2(256, 50)
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 8)
	panel.add_child(hbox)
	
	var live_badge = Label.new()
	live_badge.text = "🔴 LIVE"
	live_badge.add_theme_color_override("font_color", Color(1, 0.2, 0.2, 1))
	live_badge.add_theme_font_size_override("font_size", 10)
	hbox.add_child(live_badge)
	
	var info_vbox = VBoxContainer.new()
	
	var streamer_label = Label.new()
	streamer_label.text = stream.get("streamer", "Streamer")
	streamer_label.add_theme_color_override("font_color", Color(1, 1, 1, 1))
	streamer_label.add_theme_font_size_override("font_size", 10)
	info_vbox.add_child(streamer_label)
	
	var viewers_label = Label.new()
	viewers_label.text = "%d viewers" % stream.get("viewers", 0)
	viewers_label.add_theme_color_override("font_color", Color(0, 1, 0.5, 0.8))
	viewers_label.add_theme_font_size_override("font_size", 8)
	info_vbox.add_child(viewers_label)
	
	hbox.add_child(info_vbox)
	
	return panel

func _get_stream_style() -> StyleBox:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.03, 0.03, 0.8)
	style.border_color = Color(1, 0.2, 0.2, 0.6)
	style.set_border_enabled_all(true)
	style.set_border_width_all(2)
	style.content_margin_all = 8
	return style

func _refresh_kill_feed() -> void:
	# Clear and repopulate kill feed (called every 3 seconds)
	for child in kill_feed_scroll.get_children():
		child.queue_free()
	_populate_kill_feed()

func _enter_foyer() -> void:
	# Load the foyer scene
	var tween = get_tree().create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.3)
	await tween.finished
	
	get_tree().change_scene_to_file("res://scenes/foyer/TheFoyer.tscn")

func post_kill_event(killer: String, victim: String, weapon: String) -> void:
	"""Called by game when a player gets a kill"""
	if feed_ui.has_method("add_kill_event"):
		feed_ui.add_kill_event(killer, victim, weapon)
	_refresh_kill_feed()

func post_new_trend(tag: String) -> void:
	"""Called by game to add a trending tag"""
	if not feed_ui.has_method("get_trends"):
		return
	
	var trends = feed_ui.get_trends()
	for trend in trends:
		if trend.get("tag") == tag:
			trend["posts"] += 100
			if trend["posts"] > 5000:
				trend["trending"] = true
			break
