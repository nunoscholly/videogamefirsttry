extends Resource
class_name Structure

enum SimRole {
	NONE,
	RESIDENTIAL,
	WORKPLACE,
	POWER,
	SAFETY,
	AMENITY,
	COSMETIC,
}

@export_subgroup("Info")
@export var display_name: String = ""
@export var category: String = "Buildings"
@export var description: String = ""

@export_subgroup("Model")
@export var model: PackedScene

@export_subgroup("Gameplay")
@export var price: int = 0

@export_subgroup("Simulation")
@export var sim_role: SimRole = SimRole.NONE
@export var population_capacity: int = 0
@export var jobs: int = 0
@export var power_produces: int = 0
@export var power_consumes: int = 0
@export var upkeep_per_day: int = 0
@export var amenity: int = 0
@export var is_police: bool = false
@export var police_radius: int = 6
