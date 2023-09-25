<?php

namespace FormApp;

class BaseFormRepository
{
	static function getConfigJson($path)
	{
		$json = file_get_contents($path);
		$json = mb_convert_encoding($json, "UTF8", "ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN");
		return json_decode($json, true);
	}

	private mixed $meta_data;
	private mixed $field_data;

	public function __construct($configPath)
	{
		$this->field_data = self::getConfigJson($configPath . "/field.json");
		$this->meta_data = self::getConfigJson($configPath . "/meta.json");
		$this->env_data = self::getConfigJson($configPath . "/env.json");
	}

	public function getFieldData()
	{
		return $this->field_data;
	}

	public function getLang(): mixed
	{
		return $this->meta_data["lang"];
	}

	public function getSubjects(): mixed
	{
		return $this->meta_data["subjects"];
	}

	public function getReply(): mixed
	{
		return $this->meta_data["reply"];
	}

	public function getAdmins(): mixed
	{
		return $this->meta_data["admins"];
	}

	public function getMetaData(): mixed
	{
		return $this->meta_data;
	}

	public function isDebug(): mixed
	{
		return $this->meta_data["DEBUG"];
	}

	public function getEnv(): mixed
	{
		return $this->env_data;
	}
}
