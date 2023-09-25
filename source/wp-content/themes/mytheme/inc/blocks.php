<?php

namespace WordPressStarter\Theme;

add_action(
	"init",
	function () {
		foreach (glob(dirname(__DIR__) . "/blocks/*", GLOB_ONLYDIR) as $dir) {
			register_block_type($dir);
		}
	},
	5
);

// add_filter(
// 	"allowed_block_types_all",
// 	function ($allowed_block_types, $block_editor_context) {
// 		return $allowed_block_types;
// 	},
// 	10,
// 	2
// );

//add_filter(
//	"allowed_block_types_all",
//	function ($allowed_block_types, $block_editor_context) {
//		$block_types = [
//		];
//
//		if ($block_editor_context->post->post_type == "post") {
//			$block_types = [
//				"core/paragraph",
//				"core/list",
//				"core/list-item",
//				"acf/heading-subpage",
//				"core/block",
//			];
//		}
//
//		return $block_types;
//	},
//	10,
//	2
//);
