<?php

namespace FormApp;

require_once APP_PATH . "/BaseFormRepository.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\OAuth;
use League\OAuth2\Client\Provider\Google;

require get_template_directory() . "/vendor/autoload.php";

class BaseFormService
{
	private function useOAuth($mail)
	{
		$env = $this->repository->getEnv();

		$mail->isSMTP();
		$mail->Host = $env["Host"];
		$mail->SMTPSecure = $env["SMTPSecure"];
		$mail->Port = $env["Port"];
		$mail->SMTPAuth = $env["SMTPAuth"];
		$mail->AuthType = $env["AuthType"];

		$provider = new Google([
			"clientId" => $env["clientId"],
			"clientSecret" => $env["clientSecret"],
		]);

		$mail->setOAuth(
			new OAuth([
				"provider" => $provider,
				"clientId" => $env["clientId"],
				"clientSecret" => $env["clientSecret"],
				"refreshToken" => $env["refreshToken"],
				"userName" => $env["userName"],
			])
		);
	}

	private function useSMTP($mail, $admin)
	{
		$env = $this->repository->getEnv();
		$mail->isSMTP();
		$mail->SMTPAuth = $env["SMTPAuth"];
		$mail->Host = $env["Host"];
		$mail->Username = $env["Username"];
		$mail->Password = $env["Password"];
		$mail->SMTPSecure = $env["SMTPSecure"];
		$mail->Port = $env["Port"];
	}

	private function setupHosts($mail, $env)
	{
		$mail->Host = $env["Host"];
		$mail->Username = $env["Username"];
		$mail->Port = $env["Port"];
	}

	private static function evaluate($viewFile, $dataForView)
	{
		extract($dataForView);
		ob_start();
		include $viewFile;
		return ob_get_clean();
	}
	public $repository;

	public function __construct($configPath)
	{
		$this->repository = new BaseFormRepository($configPath);
	}

	public function build($props)
	{
		$mail = new PHPMailer(true);
		$mail->CharSet = "UTF-8";
		$mail->Encoding = "base64";
		try {
			$isDebug = $this->repository->isDebug();
			$reply = $this->repository->getReply();
			$subjects = $this->repository->getSubjects();
			$admins = $this->repository->getAdmins();
			$lang = $props["lang"] ?: $this->repository->getLang();

			// OAuth
			// =====================================
			$whitelist = ["127.0.0.1", "::1"];

			if (!in_array($_SERVER["REMOTE_ADDR"], $whitelist)) {
				$env = $this->repository->getEnv();
				// Google OAuth
				// $this->useOAuth($mail, $env);

				// SMTP
				// $this->useSMTP($mail, $env);

				// Without Password
				$this->setupHosts($mail, $env);
			}

			// user
			// =====================================
			$mail->clearAddresses();
			$mail->setFrom($reply["email"], $reply["name"]["user"]);
			$mail->Subject = $subjects["user"];
			$mail->addAddress($props["userEmail"]);

			$mail->Body = self::evaluate(APP_PATH . "/views/" . $lang . "/user.php", [
				"values" => $props["values"],
			]);

			$mail->send();

			// admin
			// =====================================
			$mail->clearAddresses();
			$mail->setFrom($reply["email"], $reply["name"]["admin"]);
			$mail->Subject = $subjects["admin"];

			if ($isDebug) {
				$mail->addAddress($props["userEmail"]);
			} else {
				foreach ($admins as $admin) {
					$mail->addAddress($admin);
				}
			}

			$mail->Body = self::evaluate(APP_PATH . "/views/" . $lang . "/admin.php", [
				"values" => $props["values"],
			]);
			$mail->send();

			return [
				"message" => "ok",
			];
		} catch (Exception $e) {
			return [
				"message" => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}",
			];
		}
	}
}
