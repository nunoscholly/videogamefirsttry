extends Control

# Right-side categorized build menu. Reads structures from Builder, lets the
# player click an item to select it, and stays in sync with Q/E cycling via the
# Builder's `selection_changed` signal.

@export var builder: Node
@export var font: FontFile

const PANEL_WIDTH := 248
const ITEM_HEIGHT := 30

var _buttons: Array = []
var _category_colors := {
	"Roads": Color(0.62, 0.58, 0.55),
	"Public": Color(0.85, 0.7, 0.45),
	"Residential": Color(0.78, 0.45, 0.4),
	"Commercial": Color(0.55, 0.65, 0.8),
	"Power": Color(0.95, 0.78, 0.3),
	"Safety": Color(0.4, 0.55, 0.9),
	"Military": Color(0.5, 0.62, 0.4),
	"Civic": Color(0.9, 0.85, 0.95),
	"Infrastructure": Color(0.75, 0.75, 0.75),
	"Nature": Color(0.45, 0.7, 0.4),
}

func _ready() -> void:
	if builder == null:
		push_error("Shop: builder reference is missing")
		return
	if builder.has_signal("selection_changed"):
		builder.selection_changed.connect(_on_selection_changed)
	SimState.state_changed.connect(_on_state_changed)
	_buttons.resize(builder.structures.size())
	_build_ui()
	_highlight(builder.index)
	_refresh_affordability()

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.07, 0.08, 0.1, 0.78)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var scroll := ScrollContainer.new()
	scroll.anchor_right = 1.0
	scroll.anchor_bottom = 1.0
	scroll.offset_left = 12
	scroll.offset_right = -12
	scroll.offset_top = 12
	scroll.offset_bottom = -12
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 4)
	scroll.add_child(vbox)

	vbox.add_child(_make_title("BUILD"))

	var by_category := {}
	var order: Array[String] = []
	for i in range(builder.structures.size()):
		var s: Structure = builder.structures[i]
		var cat: String = s.category if s.category != "" else "Other"
		if not by_category.has(cat):
			by_category[cat] = []
			order.append(cat)
		by_category[cat].append(i)

	for cat in order:
		vbox.add_child(_make_header(cat))
		for idx in by_category[cat]:
			var btn := _make_item_button(idx, cat)
			_buttons[idx] = btn
			vbox.add_child(btn)
		vbox.add_child(_make_spacer(8))

	vbox.add_child(_make_hint("Q / E to cycle • Right-click to rotate"))

func _make_title(text: String) -> Label:
	var lbl := Label.new()
	lbl.text = text
	var s := LabelSettings.new()
	s.font = font
	s.font_size = 26
	s.font_color = Color(1, 0.94, 0.72)
	s.shadow_color = Color(0, 0, 0, 0.55)
	s.shadow_offset = Vector2(2, 2)
	lbl.label_settings = s
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return lbl

func _make_header(text: String) -> Label:
	var lbl := Label.new()
	lbl.text = text.to_upper()
	var s := LabelSettings.new()
	s.font = font
	s.font_size = 13
	s.font_color = _category_colors.get(text, Color(0.85, 0.82, 0.7))
	s.shadow_color = Color(0, 0, 0, 0.4)
	s.shadow_offset = Vector2(1, 1)
	lbl.label_settings = s
	return lbl

func _make_spacer(h: int) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(0, h)
	return c

func _make_hint(text: String) -> Label:
	var lbl := Label.new()
	lbl.text = text
	var s := LabelSettings.new()
	s.font = font
	s.font_size = 11
	s.font_color = Color(0.7, 0.7, 0.7)
	lbl.label_settings = s
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	return lbl

func _make_item_button(idx: int, cat: String) -> Button:
	var s: Structure = builder.structures[idx]
	var btn := Button.new()
	var name := s.display_name if s.display_name != "" else "Item %d" % idx
	btn.text = "%s    $%d" % [name, s.price]
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.custom_minimum_size = Vector2(0, ITEM_HEIGHT)
	btn.add_theme_font_override("font", font)
	btn.add_theme_font_size_override("font_size", 15)
	btn.add_theme_color_override("font_color", Color(0.92, 0.92, 0.9))
	btn.add_theme_color_override("font_hover_color", Color(1, 1, 0.85))
	btn.add_theme_color_override("font_pressed_color", Color(1, 0.9, 0.4))
	# Color the left edge by category via a stylebox.
	var cat_color: Color = _category_colors.get(cat, Color(0.6, 0.6, 0.6))
	btn.add_theme_stylebox_override("normal", _make_box(Color(0.14, 0.15, 0.18, 0.9), cat_color))
	btn.add_theme_stylebox_override("hover", _make_box(Color(0.22, 0.23, 0.28, 0.95), cat_color))
	btn.add_theme_stylebox_override("pressed", _make_box(Color(0.32, 0.28, 0.18, 0.95), cat_color))
	btn.add_theme_stylebox_override("focus", _make_box(Color(0, 0, 0, 0), cat_color, true))
	btn.pressed.connect(_on_button_pressed.bind(idx))
	return btn

func _make_box(bg: Color, accent: Color, focus_ring: bool = false) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(3)
	sb.content_margin_left = 12
	sb.content_margin_right = 8
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	# Left accent stripe via border.
	sb.border_width_left = 4
	sb.border_color = accent
	if focus_ring:
		sb.border_width_top = 1
		sb.border_width_right = 1
		sb.border_width_bottom = 1
	return sb

func _on_button_pressed(idx: int) -> void:
	if builder.has_method("select_structure"):
		builder.select_structure(idx)

func _on_selection_changed(idx: int) -> void:
	_highlight(idx)

func _on_state_changed() -> void:
	_refresh_affordability()

func _refresh_affordability() -> void:
	for i in range(_buttons.size()):
		var b: Button = _buttons[i]
		if b == null:
			continue
		var price: int = builder.structures[i].price
		var can_afford := SimState.can_afford(price)
		b.disabled = not can_afford
		if can_afford:
			b.add_theme_color_override("font_color", Color(0.92, 0.92, 0.9))
		else:
			b.add_theme_color_override("font_color", Color(0.85, 0.32, 0.32))
			b.add_theme_color_override("font_disabled_color", Color(0.85, 0.32, 0.32))

func _highlight(idx: int) -> void:
	for i in range(_buttons.size()):
		var b: Button = _buttons[i]
		if b == null:
			continue
		# Scale selected button slightly + brighten via modulate.
		if i == idx:
			b.modulate = Color(1.0, 0.95, 0.7)
			b.add_theme_font_size_override("font_size", 16)
		else:
			b.modulate = Color(1, 1, 1)
			b.add_theme_font_size_override("font_size", 15)
