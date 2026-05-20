extends Control

# Stats card on the right side of the screen, just under the shop. Shows
# the five simulation variables + happiness face. Updates on state_changed.

@export var font: FontFile

var _pop_label: Label
var _jobs_label: Label
var _power_label: Label
var _safety_label: Label
var _happy_label: Label

func _ready() -> void:
	SimState.state_changed.connect(_refresh)
	_build_ui()
	_refresh()

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.07, 0.08, 0.1, 0.78)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var vbox := VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.offset_left = 14
	vbox.offset_right = -14
	vbox.offset_top = 10
	vbox.offset_bottom = -10
	vbox.add_theme_constant_override("separation", 4)
	add_child(vbox)

	vbox.add_child(_make_title("CITY"))
	_pop_label = _make_stat("Pop"); vbox.add_child(_pop_label)
	_jobs_label = _make_stat("Jobs"); vbox.add_child(_jobs_label)
	_power_label = _make_stat("Power"); vbox.add_child(_power_label)
	_safety_label = _make_stat("Safety"); vbox.add_child(_safety_label)
	_happy_label = _make_stat("Mood"); vbox.add_child(_happy_label)

func _make_title(text: String) -> Label:
	var lbl := Label.new()
	lbl.text = text
	var s := LabelSettings.new()
	s.font = font
	s.font_size = 20
	s.font_color = Color(1, 0.94, 0.72)
	s.shadow_color = Color(0, 0, 0, 0.5)
	s.shadow_offset = Vector2(1, 1)
	lbl.label_settings = s
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return lbl

func _make_stat(name: String) -> Label:
	var lbl := Label.new()
	lbl.text = name
	var s := LabelSettings.new()
	s.font = font
	s.font_size = 14
	s.font_color = Color(0.95, 0.95, 0.9)
	lbl.label_settings = s
	return lbl

func _refresh() -> void:
	if _pop_label == null:
		return
	_pop_label.text = "Pop:    %d / %d" % [SimState.population, _pop_capacity_display()]
	_jobs_label.text = "Jobs:   %d / %d" % [SimState.jobs_filled, SimState.jobs_offered]
	_power_label.text = "Power:  %d / %d" % [SimState.power_supply, SimState.power_demand]
	_safety_label.text = "Safety: %d%%" % int(round(SimState.safety_coverage_pct * 100.0))
	_happy_label.text = "Mood:   %s  %d" % [SimState.happiness_face(), int(round(SimState.happiness))]

	# Power: red if shortfall.
	var pwr_color := Color(0.95, 0.95, 0.9)
	if SimState.power_demand > SimState.power_supply:
		pwr_color = Color(0.95, 0.45, 0.4)
	_power_label.label_settings.font_color = pwr_color

	# Safety: green if 100%, red if 0%.
	var sft = SimState.safety_coverage_pct
	if sft >= 0.99:
		_safety_label.label_settings.font_color = Color(0.5, 0.85, 0.45)
	elif sft <= 0.01:
		_safety_label.label_settings.font_color = Color(0.95, 0.5, 0.4)
	else:
		_safety_label.label_settings.font_color = Color(0.95, 0.85, 0.5)

	# Happiness: gradient.
	var h = SimState.happiness
	if h >= 70:
		_happy_label.label_settings.font_color = Color(0.5, 0.85, 0.45)
	elif h >= 40:
		_happy_label.label_settings.font_color = Color(0.95, 0.85, 0.5)
	else:
		_happy_label.label_settings.font_color = Color(0.95, 0.45, 0.4)

func _pop_capacity_display() -> int:
	# Show the *target* population so the player understands occupancy headroom.
	return SimState.population_target
