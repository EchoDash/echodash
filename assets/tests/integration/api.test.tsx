/**
 * API Integration Tests
 *
 * Integration tests for API interactions between React components
 * and WordPress REST API endpoints.
 */

import React from 'react';
import {
	render,
	screen,
	fireEvent,
	waitFor,
	within,
} from '@testing-library/react';
import { App } from '../../src/App';
import { mockFetchResponse, mockFetchError } from '../setup';

describe('API Integration Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Settings API', () => {
		it('saves endpoint settings successfully', async () => {
			mockFetchResponse({});

			render(<App />);

			// Find and change endpoint input
			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com/webhook' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/settings',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-WP-Nonce': 'test-nonce-12345',
						},
						body: JSON.stringify({
							endpoint: 'https://new-endpoint.com/webhook',
						}),
					}
				);
			});
		});

		it('handles settings API error gracefully', async () => {
			mockFetchError('Settings API error');
			const mockAlert = jest.spyOn(window, 'alert');

			render(<App />);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://invalid-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Failed to save endpoint URL. Please try again.'
				);
			});

			// Input should revert to original value
			expect(endpointInput).toHaveValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);
		});
	});

	describe('Triggers API', () => {
		it('creates new trigger via API', async () => {
			mockFetchResponse({ id: 'new-trigger-123', success: true });

			render(<App />);

			// Wait for component to render with data, then navigate to integration detail
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Find and click the Add Trigger button in the integration detail page
			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			// Wait for modal to open and save trigger
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const modal = screen.getByRole('dialog');
			const modalFooter = within(modal).getByRole('button', {
				name: /add trigger/i,
			});
			fireEvent.click(modalFooter);

			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/integrations/woocommerce/triggers',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-WP-Nonce': 'test-nonce-12345',
						},
						body: JSON.stringify({
							trigger: 'order_completed',
							name: 'Order Completed',
							event_name: 'Order Completed',
							mappings: [
								{ key: 'order_id', value: '{order:id}' },
								{
									key: 'customer_email',
									value: '{user:user_email}',
								},
								{ key: 'order_total', value: '{order:total}' },
							],
							send_test: undefined,
						}),
					}
				);
			});
		});

		it('updates existing trigger via API', async () => {
			mockFetchResponse({ id: '1', success: true });

			render(<App />);

			// Wait for component to render with data, then navigate to integration detail
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Edit existing trigger
			const editButtons = screen.getAllByText('Edit');
			fireEvent.click(editButtons[0]);

			// Wait for modal to open and save trigger
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const modal = screen.getByRole('dialog');
			const saveButton = within(modal).getByRole('button', {
				name: /update trigger/i,
			});
			fireEvent.click(saveButton);

			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/integrations/woocommerce/triggers/1',
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							'X-WP-Nonce': 'test-nonce-12345',
						},
						body: JSON.stringify({
							trigger: 'order_completed',
							name: 'Purchase Completed',
							event_name: 'Purchase Completed',
							mappings: [
								{ key: 'order_id', value: '{order:id}' },
								{
									key: 'customer_email',
									value: '{user:user_email}',
								},
								{ key: 'order_total', value: '{order:total}' },
							],
							send_test: undefined,
						}),
					}
				);
			});
		});

		it('deletes trigger via API', async () => {
			mockFetchResponse({});
			jest.spyOn(window, 'confirm').mockReturnValue(true);

			render(<App />);

			// Wait for component to render with data, then navigate to integration detail
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Delete trigger
			const deleteButtons = screen.getAllByTitle('Delete trigger');
			fireEvent.click(deleteButtons[0]);

			await waitFor(() => {
				expect(window.confirm).toHaveBeenCalled();
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/integrations/woocommerce/triggers/1',
					{
						method: 'DELETE',
						headers: {
							'X-WP-Nonce': 'test-nonce-12345',
						},
					}
				);
			});
		});

		it('handles trigger creation error', async () => {
			mockFetchError('Trigger creation failed');
			const mockAlert = jest.spyOn(window, 'alert');

			render(<App />);

			// Wait for component to render with data, then navigate and create trigger
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Find and click the Add Trigger button in the integration detail page
			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const modal = screen.getByRole('dialog');
			const saveButton = within(modal).getByRole('button', {
				name: /add trigger/i,
			});
			fireEvent.click(saveButton);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Trigger creation failed'
				);
			});
		});

		it('handles trigger deletion error', async () => {
			mockFetchError('Trigger deletion failed');
			const mockAlert = jest.spyOn(window, 'alert');
			jest.spyOn(window, 'confirm').mockReturnValue(true);

			render(<App />);

			// Wait for component to render with data, then navigate and delete trigger
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			const deleteButtons = screen.getAllByTitle('Delete trigger');
			fireEvent.click(deleteButtons[0]);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Trigger deletion failed'
				);
			});
		});
	});

	describe('Test Event API', () => {
		it('sends test event with proper API calls', async () => {
			// Mock preview API response
			mockFetchResponse({
				eventName: 'Test Event',
				processedData: {
					user_email: 'test@example.com',
					order_id: 12345,
				},
			});

			// Mock test event API response
			mockFetchResponse({});

			render(<App />);

			// Wait for component to render with data, then navigate to integration detail
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Send test event
			const sendTestButtons = screen.getAllByText('Send Test');
			fireEvent.click(sendTestButtons[0]);

			await waitFor(() => {
				// Should call preview API first
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/preview',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-WP-Nonce': 'test-nonce-12345',
						},
						body: JSON.stringify({
							eventConfig: {
								name: 'Purchase Completed',
								mappings: [
									{ key: 'order_id', value: '{order:id}' },
									{
										key: 'customer_email',
										value: '{user:user_email}',
									},
									{
										key: 'order_total',
										value: '{order:total}',
									},
								],
							},
							integrationSlug: 'woocommerce',
							triggerId: 'order_completed',
						}),
					}
				);

				// Should call test event API second
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/test-event',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-WP-Nonce': 'test-nonce-12345',
						},
						body: JSON.stringify({
							eventData: {
								name: 'Test Event',
								properties: {
									user_email: 'test@example.com',
									order_id: 12345,
								},
							},
							integrationSlug: 'woocommerce',
							trigger: 'order_completed',
						}),
					}
				);
			});
		});

		it('handles test event preview API error', async () => {
			mockFetchError('Preview API error');
			const mockAlert = jest.spyOn(window, 'alert');

			render(<App />);

			// Wait for component to render with data, then navigate and send test
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			const sendTestButtons = screen.getAllByText('Send Test');
			fireEvent.click(sendTestButtons[0]);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith('Preview API error');
			});
		});

		it('handles test event API error after successful preview', async () => {
			// Mock successful preview
			mockFetchResponse({
				eventName: 'Test Event',
				processedData: { test: 'data' },
			});

			// Mock failed test event
			mockFetchError('Test event API error');
			const mockAlert = jest.spyOn(window, 'alert');

			render(<App />);

			// Wait for component to render with data, then navigate and send test
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			const sendTestButtons = screen.getAllByText('Send Test');
			fireEvent.click(sendTestButtons[0]);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith('Test event API error');
			});
		});
	});

	describe('API Error Handling', () => {
		it('handles network errors gracefully', async () => {
			// Simulate network error
			(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
				new Error('Network Error')
			);
			const mockAlert = jest.spyOn(window, 'alert');

			render(<App />);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Failed to save endpoint URL. Please try again.'
				);
			});
		});

		it('handles HTTP error responses', async () => {
			// Mock HTTP error response
			(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({ message: 'Internal Server Error' }),
			} as Response);
			const mockAlert = jest.spyOn(window, 'alert');

			render(<App />);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Failed to save endpoint URL. Please try again.'
				);
			});
		});

		it('handles malformed JSON responses', async () => {
			// Mock invalid JSON response
			(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => {
					throw new Error('Invalid JSON');
				},
			} as Response);
			const mockAlert = jest.spyOn(window, 'alert');

			render(<App />);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Failed to save endpoint URL. Please try again.'
				);
			});
		});
	});

	describe('API Authentication', () => {
		it('includes WordPress nonce in all API requests', async () => {
			mockFetchResponse({});

			render(<App />);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith(
					expect.any(String),
					expect.objectContaining({
						headers: expect.objectContaining({
							'X-WP-Nonce': 'test-nonce-12345',
						}),
					})
				);
			});
		});

		it('handles missing nonce gracefully', async () => {
			const originalData = window.ecdReactData;
			window.ecdReactData = {
				...originalData,
				nonce: undefined,
			} as any;

			mockFetchResponse({});

			render(<App />);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith(
					expect.any(String),
					expect.objectContaining({
						headers: expect.objectContaining({
							'X-WP-Nonce': '',
						}),
					})
				);
			});

			// Restore original data
			window.ecdReactData = originalData;
		});
	});

	describe('API Data Validation', () => {
		it('validates trigger data before sending', async () => {
			mockFetchResponse({ id: 'test-trigger' });

			render(<App />);

			// Wait for component to render with data, then navigate to integration detail
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Open trigger modal
			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			// Wait for modal to open
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const modal = screen.getByRole('dialog');

			// Save trigger (should filter out empty mappings)
			const saveButton = within(modal).getByRole('button', {
				name: /add trigger/i,
			});
			fireEvent.click(saveButton);

			await waitFor(() => {
				const fetchCall = (
					fetch as jest.MockedFunction<typeof fetch>
				).mock.calls.find(call => call[0].includes('/triggers'));

				expect(fetchCall).toBeDefined();

				if (fetchCall) {
					const body = JSON.parse(fetchCall[1]!.body as string);

					// Should only include mappings with both key and value
					body.mappings.forEach((mapping: any) => {
						expect(mapping.key).toBeTruthy();
						expect(mapping.value).toBeTruthy();
					});
				}
			});
		});

		it('handles empty trigger data', async () => {
			mockFetchResponse({ id: 'empty-trigger' });

			render(<App />);

			// Wait for component to render with data, then navigate to integration detail
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Open trigger modal and clear all fields
			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			// Wait for modal to open
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const modal = screen.getByRole('dialog');

			// Clear event name using CSS selector since multiple textboxes exist
			const eventNameInput = document.querySelector(
				'.echodash-event-name__input'
			) as HTMLInputElement;
			fireEvent.change(eventNameInput, { target: { value: '' } });

			// Save trigger
			const saveButton = within(modal)
				.getAllByRole('button', { name: /add trigger/i })
				.find(btn => btn.classList.contains('echodash-button-primary'));
			fireEvent.click(saveButton);

			await waitFor(() => {
				const fetchCall = (
					fetch as jest.MockedFunction<typeof fetch>
				).mock.calls.find(call => call[0].includes('/triggers'));

				expect(fetchCall).toBeDefined();

				if (fetchCall) {
					const body = JSON.parse(fetchCall[1]!.body as string);
					expect(body.name).toBe('');
					expect(body.event_name).toBe('');
				}
			});
		});
	});

	describe('Concurrent API Calls', () => {
		it('handles multiple simultaneous API calls', async () => {
			mockFetchResponse({});
			mockFetchResponse({});

			render(<App />);

			// Wait for component to render with data, then navigate to integration detail
			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const integrationButtons = screen.getAllByText('Manage');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(
					screen.getAllByText('WooCommerce').length
				).toBeGreaterThan(0);
			});

			// Trigger multiple test events quickly
			const sendTestButtons = screen.getAllByText('Send Test');
			fireEvent.click(sendTestButtons[0]);
			fireEvent.click(sendTestButtons[0]); // Click again quickly

			// Should handle concurrent calls gracefully
			await waitFor(() => {
				expect(fetch).toHaveBeenCalled();
			});
		});
	});
});
