# FindBikes
### Welcome to findBikes with ArcGIS ! 

This application will help you to find a JCDecaux self-service bike (to pick and park).

## Installation:
* Clone or download this repository
* Configure the JCDDecaux API Key.
* Move it to your web server
* Enjoy!

.....................................
Configuration
.....................................

Get a key at [JCDecaux](https://developer.JCDecaux.com/) and set it in the file apikey.php
```php
// apikey.php
<?php
	$api_key="xxxxxxxxxxxxxxxxxxxxxxxxxxx";
?>
```
## demo
Try it : [Findbikes](http://gis.tsamaya.net/findbikes/).

## History

* 0.7 - Mar 03, 2014 - Default infoWindow size, fix Issue #1 infoWindow is availalble with geocoding
* 0.6 - Feb 02, 2014 - upgrade to 3.8
* 0.5 - Oct 20, 2013 - AMD
* 0.4 - Oct 17, 2013 - Using ESRI JS API 3.7, select a contract zooms to the GraphicsLayer
* 0.3 - Jun 16, 2013 - GPS tracking (on/off) 
* 0.2 - May 23, 2013 - Adding location 
* 0.1 - May 22, 2013 - Creation


## Resources

* [API ArcGIS for Javascript](http://js.arcgis.com/), for the map ;
* [API de JCDecaux](https://developer.JCDecaux.com/), for self-services bicycles ;

## Licensing

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt](license.txt) file.

## About Me
See more at [About.me](http://about.me/arnaudferrand)

