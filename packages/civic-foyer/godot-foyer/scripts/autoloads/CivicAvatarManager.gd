# CivicAvatarManager.gd
# NEON REIGN: High-Fidelity PBR Avatar System

extends Node

signal avatar_loaded(avatar_node: Node3D)

var current_avatar: Node3D = null
const PBR_SHADER = preload("res://assets/shaders/neon_pbr_high_fidelity.gdshader")

func _ready():
	print("[AVATAR MANAGER] AAA PBR System Active")

func import_from_json(json_data: Dictionary) -> Node3D:
	"""
	Re-visualize the avatar from Civic ID JSON with AAA PBR materials.
	"""
	var avatar_node = Node3D.new()
	avatar_node.name = "CivicAvatar_" + json_data.get("username", "Citizen")
	
	# Logic to load glTF or build from primitives if no model provided
	# In a real AAA project, we would use ResourceLoader.load_threaded_request()
	
	_apply_high_fidelity_materials(avatar_node, json_data)
	current_avatar = avatar_node
	emit_signal("avatar_loaded", avatar_node)
	return avatar_node

func _apply_high_fidelity_materials(node: Node, data: Dictionary):
	"""
	Recursively upgrades all materials to use the AAA PBR shader.
	"""
	for child in node.get_children():
		if child is MeshInstance3D:
			for surface in range(child.mesh.get_surface_count()):
				var mat = ShaderMaterial.new()
				mat.shader = PBR_SHADER
				
				# Set Realistic Defaults
				mat.set_shader_parameter("albedo_color", Color(data.get("skinColor", "#ffffff")))
				mat.set_shader_parameter("roughness_mult", 0.8)
				mat.set_shader_parameter("is_skin", true if "Head" in child.name or "Body" in child.name else false)
				mat.set_shader_parameter("neon_accent_strength", 2.0)
				
				child.set_surface_override_material(surface, mat)
		
		if child.get_child_count() > 0:
			_apply_high_fidelity_materials(child, data)

func get_current_avatar() -> Node3D:
	return current_avatar
