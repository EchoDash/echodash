=== EchoDash ===
Contributors: echodash, verygoodplugins
Tags: analytics, tracking, activity, log, events
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.1.2
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Track user events and interactions from popular WordPress plugins in real-time with EchoDash analytics.

== Description ==

[EchoDash](https://echodash.com) is a powerful event tracking and analytics platform designed specifically for WordPress. It helps you monitor user interactions, track important events, and gather valuable analytics data across your WordPress sites and supported plugins.

= Key Features =

* **Real-time Event Tracking** - Monitor user interactions as they happen
* **Non-blocking Performance** - Asynchronous API calls ensure zero impact on site speed
* **Customizable Events** - Define exactly what data you want to track for each event
* **One-click Setup** - Connect to EchoDash with a single click
* **Default Configurations** - Pre-configured events for each integration
* **Test Events** - Send test events to verify your tracking setup
* **Clean Interface** - Modern, intuitive settings panel

= Supported Integrations =

* **AffiliateWP** - Track referrals and affiliate activity
* **Abandoned Cart** - Monitor abandoned shopping carts
* **bbPress** - Track forum activity and user engagement
* **BuddyPress** - Follow group activities, profile updates, and member interactions
* **Easy Digital Downloads** - Monitor purchases and downloads
* **EDD Recurring** - Track subscription payments and renewals
* **EDD Software Licensing** - Monitor license activations and software updates
* **GamiPress** - Track achievements, points, and rewards
* **Give** - Track donations and donor activity
* **Gravity Forms** - Track form submissions and entries
* **LearnDash** - Monitor course progress, quiz completions, and student engagement
* **LifterLMS** - Follow student progress and course interactions
* **Presto Player** - Track video engagement and watch time
* **WooCommerce** - Track orders, cart actions, and customer behavior
* **WooCommerce Subscriptions** - Monitor subscription status changes and renewals
* **WordPress** - Track core and plugin updates
* **Users** - Track user logins

= Use Cases =

1. **E-commerce Analytics**
   * Track purchase patterns
   * Monitor subscription renewals
   * Analyze refund rates
   * Track software license usage

2. **Community Engagement**
   * Monitor group activities
   * Track member interactions
   * Follow profile completions
   * Analyze forum engagement

3. **Learning Management**
   * Track course completions
   * Monitor quiz attempts
   * Follow student progress
   * Analyze engagement patterns

4. **Donation Tracking**
   * Monitor donation frequency
   * Track donor behavior
   * Analyze campaign success
   * Follow recurring donations

For more information, please visit the [EchoDash plugin documentation](https://echodash.com/docs/echodash-plugin/)

== Installation ==

1. Upload the 'echodash' folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > EchoDash
4. Click "Connect to EchoDash" to link your site
5. Configure which events you want to track for each integration

== Frequently Asked Questions ==

= Does this plugin slow down my site? =

No. EchoDash uses non-blocking API calls to send event data, meaning your site's performance is not affected. Events are processed in the background after the page has loaded.

= What data is collected? =

You have complete control over what data is collected. Each integration offers specific events you can track, and you can customize exactly what information is sent with each event.

= Is the data secure? =

Yes. All data is transmitted securely via HTTPS to EchoDash's servers. We never store sensitive information like passwords or payment details.

= Do I need an EchoDash account? =

Yes, you'll need a free EchoDash account to use the plugin. You can create one during the one-click setup process.

= Can I track custom events? =

Yes, developers can use our API to track custom events. Documentation is available at https://echodash.com/docs/api/

== Screenshots ==

1. Main settings page with Gravity Forms event configuration
2. Send events based on WooCommerce orders, product purchases, and order status changes
3. Track learner progress in real time with LearnDash and LifterLMS
4. The EchoDash dashboard with real-time event stream and analytics
5. Soon EchoDash will incorporate reports, dashboards, alerts, and summaries

== Changelog ==

= 1.1.2 - February 11, 2025 =
* Fixed URLs in test event data being sent as HTML entities
* Fixed undefined variable `$default` notice when getting the endpoint URL with `echodash_get_option()`
* Updated .pot file

= 1.1.1 - February 5, 2025 =
* Fixed type to search not working in the event variables dropdown
* Fixed Gravity Forms entry_url not being sent
* Fixed - Upgraded jQuery Repeater to latest version 1.2.2
* Fixed deprecated jQuery method notices in the admin
* Fixed improper sanitization and escaping of HTTP referrer and request URI data in the user variables
* Developers: all functions and filters are prefixed with `echodash_` instead of `ecd` to avoid conflicts

= 1.1.0 - January 30, 2025 =
* Added event triggers for WordPress core and plugin updates
* Fixed PHP warnings preparing nested arrays for user meta

= 1.0.2 - December 6, 2024 =
* Added support for WP Fusion tags when tracking user events
* Improved - updated previews to show user meta fields dynamically
* Improved preview data on Gravity Forms feed list
* Fixed missing user data
* Fixed broken tags in Gravity Forms integration: embed_post:post_title, entry_url, embed_url

= 1.0.1 - December 4, 2024 =
* Additional security and sanitization
* Updated license to GPL-3.0-or-later
* Updated README.md

= 1.0.0 - December 2, 2024 =
* Refactored, ready for production
* Added reset to defaults option
* Added default configurations for each integration
* Data sent to EchoDash now includes the source and trigger
* Added form validation for event names
* Improved UI/UX across settings pages

= 0.0.3 - October 3, 2024 =
* Added one-click connect to EchoDash service
* Improved error handling and user feedback

= 0.0.2 - September 28, 2024 =
* Added "source" to event payload (plugin integration name)
* Added EchoDash user agent to event payload
* Improved - Removed merge tags on event name field
* Improved - API calls to EchoDash are sent non-blocking
* Simplified array format of events sent to EchoDash
* Fixed fatal error call to `echodash_logo_svg()`

= 0.0.1 - September 11, 2024 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Major release with improved UI, default configurations, and better error handling. Upgrade recommended for all users.

== Developer Documentation ==

For developer documentation and API reference, please visit https://echodash.com/docs/