/**
 * API Integration Tests
 *
 * Integration tests for API interactions between React components
 * and WordPress REST API endpoints.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

			// Navigate to integration detail
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			// Open trigger modal
			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			// Save trigger
			const saveButton = screen.getByText('Add Trigger');
			fireEvent.click(saveButton);

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
							name: 'Test Trigger',
							event_name: 'Test Trigger',
							mappings: [{ key: 'test', value: '{user:email}' }],
							send_test: undefined,
						}),
					}
				);
			});
		});

		it('updates existing trigger via API', async () => {
			mockFetchResponse({ id: '1', success: true });

			render(<App />);

			// Navigate to integration detail
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			// Edit existing trigger
			const editButtons = screen.getAllByText('Edit');
			fireEvent.click(editButtons[0]);

			// Save trigger
			const saveButton = screen.getByText('Update Trigger');
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
							name: 'Test Trigger',
							event_name: 'Test Trigger',
							mappings: [{ key: 'test', value: '{user:email}' }],
							send_test: undefined,
						}),
					}
				);
			});
		});

		it('deletes trigger via API', async () => {
			mockFetchResponse({});
			const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

			render(<App />);

			// Navigate to integration detail
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			// Delete trigger
			const deleteButtons = screen.getAllByTitle('Delete trigger');
			fireEvent.click(deleteButtons[0]);

			await waitFor(() => {
				expect(mockConfirm).toHaveBeenCalled();
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

			// Navigate and create trigger
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			const saveButton = screen.getByText('Add Trigger');
			fireEvent.click(saveButton);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					expect.stringContaining('Error saving trigger')
				);
			});
		});

		it('handles trigger deletion error', async () => {
			mockFetchError('Trigger deletion failed');
			const mockAlert = jest.spyOn(window, 'alert');
			const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

			render(<App />);

			// Navigate and delete trigger
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const deleteButtons = screen.getAllByTitle('Delete trigger');
			fireEvent.click(deleteButtons[0]);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					expect.stringContaining('Error deleting trigger')
				);
			});
		});
	});

	describe('Test Event API', () => {
		it('sends test event with proper API calls', async () => {
			// Mock preview API response
			mockFetchResponse({
				eventName: 'Test Event',
				processedData: { user_email: 'test@example.com', order_id: 12345 },
			});

			// Mock test event API response  
			mockFetchResponse({});

			render(<App />);

			// Navigate to integration detail
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
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
									{ key: 'customer_email', value: '{user:user_email}' },
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
								properties: { user_email: 'test@example.com', order_id: 12345 },
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

			// Navigate and send test
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const sendTestButtons = screen.getAllByText('Send Test');
			fireEvent.click(sendTestButtons[0]);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					expect.stringContaining('Error sending test event')
				);
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

			// Navigate and send test
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			const sendTestButtons = screen.getAllByText('Send Test');
			fireEvent.click(sendTestButtons[0]);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					expect.stringContaining('Error sending test event')
				);
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

			// Navigate to integration detail
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			// Open trigger modal
			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			// Save trigger (should filter out empty mappings)
			const saveButton = screen.getByText('Add Trigger');
			fireEvent.click(saveButton);

			await waitFor(() => {
				const fetchCall = (fetch as jest.MockedFunction<typeof fetch>).mock.calls.find(
					call => call[0].includes('/triggers')
				);
				
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

			// Navigate to integration detail
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});

			// Open trigger modal and clear all fields
			const addTriggerButton = screen.getByText('+ Add Trigger');
			fireEvent.click(addTriggerButton);

			// Clear event name
			const eventNameInput = screen.getByDisplayValue('Order Completed');
			fireEvent.change(eventNameInput, { target: { value: '' } });

			// Save trigger
			const saveButton = screen.getByText('Add Trigger');
			fireEvent.click(saveButton);

			await waitFor(() => {
				const fetchCall = (fetch as jest.MockedFunction<typeof fetch>).mock.calls.find(
					call => call[0].includes('/triggers')
				);
				
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

			// Navigate to integration detail
			const integrationButtons = screen.getAllByText('Go to WooCommerce');
			fireEvent.click(integrationButtons[0]);

			await waitFor(() => {
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
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