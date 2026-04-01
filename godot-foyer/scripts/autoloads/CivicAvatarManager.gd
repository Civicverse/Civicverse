# CivicAvatarManager.gd
# Manages player identity, RPM/glTF avatar loading, and applying the NEON shader.

extends Node

const NEON_SHADER = preload("res://assets/shaders/neon_cell_shade.gdshader")

var player_data = {
	"username": "SovereignCitizen",
	"reputation": 100,
	"karma": 50,
	"dao_weight": 1.0,
	"wallet_balance": 0.0,
	"avatar_url": "",
	"wearables": []
}

func _ready():
	# In a real build, this would fetch from JavaScriptBridge or a backend API.
	load_local_identity()

func load_local_identity():
	if OS.has_feature("web"):
		# Fetch from CivicVerse frontend via JavaScriptBridge
		var json_str = JavaScriptBridge.eval("JSON.stringify(window.getCivicID())")
		if json_str:
			var json = JSON.new()
			var error = json.parse(json_str)
			if error == OK:
				player_data = json.data
	print("Civic ID Loaded: ", player_data.username)

func apply_neon_visuals(node: Node3D):
	# Recursively apply the cell-shade shader to all MeshInstance3D nodes
	for child in node.get_children():
		if child is MeshInstance3D:
			for i in range(child.get_surface_count()):
				var original_material = child.get_active_material(i)
				var neon_material = ShaderMaterial.new()
				neon_material.shader = NEON_SHADER
				
				# Transfer base properties if possible
				if original_material is StandardMaterial3D:
					neon_material.set_shader_parameter("base_color", original_material.albedo_color)
					neon_material.set_shader_parameter("main_texture", original_material.albedo_texture)
				
				child.set_surface_override_material(i, neon_material)
		
		if child.get_child_count() > 0:
			apply_neon_visuals(child)

func update_reputation(delta: int):
	player_data.reputation += delta
	ReputationSystem.emit_signal("reputation_changed", player_data.reputation)
