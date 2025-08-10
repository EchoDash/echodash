// Mock for @wordpress/api-fetch package

const mockApiFetch = jest.fn();

// Default implementation returns a resolved promise
mockApiFetch.mockImplementation(options => {
	// Handle different API endpoints based on options
	const { path, method = 'GET', data } = options;

	// Mock responses for different endpoints
	if (path === '/echodash/v1/settings') {
		if (method === 'GET') {
			return Promise.resolve({
				endpoint: 'https://test.echodash.com/webhook/test-endpoint',
				isConnected: true,
				connectUrl: 'https://echodash.com/connect',
			});
		} else if (method === 'POST') {
			return Promise.resolve({
				success: true,
				message: 'Settings saved successfully',
				data: data,
			});
		}
	}

	if (path === '/echodash/v1/integrations') {
		return Promise.resolve([
			{
				slug: 'woocommerce',
				name: 'WooCommerce',
				enabled: true,
				triggerCount: 3,
			},
			{
				slug: 'gravity-forms',
				name: 'Gravity Forms',
				enabled: true,
				triggerCount: 1,
			},
		]);
	}

	if (path && path.includes('/echodash/v1/integrations/')) {
		const slug = path.split('/').pop();
		return Promise.resolve({
			slug: slug,
			name: slug.charAt(0).toUpperCase() + slug.slice(1),
			enabled: true,
			triggers: [],
		});
	}

	if (path === '/echodash/v1/test-event') {
		return Promise.resolve({
			success: true,
			message: 'Test event sent successfully',
		});
	}

	if (path === '/echodash/v1/preview') {
		return Promise.resolve({
			success: true,
			preview: {
				event_name: 'Test Event',
				mappings: {
					user_email: 'test@example.com',
					user_id: 123,
				},
			},
		});
	}

	// Default response for unknown endpoints
	return Promise.resolve({
		success: true,
		data: {},
	});
});

// Add utility methods that wp.apiFetch has
mockApiFetch.use = jest.fn();
mockApiFetch.setFetchHandler = jest.fn();
mockApiFetch.createNonceMiddleware = jest.fn(
	() => (options, next) => next(options)
);
mockApiFetch.createPreloadingMiddleware = jest.fn(
	() => (options, next) => next(options)
);
mockApiFetch.createRootURLMiddleware = jest.fn(
	() => (options, next) => next(options)
);

export default mockApiFetch;
