=== EchoDash ===
contributors: verygoodplugins
Requires at least: 6.0
Tested up to: 6.6.2
Requires PHP: 7.0
Stable tag: 0.0.3

Track events from supported plugins in EchoDash.

== Description ==
Track events from supported plugins in EchoDash.

== Installation ==

== Changelog ==

= 0.0.3 - 10/03/2024 =
* Added one-click connect to EchoDash service

= 0.0.2 - 9/28/2024 =
* Added "source" to event payload (plugin integration name)
* Added EchoDash user agent to event payload
* Improved - Removed merge tags on event name field
* Improved - API calls to EchoDash are sent non-blocking
* Simplified array format of events sent to EchoDash
* Fixed fatal error call to `ecd_logo_svg()`

= 0.0.1 - 9/11/2024 =
* Initial release