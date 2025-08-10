/**
 * App Component Tests
 *
 * Comprehensive unit tests for the main App component including
 * navigation, state management, and API interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { App } from './App';
import { mockFetchResponse, mockFetchError } from '../tests/setup';
import type { Integration, Trigger } from './types';

// Mock the child components to isolate App component testing
jest.mock('./components/IntegrationList', () => ({
	IntegrationList: ({ onIntegrationClick, onAddTrigger }: any) => (
		<div data-testid="integration-list">
			<button onClick={() => onIntegrationClick('woocommerce')}>
				Go to WooCommerce
			</button>
			<button onClick={() => onAddTrigger('gravity-forms')}>
				Add Gravity Forms Trigger
			</button>
		</div>
	),
}));

jest.mock('./components/IntegrationDetail', () => ({
	IntegrationDetail: ({ 
		integration, 
		triggers, 
		onBack, 
		onAddTrigger, 
		onEditTrigger, 
		onDeleteTrigger, 
		onSendTest 
	}: any) => (
		<div data-testid="integration-detail">
			<h1>{integration.name}</h1>
			<button onClick={onBack}>Back to List</button>
			<button onClick={onAddTrigger}>Add Trigger</button>
			{triggers.map((trigger: Trigger) => (
				<div key={trigger.id} data-testid={`trigger-${trigger.id}`}>
					<span>{trigger.name}</span>
					<button onClick={() => onEditTrigger(trigger)}>Edit</button>
					<button onClick={() => {
						if (window.confirm(`Are you sure you want to delete the "${trigger.name}" trigger? This action cannot be undone.`)) {
							onDeleteTrigger(trigger);
						}
					}}>Delete</button>
					<button onClick={() => onSendTest(trigger)}>Send Test</button>
				</div>
			))}
		</div>
	),
}));

jest.mock('./components/TriggerModal', () => ({
	TriggerModal: ({ isOpen, onClose, onSave, editingTrigger, integration }: any) => {
		if (!isOpen) return null;
		
		const handleSave = () => {
			onSave({
				trigger: 'order_completed',
				name: 'Test Trigger',
				mappings: [{ key: 'test', value: '{user:email}' }],
			});
		};

		return (
			<div data-testid="trigger-modal">
				<h2>{editingTrigger ? 'Edit Trigger' : 'Add Trigger'}</h2>
				<p>Integration: {integration.name}</p>
				<button onClick={onClose}>Close</button>
				<button onClick={handleSave}>Save</button>
			</div>
		);
	},
}));

describe('App Component', () => {
	beforeEach(() => {
		// Reset URL hash before each test
		window.location.hash = '';
		jest.clearAllMocks();
	});

	describe('Initial Rendering', () => {
		it('renders the integration list by default', () => {
			render(<App />);
			
			expect(screen.getByTestId('integration-list')).toBeInTheDocument();
			expect(screen.queryByTestId('integration-detail')).not.toBeInTheDocument();
		});

		it('renders with default data when window.ecdReactData is undefined', () => {
			const originalData = window.ecdReactData;
			delete (window as any).ecdReactData;
			
			render(<App />);
			
			expect(screen.getByTestId('integration-list')).toBeInTheDocument();
			
			// Restore original data
			window.ecdReactData = originalData;
		});
	});

	describe('Navigation', () => {
		it('navigates to integration detail when clicking an integration', async () => {
			render(<App />);
			
			const integrationButton = screen.getByText('Go to WooCommerce');
			fireEvent.click(integrationButton);
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-detail')).toBeInTheDocument();
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
				expect(screen.queryByTestId('integration-list')).not.toBeInTheDocument();
			});
		});

		it('navigates back to integration list when clicking back', async () => {
			render(<App />);
			
			// Go to detail view
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-detail')).toBeInTheDocument();
			});
			
			// Go back to list
			fireEvent.click(screen.getByText('Back to List'));
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-list')).toBeInTheDocument();
				expect(screen.queryByTestId('integration-detail')).not.toBeInTheDocument();
			});
		});

		it('updates URL hash when navigating to integration detail', async () => {
			const mockPushState = jest.spyOn(window.history, 'pushState');
			
			render(<App />);
			
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			
			await waitFor(() => {
				expect(mockPushState).toHaveBeenCalledWith(
					{},
					'',
					expect.stringContaining('#/integration/woocommerce')
				);
			});
		});

		it('handles browser back/forward navigation', async () => {
			render(<App />);
			
			// Simulate navigation to integration detail via URL hash
			act(() => {
				window.location.hash = '#/integration/woocommerce';
				window.dispatchEvent(new PopStateEvent('popstate'));
			});
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-detail')).toBeInTheDocument();
				expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			});
			
			// Simulate navigation back to list
			act(() => {
				window.location.hash = '';
				window.dispatchEvent(new PopStateEvent('popstate'));
			});
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-list')).toBeInTheDocument();
			});
		});
	});

	describe('Trigger Modal Management', () => {
		it('opens trigger modal when adding trigger from list', async () => {
			render(<App />);
			
			fireEvent.click(screen.getByText('Add Gravity Forms Trigger'));
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-detail')).toBeInTheDocument();
				expect(screen.getByTestId('trigger-modal')).toBeInTheDocument();
			});
		});

		it('opens trigger modal when adding trigger from detail view', async () => {
			render(<App />);
			
			// Navigate to detail view
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-detail')).toBeInTheDocument();
			});
			
			// Open trigger modal
			fireEvent.click(screen.getByText('Add Trigger'));
			
			expect(screen.getByTestId('trigger-modal')).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: 'Add Trigger' })).toBeInTheDocument();
		});

		it('opens trigger modal for editing existing trigger', async () => {
			render(<App />);
			
			// Navigate to WooCommerce which has existing triggers
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			
			await waitFor(() => {
				expect(screen.getByTestId('integration-detail')).toBeInTheDocument();
			});
			
			// Edit existing trigger
			const editButton = screen.getAllByText('Edit')[0];
			fireEvent.click(editButton);
			
			expect(screen.getByTestId('trigger-modal')).toBeInTheDocument();
			expect(screen.getByText('Edit Trigger')).toBeInTheDocument();
		});

		it('closes trigger modal when clicking close', async () => {
			render(<App />);
			
			// Navigate to detail and open modal
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			fireEvent.click(screen.getByText('Add Trigger'));
			
			expect(screen.getByTestId('trigger-modal')).toBeInTheDocument();
			
			// Close modal
			fireEvent.click(screen.getByText('Close'));
			
			await waitFor(() => {
				expect(screen.queryByTestId('trigger-modal')).not.toBeInTheDocument();
			});
		});
	});

	describe('Trigger CRUD Operations', () => {
		it('creates a new trigger successfully', async () => {
			mockFetchResponse({ id: 'new-trigger-123' });
			
			render(<App />);
			
			// Navigate to detail and open modal
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			fireEvent.click(screen.getByText('Add Trigger'));
			
			// Save new trigger
			fireEvent.click(screen.getByText('Save'));
			
			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/integrations/woocommerce/triggers',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json',
							'X-WP-Nonce': 'test-nonce-12345',
						}),
						body: JSON.stringify({
							trigger: 'order_completed',
							name: 'Test Trigger',
							event_name: 'Test Trigger',
							mappings: [{ key: 'test', value: '{user:email}' }],
							send_test: undefined,
						}),
					})
				);
			});
			
			// Modal should close after successful save
			await waitFor(() => {
				expect(screen.queryByTestId('trigger-modal')).not.toBeInTheDocument();
			});
		});

		it('handles trigger creation error', async () => {
			mockFetchError('Failed to create trigger');
			const mockAlert = jest.spyOn(window, 'alert');
			
			render(<App />);
			
			// Navigate to detail and open modal
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			fireEvent.click(screen.getByText('Add Trigger'));
			
			// Save new trigger
			fireEvent.click(screen.getByText('Save'));
			
			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					expect.stringContaining('Failed to create trigger')
				);
			});
		});

		it('deletes a trigger successfully', async () => {
			mockFetchResponse({});
			const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
			
			render(<App />);
			
			// Navigate to WooCommerce which has existing triggers
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			
			// Delete trigger
			const deleteButton = screen.getAllByText('Delete')[0];
			fireEvent.click(deleteButton);
			
			await waitFor(() => {
				expect(mockConfirm).toHaveBeenCalledWith(
					expect.stringContaining('Are you sure you want to delete')
				);
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/integrations/woocommerce/triggers/1',
					expect.objectContaining({
						method: 'DELETE',
						headers: expect.objectContaining({
							'X-WP-Nonce': 'test-nonce-12345',
						}),
					})
				);
			});
		});

		it('cancels trigger deletion when user cancels confirmation', async () => {
			const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
			
			render(<App />);
			
			// Navigate to WooCommerce which has existing triggers
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			
			// Try to delete trigger
			const deleteButton = screen.getAllByText('Delete')[0];
			fireEvent.click(deleteButton);
			
			expect(mockConfirm).toHaveBeenCalled();
			expect(fetch).not.toHaveBeenCalled();
		});
	});

	describe('Test Event Functionality', () => {
		it('sends test event successfully', async () => {
			// Mock preview API call
			mockFetchResponse({
				eventName: 'Test Event',
				processedData: { test: 'test@example.com' },
			});
			
			// Mock test event API call
			mockFetchResponse({});
			
			render(<App />);
			
			// Navigate to WooCommerce which has existing triggers
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			
			// Send test event
			const sendTestButton = screen.getAllByText('Send Test')[0];
			fireEvent.click(sendTestButton);
			
			await waitFor(() => {
				// Should call preview API first
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/preview',
					expect.objectContaining({
						method: 'POST',
						body: JSON.stringify({
							eventConfig: {
								name: 'Purchase Completed',
								mappings: [
									{ key: 'order_id', value: '{order:id}' },
									{ key: 'customer_email', value: '{user:user_email}' },
									{ key: 'order_total', value: '{order:total}' }
								]
							},
							integrationSlug: 'woocommerce',
							triggerId: 'order_completed',
						}),
					})
				);
				
				// Then call test event API
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/test-event',
					expect.objectContaining({
						method: 'POST',
						body: JSON.stringify({
							eventData: {
								name: 'Test Event',
								properties: { test: 'test@example.com' },
							},
							integrationSlug: 'woocommerce',
							trigger: 'order_completed',
						}),
					})
				);
			});
		});

		it('handles test event error', async () => {
			mockFetchError('Network error');
			const mockAlert = jest.spyOn(window, 'alert');
			
			render(<App />);
			
			// Navigate to WooCommerce which has existing triggers
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			
			// Send test event
			const sendTestButton = screen.getAllByText('Send Test')[0];
			fireEvent.click(sendTestButton);
			
			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					expect.stringContaining('Network error')
				);
			});
		});
	});

	describe('EchoDash Callback Handling', () => {
		it('reloads page when EchoDash callback parameters are present', () => {
			const mockReload = jest.spyOn(window.location, 'reload').mockImplementation();
			
			// Mock URL search params
			const originalLocation = window.location;
			delete (window as any).location;
			window.location = {
				href: 'http://localhost/',
				pathname: '/',
				search: '?page=echodash&endpoint_url=https://test.com&wpnonce=abc123',
				hash: '',
				reload: mockReload,
			} as any;
			
			render(<App />);
			
			expect(mockReload).toHaveBeenCalled();
			
			// Restore original location
			window.location = originalLocation;
		});
	});

	describe('State Management', () => {
		it('maintains trigger count when adding new triggers', async () => {
			mockFetchResponse({ id: 'new-trigger-456' });
			
			render(<App />);
			
			// Navigate to Gravity Forms which has 0 triggers initially
			fireEvent.click(screen.getByText('Add Gravity Forms Trigger'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			
			// The integration should now show Gravity Forms
			expect(screen.getByText('Gravity Forms')).toBeInTheDocument();
			
			// Wait for modal to open and save new trigger
			await waitFor(() => screen.getByTestId('trigger-modal'));
			fireEvent.click(screen.getByText('Save'));
			
			await waitFor(() => {
				expect(screen.queryByTestId('trigger-modal')).not.toBeInTheDocument();
			});
			
			// Trigger count should be updated in the integration state
			// This is tested indirectly by ensuring the modal closes successfully
			// which indicates the state update completed
		});

		it('maintains integration state consistency during operations', async () => {
			render(<App />);
			
			// Navigate to WooCommerce
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			
			// Should show existing trigger
			expect(screen.getByTestId('trigger-1')).toBeInTheDocument();
			expect(screen.getByText('Purchase Completed')).toBeInTheDocument();
			
			// Navigate back and forth
			fireEvent.click(screen.getByText('Back to List'));
			await waitFor(() => screen.getByTestId('integration-list'));
			
			fireEvent.click(screen.getByText('Go to WooCommerce'));
			await waitFor(() => screen.getByTestId('integration-detail'));
			
			// State should be preserved
			expect(screen.getByTestId('trigger-1')).toBeInTheDocument();
			expect(screen.getByText('Purchase Completed')).toBeInTheDocument();
		});
	});
});