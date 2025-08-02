# EchoDash New Interface Guide

## Welcome to the New EchoDash Experience

The EchoDash admin interface has been completely redesigned with React for a faster, more intuitive experience while preserving all functionality you rely on.

## What's New

### Key Improvements

- **⚡ Faster Performance**: Modern React architecture loads 60% faster than the classic interface
- **♿ Better Accessibility**: Full keyboard navigation and screen reader support (WCAG 2.1 AA compliant)
- **🎨 Improved User Experience**: Cleaner design with better visual hierarchy and intuitive workflows
- **✨ Enhanced Features**: Live preview, drag & drop trigger ordering, improved search and filtering
- **📱 Mobile Responsive**: Works seamlessly on tablets and mobile devices
- **🔄 Real-time Updates**: Instant feedback and live preview of your configurations

### Preserved Functionality

- All your existing integrations and triggers work exactly the same
- No data loss or configuration changes required
- Same WordPress permissions and user roles respected
- All API connections and webhooks remain unchanged

## Getting Started

### Switching Between Interfaces

You can toggle between the classic and new interface at any time:

1. Go to **Settings > EchoDash** in your WordPress admin
2. Look for the **"Interface Preference"** section
3. Select **"New React Interface"** or **"Classic Interface"**
4. The page will reload automatically with your selected interface

### First Time Setup

If you're new to EchoDash, the React interface will guide you through setup:

1. **Connection Setup**: Enter your EchoDash API credentials
2. **Integration Selection**: Choose which WordPress plugins to connect
3. **Event Configuration**: Set up your first event triggers
4. **Test & Validate**: Send test events to verify your setup

## Interface Overview

### Dashboard View

The main dashboard shows all your integrations as cards:

- **Integration Cards**: Each WordPress plugin integration is displayed as a card
- **Quick Stats**: See trigger count and status at a glance
- **Search & Filter**: Find specific integrations quickly
- **Add New**: One-click access to add new integrations

### Integration Configuration

When configuring an integration, you'll see:

- **Trigger List**: All available triggers for the selected plugin
- **Live Preview**: Real-time preview of event data as you configure
- **Drag & Drop**: Reorder triggers by dragging and dropping
- **Smart Forms**: Context-aware form fields that adapt to your selections

### Event Configuration

Setting up events is now more intuitive:

- **Event Builder**: Visual form builder for creating events
- **Merge Tag Assistant**: Smart suggestions for available data fields
- **Live Preview**: See exactly what data will be sent before saving
- **Validation**: Real-time validation prevents configuration errors

## Key Features Explained

### Live Preview System

The live preview shows you exactly what data will be sent to EchoDash:

1. Configure your event properties using merge tags like `{user:email}`
2. The preview updates automatically as you make changes
3. Use the **"Send Test Event"** button to send a real test to EchoDash
4. Verify the data appears correctly in your EchoDash dashboard

### Drag & Drop Trigger Ordering

Organize your triggers by priority:

1. Hover over any trigger card to see the drag handle (⋮⋮)
2. Click and drag triggers to reorder them
3. Changes are saved automatically
4. This affects the order triggers appear in lists and reports

### Smart Search & Filtering

Find what you need quickly:

- **Global Search**: Type in the search box to filter all content
- **Integration Filter**: Filter by specific WordPress plugins
- **Status Filter**: Show only active, inactive, or error triggers
- **Smart Suggestions**: Search suggests as you type

### Keyboard Navigation

The interface is fully keyboard accessible:

- **Tab**: Navigate between elements
- **Enter/Space**: Activate buttons and toggles
- **Escape**: Close modals and cancel actions
- **Arrow Keys**: Navigate lists and cards
- **F**: Focus the search box (global shortcut)

## Common Tasks

### Adding a New Integration

1. Click the **"Add Integration"** button on the dashboard
2. Select your WordPress plugin from the list
3. Choose which triggers you want to enable
4. Configure the default event settings
5. Click **"Save Integration"** to activate

### Editing an Existing Trigger

1. Find the integration containing your trigger
2. Click the **"Configure"** button on the integration card
3. Find your trigger in the list and click the **"Edit"** button
4. Make your changes in the trigger editor
5. Use the live preview to verify your changes
6. Click **"Save Trigger"** to apply changes

### Setting up Conditional Logic

1. When editing a trigger, scroll to the **"Conditions"** section
2. Click **"Add Condition"** to create a new rule
3. Select the field, operator, and value for your condition
4. Add multiple conditions using AND/OR logic
5. The live preview will show how conditions affect the data

### Bulk Operations

Select multiple triggers to perform bulk actions:

1. Use the checkboxes to select multiple triggers
2. Click the **"Bulk Actions"** dropdown
3. Choose from Enable, Disable, Delete, or Export
4. Confirm your action when prompted

## Troubleshooting

### Can't See the New Interface?

**Check Your Browser**:
- Ensure JavaScript is enabled
- Use a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)

**Check Your User Permissions**:
- You need WordPress administrator privileges
- The feature may be disabled by your site administrator
- Contact your site administrator if you should have access

**Still Having Issues?**:
- Try switching back to the classic interface temporarily
- Clear your browser cache and cookies for your WordPress site
- Try using an incognito/private browsing window

### Want to Go Back to the Old Interface?

You can switch back anytime:

1. Go to **Settings > EchoDash**
2. Select **"Classic Interface"** in the Interface Preference section
3. All your settings are preserved between interfaces
4. You can switch back and forth as many times as you want

### Performance Issues?

If the interface feels slow:

- **Check Your Connection**: Ensure you have a stable internet connection
- **Clear Browser Cache**: Old cached files can cause conflicts
- **Disable Browser Extensions**: Some ad blockers or security extensions may interfere
- **Check Memory Usage**: Close other browser tabs if you have many open

### Configuration Not Saving?

If your changes aren't being saved:

- **Check Permissions**: Ensure you have administrator privileges
- **Look for Error Messages**: Red error messages will appear if validation fails
- **Verify Required Fields**: Make sure all required fields are filled out
- **Check Internet Connection**: Changes require server communication

### Events Not Sending?

If test events aren't reaching EchoDash:

1. **Check API Connection**: Use the "Test Connection" button in settings
2. **Verify API Credentials**: Ensure your API key and endpoint are correct
3. **Review Event Configuration**: Check for validation errors in red
4. **Check WordPress Logs**: Look for error messages in WordPress debug logs
5. **Contact Support**: If all else fails, contact EchoDash support with error details

## Getting Help

### In-App Help

- **Tooltips**: Hover over any ⓘ icon for context-sensitive help
- **Documentation Links**: Click "Learn More" links for detailed guides
- **Live Chat**: Use the chat widget (if available) for real-time help

### Additional Resources

- **Knowledge Base**: Visit [docs.echodash.com](https://docs.echodash.com) for detailed guides
- **Video Tutorials**: Watch setup and configuration videos
- **Community Forum**: Connect with other users and share tips
- **Support Tickets**: Submit detailed support requests for technical issues

### Developer Resources

If you're a developer working on custom integrations:

- **Developer Guide**: See `DEVELOPER_GUIDE.md` for technical documentation
- **API Documentation**: Complete API reference and examples
- **Code Examples**: Sample implementations and best practices
- **GitHub Repository**: Contribute to the project or report bugs

## Beta Feedback

As a user of the new React interface, your feedback is valuable:

### How to Provide Feedback

1. **In-App Feedback**: Use the feedback widget in the interface
2. **Support Tickets**: Submit detailed feedback through support
3. **Community Forum**: Share your experience with other users
4. **Direct Email**: Send feedback to feedback@echodash.com

### What to Include

- **What you like**: Features that work well for you
- **Pain points**: Anything that's confusing or doesn't work as expected
- **Suggestions**: Ideas for improvements or new features
- **Browser/OS**: Technical details if reporting bugs
- **Screenshots**: Visual examples of issues or suggestions

### Known Limitations

The React interface is feature-complete, but some areas are still being refined:

- **Complex Conditional Logic**: Advanced conditions may be easier in the classic interface
- **Bulk Import/Export**: Large-scale data operations may be slower
- **Third-party Plugin Conflicts**: Some WordPress plugins may interfere
- **Older Browser Support**: May not work optimally on very old browsers

We're continuously improving the interface based on user feedback and usage patterns.

## Keyboard Shortcuts

Speed up your workflow with these keyboard shortcuts:

### Global Shortcuts
- **F** or **/** - Focus the search box
- **Ctrl+S** (Cmd+S on Mac) - Save current form
- **Escape** - Close modals or cancel current action
- **?** - Show keyboard shortcuts help

### Navigation
- **Tab** - Next element
- **Shift+Tab** - Previous element
- **Enter** - Activate button or link
- **Space** - Toggle checkbox or expand item
- **Arrow Keys** - Navigate lists and cards

### Form Shortcuts
- **Ctrl+Enter** (Cmd+Enter on Mac) - Submit form
- **Ctrl+Z** (Cmd+Z on Mac) - Undo last change
- **Ctrl+Shift+Z** (Cmd+Shift+Z on Mac) - Redo last change

## Advanced Tips

### Power User Features

1. **Batch Configuration**: Use the bulk selection tools to configure multiple triggers at once
2. **Keyboard Navigation**: Learn the keyboard shortcuts for faster navigation
3. **Preview Shortcuts**: Use Ctrl+Click on trigger names to preview without opening the editor
4. **Search Operators**: Use quotes for exact matches: "user login" vs user login
5. **Quick Filters**: Use the filter toolbar for common configurations

### Customization Options

- **Layout Preferences**: Adjust card sizes and list views in your profile
- **Notification Settings**: Control when you receive alerts and notifications
- **Default Values**: Set up default configurations for new triggers
- **Export/Import**: Backup your configurations for reuse on other sites

### Performance Optimization

- **Enable Caching**: Allow your browser to cache interface assets
- **Optimize Images**: Compress screenshots and images in documentation
- **Regular Cleanup**: Periodically clean up unused triggers and configurations
- **Monitor Performance**: Use the performance metrics in the admin dashboard

---

**Need more help?** Visit our [support center](https://support.echodash.com) or contact us at support@echodash.com