/**
 * Test Setup Utilities
 * 
 * Helper functions for setting up different test scenarios and states.
 */

import { Page } from 'playwright';

/**
 * Setup fresh installation state
 */
export async function setupFreshInstallState(page: Page): Promise<void> {
	await page.evaluate(() => {
		// Mock fresh installation
		(window as any).ecdTestData = {
			isFirstTime: true,
			hasApiKey: false,
			integrations: [],
			loading: { integrations: false },
			errors: {}
		};
	});
	
	// Navigate to setup screen
	await page.goto('/wp-admin/options-general.php?page=echodash&setup=1');
	await page.waitForSelector('#echodash-setup', { timeout: 5000 });
}

/**
 * Setup empty integration state
 */
export async function setupEmptyIntegrationState(page: Page): Promise<void> {
	await page.evaluate(() => {
		(window as any).ecdTestData = {
			isFirstTime: false,
			hasApiKey: true,
			integrations: [],
			loading: { integrations: false },
			errors: {}
		};
	});
	
	await page.reload();
	await page.waitForSelector('.ecd-integration-grid', { timeout: 5000 });
}

/**
 * Setup integration with triggers state
 */
export async function setupIntegrationWithTriggersState(page: Page): Promise<void> {
	await page.evaluate(() => {
		(window as any).ecdTestData = {
			isFirstTime: false,
			hasApiKey: true,
			integrations: [
				{
					slug: 'woocommerce',
					name: 'WooCommerce',
					icon: 'woocommerce',
					triggerCount: 5,
					enabled: true,
					description: 'Track WooCommerce store events',
					triggers: [
						{
							id: 'wc_order_completed',
							name: 'Order Completed',
							description: 'Triggered when an order is completed',
							enabled: true,
							mappingCount: 8,
							lastModified: '2024-02-15T10:30:00Z',
							hasErrors: false
						},
						{
							id: 'wc_product_purchased',
							name: 'Product Purchased',
							description: 'Triggered when a product is purchased',
							enabled: true,
							mappingCount: 6,
							lastModified: '2024-02-14T14:22:00Z',
							hasErrors: false
						},
						{
							id: 'wc_cart_abandoned',
							name: 'Cart Abandoned',
							description: 'Triggered when cart is abandoned',
							enabled: false,
							mappingCount: 4,
							lastModified: '2024-02-10T09:15:00Z',
							hasErrors: true,
							errorCount: 2
						}
					]
				},
				{
					slug: 'gravity-forms',
					name: 'Gravity Forms',
					icon: 'forms',
					triggerCount: 2,
					enabled: true,
					description: 'Track form submissions',
					triggers: [
						{
							id: 'gf_form_submitted',
							name: 'Form Submitted',
							description: 'Triggered when any form is submitted',
							enabled: true,
							mappingCount: 5,
							lastModified: '2024-02-12T11:45:00Z',
							hasErrors: false
						}
					]
				}
			],
			loading: { integrations: false },
			errors: {}
		};
	});
	
	await page.reload();
	await page.waitForSelector('.ecd-integration-card', { timeout: 5000 });
}

/**
 * Setup add trigger modal state
 */
export async function setupAddTriggerModalState(page: Page): Promise<void> {
	await setupIntegrationWithTriggersState(page);
	
	// Click on an integration to view details
	await page.click('.ecd-integration-card [data-testid="configure"]');
	await page.waitForSelector('.ecd-integration-detail');
	
	// Click add trigger button
	await page.click('[data-testid="add-trigger"]');
	await page.waitForSelector('.ecd-trigger-modal');
	
	// Set up modal test data
	await page.evaluate(() => {
		(window as any).ecdModalTestData = {
			availableFields: [
				{
					tag: '{user:user_email}',
					label: 'User: Email',
					objectType: 'user',
					fieldName: 'user_email',
					example: 'admin@example.com',
					dataType: 'string'
				},
				{
					tag: '{user:display_name}',
					label: 'User: Display Name',
					objectType: 'user',
					fieldName: 'display_name',
					example: 'John Doe',
					dataType: 'string'
				},
				{
					tag: '{order:order_total}',
					label: 'Order: Total',
					objectType: 'order',
					fieldName: 'order_total',
					example: '99.99',
					dataType: 'number'
				},
				{
					tag: '{product:name}',
					label: 'Product: Name',
					objectType: 'product',
					fieldName: 'name',
					example: 'Sample Product',
					dataType: 'string'
				}
			],
			integrationSlug: 'woocommerce',
			triggerTypes: [
				{
					value: 'order_completed',
					label: 'Order Completed',
					description: 'Triggered when an order is completed',
					defaultMappings: [
						{ key: 'user_email', value: '{user:user_email}' },
						{ key: 'order_total', value: '{order:order_total}' },
						{ key: 'order_id', value: '{order:ID}' }
					]
				},
				{
					value: 'product_purchased',
					label: 'Product Purchased',
					description: 'Triggered when a product is purchased',
					defaultMappings: [
						{ key: 'user_email', value: '{user:user_email}' },
						{ key: 'product_name', value: '{product:name}' },
						{ key: 'product_price', value: '{product:price}' }
					]
				}
			]
		};
	});
}

/**
 * Setup triggers with multiple items for drag and drop testing
 */
export async function setupTriggersWithMultipleItems(page: Page): Promise<void> {
	await page.evaluate(() => {
		(window as any).ecdTestData = {
			currentIntegration: 'woocommerce',
			triggers: [
				{
					id: 'trigger-1',
					name: 'Order Completed',
					description: 'Triggered when an order is completed',
					enabled: true,
					mappingCount: 8,
					lastModified: '2024-02-15T10:30:00Z'
				},
				{
					id: 'trigger-2',
					name: 'Product Purchased',
					description: 'Triggered when a product is purchased',
					enabled: true,
					mappingCount: 6,
					lastModified: '2024-02-14T14:22:00Z'
				},
				{
					id: 'trigger-3',
					name: 'Cart Abandoned',
					description: 'Triggered when cart is abandoned',
					enabled: false,
					mappingCount: 4,
					lastModified: '2024-02-10T09:15:00Z',
					hasErrors: true
				},
				{
					id: 'trigger-4',
					name: 'User Registered',
					description: 'Triggered when user registers',
					enabled: true,
					mappingCount: 3,
					lastModified: '2024-02-09T16:20:00Z'
				},
				{
					id: 'trigger-5',
					name: 'Subscription Cancelled',
					description: 'Triggered when subscription is cancelled',
					enabled: true,
					mappingCount: 5,
					lastModified: '2024-02-08T13:10:00Z'
				}
			]
		};
	});
	
	await page.goto('/wp-admin/options-general.php?page=echodash&integration=woocommerce');
	await page.waitForSelector('.ecd-sortable-list');
}

/**
 * Setup integration page with specific integration
 */
export async function setupIntegrationPage(page: Page, slug = 'woocommerce'): Promise<void> {
	await setupIntegrationWithTriggersState(page);
	
	// Navigate to specific integration
	await page.click(`[data-integration="${slug}"] [data-testid="configure"]`);
	await page.waitForSelector('.ecd-integration-detail');
}

/**
 * Setup trigger edit state
 */
export async function setupTriggerEditState(page: Page): Promise<void> {
	await setupIntegrationPage(page);
	
	// Click edit on first trigger
	await page.click('.ecd-trigger-card [data-testid="edit-trigger"]');
	await page.waitForSelector('.ecd-trigger-modal');
	
	// Wait for form to populate
	await page.waitForSelector('.ecd-event-mapper');
	
	// Set up preview test data
	await page.evaluate(() => {
		(window as any).ecdPreviewData = {
			user: {
				ID: 1,
				user_email: 'admin@example.com',
				display_name: 'John Doe',
				first_name: 'John',
				last_name: 'Doe'
			},
			order: {
				ID: 123,
				order_total: 99.99,
				order_status: 'completed',
				billing_email: 'customer@example.com'
			},
			product: {
				ID: 456,
				name: 'Sample Product',
				price: 29.99,
				sku: 'SAMPLE-001'
			}
		};
	});
}

/**
 * Wait for all animations to complete
 */
export async function waitForAnimationsToComplete(page: Page): Promise<void> {
	await page.evaluate(() => {
		return new Promise<void>((resolve) => {
			const checkAnimations = () => {
				const animations = document.getAnimations();
				if (animations.length === 0) {
					resolve();
				} else {
					requestAnimationFrame(checkAnimations);
				}
			};
			requestAnimationFrame(checkAnimations);
		});
	});
	
	// Additional wait for any delayed animations
	await page.waitForTimeout(100);
}

/**
 * Hide dynamic elements that change between test runs
 */
export async function hideDynamicElements(page: Page): Promise<void> {
	await page.addStyleTag({
		content: `
			.wp-admin-notice,
			.update-nag,
			.notice,
			[data-testid="timestamp"],
			.timestamp,
			[data-timestamp],
			.last-modified,
			.date-time {
				visibility: hidden !important;
				opacity: 0 !important;
			}
		`
	});
}

/**
 * Setup WordPress admin environment
 */
export async function setupWordPressEnvironment(page: Page): Promise<void> {
	// Add WordPress admin CSS variables and base styles
	await page.addStyleTag({
		content: `
			:root {
				--wp-admin-theme-color: #0073aa;
				--wp-admin-theme-color-darker-10: #005a87;
				--wp-admin-theme-color-darker-20: #004963;
			}
			
			body {
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				background: #f0f0f1;
				color: #1d2327;
			}
			
			.wp-admin {
				background: #f0f0f1;
			}
		`
	});
}

/**
 * Authenticate as admin user (mock)
 */
export async function authenticateAsAdmin(page: Page): Promise<void> {
	await page.evaluate(() => {
		(window as any).wpApiSettings = {
			root: '/wp-json/',
			nonce: 'test_nonce_12345',
			versionString: 'wp/v2/'
		};
		
		(window as any).ecdReactData = {
			apiUrl: '/wp-json/echodash/v1/',
			nonce: 'test_nonce_12345',
			currentUser: {
				ID: 1,
				display_name: 'Admin User',
				roles: ['administrator']
			},
			isAdmin: true
		};
	});
}