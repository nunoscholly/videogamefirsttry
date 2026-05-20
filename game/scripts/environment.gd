extends Node3D

# Pre-fills the GridMap with an organic island of grass tiles, then surrounds it
# with water, forests and distant mountains so the player starts inside a natural
# setting instead of empty void.

@export var gridmap: GridMap
@export var builder: Node  # used to resolve grass/tree indices by name

# Resolved from builder.structures at runtime by display_name (robust to
# structure-array reordering when new buildings are added).
var _grass_index: int = -1
var _grass_trees_index: int = -1
var _grass_trees_tall_index: int = -1

const ISLAND_RADIUS_X := 16
const ISLAND_RADIUS_Z := 11
const COAST_NOISE := 0.28
const FOREST_TILE_CHANCE := 0.18

const WATER_SIZE := 260.0
const WATER_Y := -0.04

const FOREST_PATCH_COUNT := 70
const FOREST_RING_INNER := 18.0
const FOREST_RING_OUTER := 30.0

const MOUNTAIN_COUNT := 36
const MOUNTAIN_RING_INNER := 36.0
const MOUNTAIN_RING_OUTER := 62.0

var _rng := RandomNumberGenerator.new()
var _coast_noise := FastNoiseLite.new()

func _ready() -> void:
	_rng.seed = 1337
	_coast_noise.seed = 1337
	_coast_noise.frequency = 0.18
	# Wait one frame so Builder finishes wiring its MeshLibrary onto the GridMap.
	await get_tree().process_frame
	_resolve_indices()
	_fill_island()
	_spawn_water()
	_spawn_forests()
	_spawn_mountains()

func _resolve_indices() -> void:
	if builder == null:
		push_warning("Environment: builder not assigned, island fill skipped")
		return
	for i in range(builder.structures.size()):
		var s: Structure = builder.structures[i]
		if s == null:
			continue
		match s.display_name:
			"Grass":
				_grass_index = i
			"Trees":
				_grass_trees_index = i
			"Tall Trees":
				_grass_trees_tall_index = i

func _fill_island() -> void:
	if gridmap == null:
		push_warning("Environment: gridmap is null, skipping island fill")
		return
	if _grass_index < 0:
		push_warning("Environment: grass index not resolved, skipping island fill")
		return
	for x in range(-ISLAND_RADIUS_X - 4, ISLAND_RADIUS_X + 5):
		for z in range(-ISLAND_RADIUS_Z - 4, ISLAND_RADIUS_Z + 5):
			var nx := float(x) / float(ISLAND_RADIUS_X)
			var nz := float(z) / float(ISLAND_RADIUS_Z)
			var dist := sqrt(nx * nx + nz * nz)
			var wobble := _coast_noise.get_noise_2d(x * 2.0, z * 2.0) * COAST_NOISE
			if dist + wobble < 1.0:
				# Sprinkle treed grass tiles along the inner coast for visual variety.
				var edge_factor := 1.0 - (dist + wobble)
				var item := _grass_index
				if edge_factor < 0.18 and _rng.randf() < FOREST_TILE_CHANCE:
					if _grass_trees_index >= 0 and _grass_trees_tall_index >= 0:
						item = _grass_trees_index if _rng.randf() < 0.5 else _grass_trees_tall_index
				gridmap.set_cell_item(Vector3i(x, 0, z), item, 0)

func _spawn_water() -> void:
	var water := MeshInstance3D.new()
	water.name = "Water"
	var plane := PlaneMesh.new()
	plane.size = Vector2(WATER_SIZE, WATER_SIZE)
	plane.subdivide_width = 1
	plane.subdivide_depth = 1
	water.mesh = plane
	water.position = Vector3(0, WATER_Y, 0)

	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.18, 0.42, 0.58, 0.92)
	mat.metallic = 0.35
	mat.metallic_specular = 0.7
	mat.roughness = 0.18
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	water.material_override = mat

	add_child(water)

func _spawn_forests() -> void:
	var tall := load("res://models/grass-trees-tall.glb") as PackedScene
	var short := load("res://models/grass-trees.glb") as PackedScene
	if tall == null or short == null:
		push_warning("Environment: tree models missing")
		return
	for i in FOREST_PATCH_COUNT:
		var angle := _rng.randf() * TAU
		var radius := _rng.randf_range(FOREST_RING_INNER, FOREST_RING_OUTER)
		# Slightly squish along Z so forests follow the island's aspect.
		var pos := Vector3(cos(angle) * radius, 0.0, sin(angle) * radius * 0.85)
		var scene := tall if _rng.randf() < 0.55 else short
		var inst := scene.instantiate() as Node3D
		inst.position = pos
		inst.rotation.y = _rng.randf() * TAU
		var s := _rng.randf_range(0.85, 1.45)
		inst.scale = Vector3(s, s, s)
		add_child(inst)

func _spawn_mountains() -> void:
	var rock_colors := [
		Color(0.34, 0.31, 0.28),
		Color(0.42, 0.39, 0.36),
		Color(0.28, 0.27, 0.27),
		Color(0.48, 0.44, 0.39),
	]
	for i in MOUNTAIN_COUNT:
		var angle := _rng.randf() * TAU
		var radius := _rng.randf_range(MOUNTAIN_RING_INNER, MOUNTAIN_RING_OUTER)
		var pos := Vector3(cos(angle) * radius, 0.0, sin(angle) * radius * 0.9)

		var mountain := MeshInstance3D.new()
		var cone := CylinderMesh.new()
		cone.top_radius = _rng.randf_range(0.05, 0.4)
		cone.bottom_radius = _rng.randf_range(3.5, 7.0)
		cone.height = _rng.randf_range(6.0, 14.0)
		cone.radial_segments = 6  # low-poly faceted look
		mountain.mesh = cone
		mountain.position = pos + Vector3(0, cone.height * 0.5 - 0.5, 0)
		mountain.rotation.y = _rng.randf() * TAU

		var mat := StandardMaterial3D.new()
		var base: Color = rock_colors[_rng.randi() % rock_colors.size()]
		# Snow-cap the tallest peaks.
		if cone.height > 11.0:
			mat.albedo_color = base.lerp(Color(0.95, 0.96, 0.98), 0.35)
		else:
			mat.albedo_color = base
		mat.roughness = 0.95
		mountain.material_override = mat

		add_child(mountain)
