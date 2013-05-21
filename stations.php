<?php

require_once './apikey.php'; // clés pour authentification sur les API

$contracts_url = 'https://api.jcdecaux.com/vls/v1/stations?apiKey=' . $api_key . '&contract=' . $_GET['contract'];
$contenu = file_get_contents($contracts_url);
echo $contenu;

?>