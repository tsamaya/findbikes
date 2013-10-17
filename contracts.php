<?php
require_once './apikey.php'; // clés pour authentification sur les API
$contracts_url = 'https://api.jcdecaux.com/vls/v1/contracts?&apiKey=' . $api_key;
//echo $contracts_url ;
$contenu = file_get_contents($contracts_url);
echo $contenu;
?>