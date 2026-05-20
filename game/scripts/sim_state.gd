extends Node

# Global simulation state for Meridian. Holds the five measurable variables
# plus derived happiness and the day counter. Mutated by Simulation each tick,
# read by Builder/Shop/HUD/etc. via the state_changed signal.

signal state_changed
signal game_over(reason: String)

const STARTING_TREASURY := 10000
const BANKRUPTCY_THRESHOLD := -1000
const BANKRUPTCY_GRACE_DAYS := 5

var treasury: int = STARTING_TREASURY
var population: int = 0
var population_target: int = 0
var jobs_offered: int = 0
var jobs_filled: int = 0
var power_supply: int = 0
var power_demand: int = 0
var safety_coverage_pct: float = 0.0  # 0..1
var happiness: float = 60.0
var happiness_target: float = 60.0
var amenity_count: int = 0
var day: int = 1

var bankruptcy_days: int = 0
var abandonment_armed: bool = false
var is_game_over: bool = false

func reset() -> void:
	treasury = STARTING_TREASURY
	population = 0
	population_target = 0
	jobs_offered = 0
	jobs_filled = 0
	power_supply = 0
	power_demand = 0
	safety_coverage_pct = 0.0
	happiness = 60.0
	happiness_target = 60.0
	amenity_count = 0
	day = 1
	bankruptcy_days = 0
	abandonment_armed = false
	is_game_over = false
	state_changed.emit()

# Returns true if the player can afford `cost` and applies the spend.
func try_spend(cost: int) -> bool:
	if treasury < cost:
		return false
	treasury -= cost
	state_changed.emit()
	return true

func can_afford(cost: int) -> bool:
	return treasury >= cost

# Computed: 0..1 ratio of demand met by supply.
func power_satisfaction() -> float:
	if power_demand <= 0:
		return 1.0
	return clamp(float(power_supply) / float(power_demand), 0.0, 1.0)

# Computed: 0..1 of citizens with jobs.
func employment_rate() -> float:
	if population <= 0:
		return 1.0
	return clamp(float(jobs_filled) / float(population), 0.0, 1.0)

func happiness_face() -> String:
	if happiness >= 70.0:
		return ":)"
	elif happiness >= 40.0:
		return ":|"
	elif happiness >= 20.0:
		return ":("
	return ">:("

func trigger_game_over(reason: String) -> void:
	if is_game_over:
		return
	is_game_over = true
	game_over.emit(reason)
