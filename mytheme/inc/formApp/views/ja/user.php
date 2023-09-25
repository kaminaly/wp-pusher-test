======================================================

<?php foreach ($values as $value) {
	$label = $value["label"];
	$data = $value["value"];

	echo <<<EOM
■ {$label}
{$data}


EOM;
} ?>

======================================================