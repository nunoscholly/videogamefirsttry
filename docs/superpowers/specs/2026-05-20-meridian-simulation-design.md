# Meridian Simulation Core — Design (v0.1)

**Date:** 2026-05-20
**Scope:** Turn the current Kenney city-builder sandbox into a pressure-style city-state simulation with five measurable variables, a real-time tick loop, and an economic feedback cycle (jobs → taxes → infrastructure).

## Playstyle target

SimCity-style **pressure**: citizens leave if unhappy, blackouts occur on power shortfalls, the treasury can collapse. Mistakes have real consequences and the player must juggle multiple variables.

Real-time ticks at 1× / 2× / 4× / pause. One in-game day ≈ 1.5 s of real time at 1×.

## State variables (5 core + 1 derived)

| Variable | Type | Source |
|---|---|---|
| Treasury | int dollars | Mutated by daily income − upkeep |
| Population | int | Lerps toward target occupancy |
| Jobs (offered / filled) | int / int | offered = Σ workplace capacity; filled = `min(population × 0.55, jobs_offered)` |
| Power (supply / demand) | int / int | Σ over buildings |
| Safety coverage | percentage 0–100 | Spatial pass: residentials within radius 6 of a police building |
| **Happiness (derived)** | 0–100 | Computed each tick from jobs / power / safety / amenities |

Detailed formulas:

- **Occupancy rate** = clamp((happiness − 20) / 50, 0, 1). Pop target = `Σ residential_capacity × occupancy_rate`. Population moves toward target by at most 3 citizens/day (cap, not factor); rounded to int after applying.
- **Blackout pct** = max(0, demand − supply) / max(demand, 1). Affects all buildings globally (no per-tile power routing in v0.1).
- **Happiness target** = `60 + jobs_bonus − blackout_penalty − unsafety_penalty + amenity_bonus`, where:
  - jobs_bonus = +5 if jobs_filled / pop ≥ 0.7, else 0; -15 if pop > 0 and jobs_offered = 0.
  - blackout_penalty = 15 × blackout_pct.
  - unsafety_penalty = 10 × (1 − safety_coverage_pct).
  - amenity_bonus = clamp(amenity_count × 100 / max(pop, 1), 0, 10).
- **Happiness target** is clamped to [0, 100]. **Happiness** moves toward target by at most 5/day (cap, not factor) and is clamped to [0, 100].
- **Daily income** = `population × $0.5 + jobs_filled × $0.3`. **Daily upkeep** = `Σ building.upkeep`.

## Fail states

- **Bankruptcy**: treasury < −$1,000 for 5 consecutive days → game over.
- **Abandonment**: population was once > 10 and drops to 0 → game over.

Both surface a full-screen game-over modal with a "New City" button.

## Architecture

```
                ┌──────────────┐
                │  SimState    │ autoload singleton
                │ (5 vars +    │ - holds runtime state
                │  happiness)  │ - emits state_changed(snapshot)
                └──────┬───────┘
                       ▲
        emits          │ writes
        grid_changed   │
   ┌────────┐    ┌─────┴──────┐    listens to grid_changed
   │ Builder├───▶│ Simulation │──────────────┐
   └────────┘    │ (tick Node)│              │
                 └─────┬──────┘              │
                       │ tick               ▼
                       ▼              ┌─────────────┐
                ┌─────────────┐       │  GridMap    │ source of truth
                │ TimeControl │       │  (cells →   │ for placed structures
                │ (pause /    │       │  structure  │
                │  1×/2×/4×)  │       │   index)    │
                └─────────────┘       └─────────────┘
                       ▲
                       │ subscribes
                ┌──────┴──────┐
                │   HUD       │  reads SimState
                │   (pop, $   │  on state_changed
                │   pwr, sft) │
                └─────────────┘
```

**SimState** (`scripts/sim_state.gd`, autoload)
- Holds all runtime variables: `treasury`, `population`, `population_target`, `jobs_offered`, `jobs_filled`, `power_supply`, `power_demand`, `safety_coverage_pct`, `happiness`, `happiness_target`, `day`, `bankruptcy_days`, `abandonment_armed`.
- Setter methods + a single `state_changed(snapshot)` signal that fires when any var mutates within a tick.
- Replaces `DataMap.cash`; affordability checks in Builder read `SimState.treasury`.

**Simulation** (`scripts/simulation.gd`, Node added to `main.tscn`)
- Owns a `Timer` whose `wait_time` is set by `TimeControl`.
- On `timeout`: runs the tick loop (see below).
- Connects to `Builder.grid_changed` and sets a `dirty` flag so the next tick recomputes aggregates (cheap; full scan is O(cells)).

**TimeControl** (`scripts/time_control.gd`, Control in `CanvasLayer`)
- 4 buttons: ⏸ / 1× / 2× / 4×. Sets `Simulation.timer.wait_time` to {paused, 1.5, 0.75, 0.375}s.
- Renders the day counter ("Day 23") to the left of the buttons.

**HUD card** (extension of existing `CanvasLayer/Top` or new `CanvasLayer/HUD`)
- Vertical card showing: Population, Jobs (filled / offered), Power (supply / demand bar), Safety %, Happiness face (😊 ≥ 70, 😐 40–70, 😟 20–40, 😠 < 20).
- Listens to `SimState.state_changed`, refreshes its labels.

**Builder changes**
- Emit `signal grid_changed` after each `set_cell_item` in `action_build` / `action_demolish`.
- Replace `map.cash -= structures[index].price` with `SimState.spend(structures[index].price)`.
- `action_build` rejects placement if `SimState.treasury < structures[index].price`.

**Shop changes**
- Subscribe to `SimState.state_changed`.
- Re-render each item's affordability: unaffordable items show price in red and the button's `disabled` flag set true.

## Tick loop (each in-game day)

1. **Aggregate** from GridMap cells:
   - `pop_capacity = Σ structure.population_capacity`
   - `jobs_offered = Σ structure.jobs`
   - `power_supply = Σ structure.power_produces`
   - `power_demand = Σ structure.power_consumes`
   - `upkeep = Σ structure.upkeep_per_day`
   - `amenity_count = Σ structure.amenity`
2. **Spatial scan** for police coverage:
   - Iterate residential cells; for each, scan cells within Manhattan radius 6 for any police-class structure. Track covered count.
   - `safety_coverage_pct = covered / max(residential_count, 1)`
3. **Compute targets**:
   - `blackout_pct`
   - `happiness_target`
   - `occupancy_rate`
   - `pop_target = pop_capacity × occupancy_rate`
4. **Lerp** happiness toward target by 5; population toward target by 3 (rounded).
5. **Compute jobs_filled** = `min(population × 0.55, jobs_offered)`.
6. **Apply income / upkeep**: `treasury += population × 0.5 + jobs_filled × 0.3 − upkeep`.
7. **Update fail-state timers**:
   - If treasury < −1000, `bankruptcy_days += 1`; else reset to 0. If `bankruptcy_days ≥ 5`, fire `game_over("bankruptcy")`.
   - If population ever ≥ 10, set `abandonment_armed = true`. If `abandonment_armed and population == 0`, fire `game_over("abandonment")`.
8. **Increment day**, emit `state_changed`.

## Structure resource extension

Add new fields to `scripts/structure.gd`:

```gdscript
@export_subgroup("Simulation")
@export var population_capacity: int = 0
@export var jobs: int = 0
@export var power_produces: int = 0
@export var power_consumes: int = 0
@export var upkeep_per_day: int = 0
@export var amenity: int = 0
@export var is_police: bool = false
@export var police_radius: int = 6
@export_enum("None", "Residential", "Workplace", "Power", "Safety", "Amenity", "Cosmetic") var sim_role: int = 0
```

## Building catalog

### Existing kit buildings — new config

| Asset | Role | pop | jobs | pwr_prod | pwr_use | upkeep | amenity |
|---|---|---|---|---|---|---|---|
| Cottage | Residential | 4 | 0 | 0 | 2 | 5 | 0 |
| Townhouse | Residential | 8 | 0 | 0 | 3 | 8 | 0 |
| Apartment | Residential | 20 | 0 | 0 | 6 | 15 | 0 |
| Manor | Residential | 6 | 0 | 0 | 4 | 10 | 1 |
| Garage | Workplace | 0 | 6 | 0 | 4 | 8 | 0 |
| Fountain | Amenity | 0 | 0 | 0 | 0 | 2 | 1 |
| Pavement | Cosmetic | 0 | 0 | 0 | 0 | 0 | 0 |
| Roads (all) | Cosmetic | 0 | 0 | 0 | 0 | 0 | 0 |
| Grass / Trees / Tall Trees | Cosmetic | 0 | 0 | 0 | 0 | 0 | 0 |
| Hedge / Stone Wall | Cosmetic | 0 | 0 | 0 | 0 | 0 | 0 |

(Roads are functionally cosmetic in v0.1 — they look right but don't gate anything. Road-connectivity is a v0.2 feature.)

### New procedural buildings (5)

Each uses BoxMesh / CylinderMesh primitives + a StandardMaterial3D (same pattern as the existing stone-wall and hedge). All single-mesh, single-cell footprint.

| Asset | Cost | upkeep | Effect | Visual sketch |
|---|---|---|---|---|
| Coal Plant | $400 | 20 | +40 power | Dark gray box body + tall thin cylinder smokestack baked into one ArrayMesh (or accept two-mesh limitation — see note below) |
| Wind Turbine | $200 | 5 | +10 power | White cylinder tower, narrow |
| Police Station | $300 | 15 | police radius 6 | Blue box with white roof stripe |
| Factory | $500 | 20 | 15 jobs, 8 power demand | Wide tan box, low |
| Park | $150 | 3 | +2 amenity | Green flat box (taller than grass tile, with darker color) |

**Note on multi-mesh procedural items**: the current `Builder.get_mesh_data` picks the *first* MeshInstance3D. For v0.1, coal plant and police station collapse to a single primitive (box only, no smokestack / no roof stripe — visual fidelity sacrifice). If polish is wanted, a v0.2 enhancement extends `get_mesh_data` to fold multiple MeshInstance3D children into one ArrayMesh.

## UI summary

- **Top-left**: Cash icon + treasury label (existing, now bound to `SimState.treasury`).
- **Top-center**: Day counter (left) + ⏸ 1× 2× 4× buttons (right).
- **Top-right**: HUD card with Pop / Jobs / Power / Safety / Happiness face.
- **Right edge**: Shop (existing), now with affordability rendering.
- **Bottom-left**: Existing instructions image (untouched).
- **Game over**: full-screen modal `Control` overlay (initially hidden), shows on `SimState.game_over` signal.

## Out of scope (v0.2+ specs)

- Highways with traffic effects
- Oil / production chains (extraction → refining → sale)
- Military beyond police (army bases, defense)
- Education / healthcare buildings (schools, hospitals)
- Pollution
- Road-connectivity requirements (residentials require road adjacency)
- Per-citizen narrative ("Citizen 47 just moved out")
- Save-game extension to persist SimState (current save only persists GridMap)
- Tax-rate sliders (currently fixed)
- Multi-mesh procedural buildings

## Files to create / change

**New**
- `scripts/sim_state.gd` (autoload)
- `scripts/simulation.gd`
- `scripts/time_control.gd`
- `scripts/hud_card.gd` (extends Control)
- `scripts/game_over.gd` (modal controller)
- `models/coal-plant.tscn`, `models/wind-turbine.tscn`, `models/police-station.tscn`, `models/factory.tscn`, `models/park.tscn`
- `structures/coal-plant.tres`, `structures/wind-turbine.tres`, `structures/police-station.tres`, `structures/factory.tres`, `structures/park.tres`

**Changed**
- `scripts/structure.gd` — adds simulation fields.
- `scripts/builder.gd` — emits `grid_changed`, reads `SimState.treasury`, blocks unaffordable placement.
- `scripts/shop.gd` — affordability rendering.
- `scenes/main.tscn` — adds Simulation node, TimeControl, HUD card, GameOver modal, registers new structure resources in the Builder array.
- `project.godot` — registers `SimState` as autoload.
- All 15 existing `structures/*.tres` — populate new sim fields per the catalog table.

## Open tuning levers (numbers we'll likely revise after playtest)

- Tax rates ($0.5/citizen, $0.3/filled-job).
- Building prices / upkeep balance.
- Population & happiness lerp rates.
- Police radius.
- Bankruptcy threshold + grace period.
- Amenity bonus formula.

These all live in one place (SimState constants + Structure resources) so retuning is a single-file edit, no recompiles needed.
