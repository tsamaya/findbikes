<?php

require_once './apikey.php'; // clés pour authentification sur les API

//$api_key='69000124e10e283b777305897f512c548dafb21f';
$contracts_url = 'https://api.jcdecaux.com/vls/v1/contracts?&apiKey=' . $api_key;
//echo $contracts_url ;
$contenu = file_get_contents($contracts_url);
echo $contenu;

?>