extends Control

# Pause / 1x / 2x / 4x buttons + day counter. Drives Simulation.set_speed.

@export var simulation: Node
@export var font: FontFile

const SPEEDS := [0.0, 1.0, 2.0, 4.0]
const LABELS := ["||", "1x", "2x", "4x"]

var _buttons: Array[Button] = []
var _day_label: Label

func _ready() -> void:
	if simulation == null:
		push_error("TimeControl: simulation not assigned")
		return
	SimState.state_changed.connect(_on_state_changed)
	_build_ui()
	_set_speed_index(0)  # start paused

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.07, 0.08, 0.1, 0.78)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var hbox := HBoxContainer.new()
	hbox.anchor_right = 1.0
	hbox.anchor_bottom = 1.0
	hbox.offset_left = 10
	hbox.offset_right = -10
	hbox.offset_top = 6
	hbox.offset_bottom = -6
	hbox.add_theme_constant_override("separation", 8)
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	add_child(hbox)

	_day_label = Label.new()
	_day_label.text = "Day 1"
	var ds := LabelSettings.new()
	ds.font = font
	ds.font_size = 18
	ds.font_color = Color(1, 0.94, 0.72)
	ds.shadow_color = Color(0, 0, 0, 0.5)
	ds.shadow_offset = Vector2(1, 1)
	_day_label.label_settings = ds
	_day_label.custom_minimum_size = Vector2(90, 0)
	_day_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(_day_label)

	for i in range(LABELS.size()):
		var btn := Button.new()
		btn.text = LABELS[i]
		btn.custom_minimum_size = Vector2(44, 30)
		btn.add_theme_font_override("font", font)
		btn.add_theme_font_size_override("font_size", 14)
		btn.pressed.connect(_set_speed_index.bind(i))
		hbox.add_child(btn)
		_buttons.append(btn)

func _set_speed_index(i: int) -> void:
	simulation.set_speed(SPEEDS[i])
	for j in range(_buttons.size()):
		_buttons[j].modulate = Color(1.0, 0.95, 0.4) if j == i else Color(1, 1, 1)

func _on_state_changed() -> void:
	if _day_label:
		_day_label.text = "Day %d" % SimState.day
