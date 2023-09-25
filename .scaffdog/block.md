---
name: "block"
root: "."
output: "."
ignore: []
questions:
  name: "block name"
  title: "block title"
  description:
    message: "block description"
    initial: "this is my custom block"
  icon:
    message: "see https://developer.wordpress.org/resource/dashicons/#icons-block-editor"
    initial: "heading"
  category:
    message: "Please select a value."
    choices:
      - text
      - media
      - design
      - widgets
      - theme
      - embed
    initial: ["text"]
---

# Variables

- theme: mytheme
- name: `{{ inputs.name | kebab }}`

# `./source/wp-content/themes/{{ theme }}/blocks/{{ name }}/block.json`

```json
{
	"name": "acf/{{ name }}",
	"title": "{{ inputs.title }}",
	"description": "{{ inputs.description }}",
	"category": "{{ inputs.category }}",
	"icon": "{{ inputs.icon }}",
	"keywords": [],
	"supports": {
		"align": false,
		"customClassName": false,
		"mode": true,
		"anchor": false
	},
	"attributes": {},
	"acf": {
		"mode": "edit",
		"renderCallback": "my_acf_block_render_callback"
	}
}
```

# `./source/wp-content/themes/{{ theme }}/views/blocks/{{ name }}.twig`

```twig
{%#

Available props

block
fields
is_preview

#%}

<div>
Example
</div>

```

# `./source/wp-content/themes/{{ theme }}/acf-json/group_sb_{{ name }}.json`

```json
{
	"key": "group_sb_{{ name }}",
	"title": "Block: {{ inputs.name | pascal }}",
	"fields": [],
	"location": [
		[
			{
				"param": "block",
				"operator": "==",
				"value": "acf/{{ name }}"
			}
		]
	],
	"menu_order": 0,
	"position": "normal",
	"style": "default",
	"label_placement": "top",
	"instruction_placement": "label",
	"hide_on_screen": "",
	"active": true,
	"description": "",
	"show_in_rest": 0,
	"modified": 1666256071
}
```
