=== EchoDash - Event Tracking and Activity Log ===
Contributors: verygoodplugins
Tags: analytics, events, tracking, woocommerce, gravity forms, buddypress, edd, gamipress, learndash, give, activity log
Requires at least: 6.0
Tested up to: 6.8.0
Requires PHP: 7.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Track user events and interactions from popular WordPress plugins in real-time with EchoDash analytics.

== Description ==

EchoDash is a powerful event tracking and analytics platform designed specifically for WordPress. It helps you monitor user interactions, track important events, and gather valuable analytics data across your WordPress site and supported plugins.

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

Yes, developers can use our API to track custom events. Documentation is available at https://echodash.com/docs/

== Screenshots ==

1. Main settings page with integration list
2. Event configuration interface
3. Real-time event stream
4. Analytics dashboard

== Changelog ==

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
* Fixed fatal error call to `ecd_logo_svg()`

= 0.0.1 - September 11, 2024 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Major release with improved UI, default configurations, and better error handling. Upgrade recommended for all users.

== Developer Documentation ==

For developer documentation and API reference, please visit https://echodash.com/docs/