extends Node

# Runs the per-day economic / population / power / safety tick. Owns a Timer
# whose wait_time is set by TimeControl (paused, 1.5s, 0.75s, 0.375s).

const TICK_BASE_INTERVAL := 1.5  # seconds for 1x speed
const POPULATION_LERP_CAP := 3
const HAPPINESS_LERP_CAP := 5.0
const WORKFORCE_RATIO := 0.55
const TAX_PER_CITIZEN := 0.5
const TAX_PER_JOB := 0.3
const HAPPINESS_BASE := 60.0

@export var builder: Node
@export var gridmap: GridMap

var _timer: Timer
var _structure_by_index: Array[Structure] = []
var _paused: bool = true

func _ready() -> void:
	if builder == null or gridmap == null:
		push_error("Simulation: builder or gridmap not assigned")
		return
	_structure_by_index = builder.structures
	if builder.has_signal("grid_changed"):
		builder.grid_changed.connect(_on_grid_changed)
	_timer = Timer.new()
	_timer.one_shot = false
	_timer.wait_time = TICK_BASE_INTERVAL
	_timer.autostart = false
	_timer.timeout.connect(_on_tick)
	add_child(_timer)

func set_speed(multiplier: float) -> void:
	# multiplier of 0 means pause.
	if multiplier <= 0.0:
		_paused = true
		_timer.stop()
		return
	_paused = false
	_timer.wait_time = TICK_BASE_INTERVAL / multiplier
	_timer.start()

func is_paused() -> bool:
	return _paused

func _on_grid_changed() -> void:
	# Flag a recompute; happens automatically next tick via aggregate scan.
	pass

func _on_tick() -> void:
	if SimState.is_game_over:
		_timer.stop()
		_paused = true
		return
	_run_tick()

func _run_tick() -> void:
	# 1. Aggregate building stats.
	var agg := _aggregate()
	SimState.jobs_offered = agg.jobs
	SimState.power_supply = agg.power_supply
	SimState.power_demand = agg.power_demand
	SimState.amenity_count = agg.amenity
	var upkeep: int = agg.upkeep

	# 2. Spatial scan for police coverage.
	SimState.safety_coverage_pct = _compute_safety(agg.residential_cells, agg.police_buildings)

	# 3. Target happiness.
	SimState.happiness_target = _compute_happiness_target(agg)

	# 4. Lerp happiness, then population, toward targets.
	SimState.happiness = _step_toward(SimState.happiness, SimState.happiness_target, HAPPINESS_LERP_CAP)
	SimState.happiness = clamp(SimState.happiness, 0.0, 100.0)

	var occupancy: float = clamp((SimState.happiness - 20.0) / 50.0, 0.0, 1.0)
	SimState.population_target = int(round(float(agg.pop_capacity) * occupancy))
	var pop_step := mini(POPULATION_LERP_CAP, abs(SimState.population_target - SimState.population))
	if SimState.population_target > SimState.population:
		SimState.population += pop_step
	elif SimState.population_target < SimState.population:
		SimState.population -= pop_step

	# 5. Filled jobs = min(workforce, offered).
	var workforce := int(float(SimState.population) * WORKFORCE_RATIO)
	SimState.jobs_filled = mini(workforce, SimState.jobs_offered)

	# 6. Income & upkeep.
	var income := int(round(float(SimState.population) * TAX_PER_CITIZEN + float(SimState.jobs_filled) * TAX_PER_JOB))
	SimState.treasury += income - upkeep

	# 7. Fail state timers.
	if SimState.treasury < SimState.BANKRUPTCY_THRESHOLD:
		SimState.bankruptcy_days += 1
		if SimState.bankruptcy_days >= SimState.BANKRUPTCY_GRACE_DAYS:
			SimState.trigger_game_over("bankruptcy")
	else:
		SimState.bankruptcy_days = 0

	if SimState.population >= 10:
		SimState.abandonment_armed = true
	if SimState.abandonment_armed and SimState.population == 0:
		SimState.trigger_game_over("abandonment")

	# 8. Tick over.
	SimState.day += 1
	SimState.state_changed.emit()

# Sum building stats across the GridMap.
func _aggregate() -> Dictionary:
	var result := {
		"pop_capacity": 0,
		"jobs": 0,
		"power_supply": 0,
		"power_demand": 0,
		"upkeep": 0,
		"amenity": 0,
		"residential_cells": [],
		"police_buildings": [],
	}
	for cell in gridmap.get_used_cells():
		var idx := gridmap.get_cell_item(cell)
		if idx < 0 or idx >= _structure_by_index.size():
			continue
		var s: Structure = _structure_by_index[idx]
		if s == null:
			continue
		result.pop_capacity += s.population_capacity
		result.jobs += s.jobs
		result.power_supply += s.power_produces
		result.power_demand += s.power_consumes
		result.upkeep += s.upkeep_per_day
		result.amenity += s.amenity
		if s.sim_role == Structure.SimRole.RESIDENTIAL:
			result.residential_cells.append(cell)
		if s.is_police:
			result.police_buildings.append({"cell": cell, "radius": s.police_radius})
	return result

func _compute_safety(residentials: Array, police: Array) -> float:
	if residentials.is_empty():
		return 0.0
	if police.is_empty():
		return 0.0
	var covered := 0
	for r in residentials:
		for p in police:
			var d: int = abs(r.x - p.cell.x) + abs(r.z - p.cell.z)
			if d <= p.radius:
				covered += 1
				break
	return float(covered) / float(residentials.size())

func _compute_happiness_target(agg: Dictionary) -> float:
	var target := HAPPINESS_BASE

	# Jobs bonus / penalty.
	if SimState.population > 0:
		if agg.jobs == 0:
			target -= 15.0
		elif SimState.jobs_filled > 0 and float(SimState.jobs_filled) / float(SimState.population) >= 0.7:
			target += 5.0

	# Blackout penalty.
	var blackout_pct: float = 0.0
	if agg.power_demand > 0:
		blackout_pct = clamp(1.0 - float(agg.power_supply) / float(agg.power_demand), 0.0, 1.0)
	target -= 15.0 * blackout_pct

	# Unsafety penalty.
	target -= 10.0 * (1.0 - SimState.safety_coverage_pct)

	# Amenity bonus.
	var amenity_bonus: float = 0.0
	if SimState.population > 0:
		amenity_bonus = float(agg.amenity) * 100.0 / float(SimState.population)
	amenity_bonus = clamp(amenity_bonus, 0.0, 10.0)
	target += amenity_bonus

	return clamp(target, 0.0, 100.0)

func _step_toward(current: float, target: float, cap: float) -> float:
	var diff := target - current
	if abs(diff) <= cap:
		return target
	return current + (cap if diff > 0 else -cap)
