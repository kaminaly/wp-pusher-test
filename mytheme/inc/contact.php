<?php
define("APP_PATH", __DIR__ . "/formApp");

require_once APP_PATH . "/BaseFormService.php";

use FormApp\BaseFormService;

add_action("rest_api_init", function () {
	register_rest_route("mytheme", "/contact/field_data", [
		[
			"permission_callback" => "__return_true",
			"methods" => WP_REST_Server::READABLE,
			"callback" => function ($request) {
				if (session_status() !== PHP_SESSION_ACTIVE) {
					session_start();
				}

				$token = session_id();
				$_SESSION[$token] = true;
				$service = new BaseFormService(APP_PATH . "/config");

				return rest_ensure_response([
					"message" => "ok",
					"token" => $token,
					"fieldData" => $service->repository->getFieldData(),
				]);
			},
		],
	]);

	register_rest_route("mytheme", "/contact/send", [
		[
			"permission_callback" => "__return_true",
			"methods" => WP_REST_Server::CREATABLE,
			"callback" => function ($request) {
				if (session_status() !== PHP_SESSION_ACTIVE) {
					session_start();
				}

				$token = $request->get_param("token");

				if (!isset($token) || !isset($_SESSION[$token])) {
					return rest_ensure_response([
						"message" => "ng",
					]);
				}

				$service = new BaseFormService(APP_PATH . "/config");
				$response = $service->build([
					"lang" => $request->get_param("lang"),
					"userEmail" => $request->get_param("user_email"),
					"values" => $request->get_param("values"),
				]);

				unset($_SESSION[$token]);

				return rest_ensure_response($response);
			},
		],
	]);
});
