<?php
require_once './apikey.php'; // Authentication keys for API
$contracts_url = 'https://api.jcdecaux.com/vls/v1/stations?apiKey=' . $api_key . '&contract=' . $_GET['contract'];
$contenu = file_get_contents($contracts_url);
echo $contenu;
?>