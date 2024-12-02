=== EchoDash - Event Tracking for WordPress ===
Contributors: verygoodplugins
Tags: analytics, events, tracking, woocommerce, gravity forms
Requires at least: 6.0
Tested up to: 6.6.2
Requires PHP: 7.0
Stable tag: 0.0.3
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Track user events and interactions from popular WordPress plugins in EchoDash analytics.

== Description ==

EchoDash helps you track important user events and interactions across your WordPress site. Integrate with popular plugins to gather valuable analytics data.

= Supported Integrations =
* WooCommerce
* Gravity Forms
* BuddyPress
* Easy Digital Downloads
* GamiPress
* LearnDash
* Give (Donations)
* Abandoned Cart tracking

= Features =
* One-click connection to EchoDash analytics service
* Non-blocking API calls for better performance
* Customizable event tracking
* Clean, modern interface

== Installation ==

1. Upload the 'echodash' folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to EchoDash settings and connect your account
4. Configure which events you want to track for each supported plugin

== Frequently Asked Questions ==

= Does this plugin slow down my site? =

No, EchoDash uses non-blocking API calls to send event data, so it won't impact your site's performance.

= What plugins are supported? =

EchoDash currently supports WooCommerce, Gravity Forms, BuddyPress, Easy Digital Downloads, GamiPress, LearnDash, and Give.

== Changelog ==

= 1.0.0 - December 2, 2024 =
* Refactored, ready for production.

= 0.0.3 - October 3, 2024 =
* Added one-click connect to EchoDash service

= 0.0.2 - September 28, 2024 =
* Added "source" to event payload (plugin integration name)
* Added EchoDash user agent to event payload
* Improved - Removed merge tags on event name field
* Improved - API calls to EchoDash are sent non-blocking
* Simplified array format of events sent to EchoDash
* Fixed fatal error call to `ecd_logo_svg()`

= 0.0.1 - September 11, 2024 =
* Initial release

== Upgrade Notice ==

= 0.0.3 =
This version adds one-click connection to EchoDash service for easier setup.