extends Control

# Full-screen overlay shown when SimState fires game_over. Click "New City" to
# reload the main scene fresh.

@export var font: FontFile

var _title_label: Label
var _reason_label: Label

func _ready() -> void:
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	SimState.game_over.connect(_on_game_over)
	_build_ui()

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0, 0, 0, 0.75)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var center := CenterContainer.new()
	center.anchor_right = 1.0
	center.anchor_bottom = 1.0
	add_child(center)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 16)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	_title_label = Label.new()
	_title_label.text = "GAME OVER"
	var ts := LabelSettings.new()
	ts.font = font
	ts.font_size = 64
	ts.font_color = Color(0.95, 0.45, 0.4)
	ts.shadow_color = Color(0, 0, 0, 0.6)
	ts.shadow_offset = Vector2(3, 3)
	_title_label.label_settings = ts
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(_title_label)

	_reason_label = Label.new()
	_reason_label.text = ""
	var rs := LabelSettings.new()
	rs.font = font
	rs.font_size = 22
	rs.font_color = Color(0.95, 0.92, 0.85)
	_reason_label.label_settings = rs
	_reason_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(_reason_label)

	var btn := Button.new()
	btn.text = "New City"
	btn.custom_minimum_size = Vector2(220, 56)
	btn.add_theme_font_override("font", font)
	btn.add_theme_font_size_override("font_size", 22)
	btn.pressed.connect(_on_new_city_pressed)
	vbox.add_child(btn)

func _on_game_over(reason: String) -> void:
	var msg := ""
	match reason:
		"bankruptcy":
			msg = "Your treasury collapsed."
		"abandonment":
			msg = "Your citizens all left."
		_:
			msg = "Your city failed."
	_reason_label.text = "%s\nDay %d · Pop %d" % [msg, SimState.day, SimState.population]
	visible = true

func _on_new_city_pressed() -> void:
	SimState.reset()
	get_tree().reload_current_scene()
