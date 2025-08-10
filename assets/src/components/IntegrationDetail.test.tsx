/**
 * IntegrationDetail Component Tests
 *
 * Unit tests for the IntegrationDetail component including
 * trigger display, trigger management, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntegrationDetail } from './IntegrationDetail';
import type { Integration, Trigger } from '../types';

// Mock the EchoDashLogo component
jest.mock('./EchoDashLogo', () => ({
	EchoDashLogo: ({ className }: { className?: string }) => (
		<div data-testid="echodash-logo" className={className}>
			EchoDash Logo
		</div>
	),
}));

describe('IntegrationDetail Component', () => {
	const mockIntegration: Integration = {
		slug: 'woocommerce',
		name: 'WooCommerce',
		icon: '/path/to/woocommerce-icon.png',
		iconBackgroundColor: '#96588a',
		triggerCount: 3,
		enabled: true,
		description: 'Track WooCommerce events and customer data',
		singleItemTriggers: [
			{
				trigger: 'product_purchased',
				name: 'Product Purchased',
				description: 'Triggered when a specific product is purchased',
				items: [
					{
						post_id: 123,
						post_title: 'Premium Course',
						edit_url: '/wp-admin/post.php?post=123&action=edit',
						event_name: 'Premium Course Purchased',
						mappings: [
							{ key: 'product_id', value: '{product:id}' },
							{ key: 'customer_email', value: '{user:email}' },
						],
					},
					{
						post_id: 456,
						post_title: 'Starter Kit',
						edit_url: '/wp-admin/post.php?post=456&action=edit',
						event_name: 'Starter Kit Purchased',
						mappings: [
							{ key: 'product_id', value: '{product:id}' },
						],
					},
				],
			},
		],
	};

	const mockTriggers: Trigger[] = [
		{
			id: '1',
			name: 'Order Completed',
			trigger: 'order_completed',
			description: 'Triggered when an order is completed',
			enabled: true,
			event_name: 'Order Completed',
			mappings: [
				{ key: 'order_id', value: '{order:id}' },
				{ key: 'customer_email', value: '{user:user_email}' },
			],
		},
		{
			id: '2',
			name: 'Customer Registration',
			trigger: 'user_registered',
			description: 'Triggered when a new customer registers',
			enabled: true,
			event_name: 'Customer Registration',
			mappings: [
				{ key: 'user_id', value: '{user:id}' },
				{ key: 'user_email', value: '{user:email}' },
			],
		},
	];

	const mockProps = {
		integration: mockIntegration,
		triggers: mockTriggers,
		onBack: jest.fn(),
		onAddTrigger: jest.fn(),
		onEditTrigger: jest.fn(),
		onDeleteTrigger: jest.fn(),
		onSendTest: jest.fn().mockResolvedValue(undefined),
		deletingTrigger: null,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders header with logo and documentation link', () => {
			render(<IntegrationDetail {...mockProps} />);

			expect(screen.getByTestId('echodash-logo')).toBeInTheDocument();
			expect(screen.getByText(/Documentation/)).toBeInTheDocument();
			expect(
				screen.getByText(/Documentation/).closest('a')
			).toHaveAttribute(
				'href',
				'https://echodash.com/docs/echodash-plugin/?utm_source=echodash-plugin&utm_medium=plugin&utm_campaign=echodash-plugin'
			);
		});

		it('renders breadcrumb navigation', () => {
			render(<IntegrationDetail {...mockProps} />);

			expect(screen.getByText('Integrations')).toBeInTheDocument();
			expect(screen.getAllByText('WooCommerce').length).toBeGreaterThan(
				0
			);
			expect(screen.getByText('/')).toBeInTheDocument();
		});

		it('renders integration header with icon and info', () => {
			render(<IntegrationDetail {...mockProps} />);

			const integrationIcon = screen.getByAltText('WooCommerce logo');
			expect(integrationIcon).toBeInTheDocument();
			expect(integrationIcon).toHaveAttribute(
				'src',
				'/path/to/woocommerce-icon.png'
			);
			expect(
				integrationIcon.closest('.echodash-integration-header__icon')
			).toHaveStyle({
				backgroundColor: '#96588a',
			});

			expect(screen.getAllByText('WooCommerce').length).toBeGreaterThan(
				0
			);
			expect(
				screen.getByText('Track WooCommerce events and customer data')
			).toBeInTheDocument();
		});

		it('renders integration header with fallback description', () => {
			const integrationWithoutDescription = {
				...mockIntegration,
				description: undefined,
			};

			render(
				<IntegrationDetail
					{...mockProps}
					integration={integrationWithoutDescription}
				/>
			);

			expect(
				screen.getByText('Configure triggers for this integration')
			).toBeInTheDocument();
		});

		it('renders global triggers section', () => {
			render(<IntegrationDetail {...mockProps} />);

			expect(screen.getByText('Global Triggers')).toBeInTheDocument();
			expect(screen.getByText('Order Completed')).toBeInTheDocument();
			expect(
				screen.getByText('Customer Registration')
			).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('renders empty state when no triggers exist', () => {
			render(<IntegrationDetail {...mockProps} triggers={[]} />);

			expect(
				screen.getByText('Add your first WooCommerce trigger')
			).toBeInTheDocument();
			expect(
				screen.getByText(
					'Global triggers fire for all events of the selected type across your site.'
				)
			).toBeInTheDocument();

			const addTriggerButtons = screen.getAllByText('+ Add Trigger');
			expect(addTriggerButtons.length).toBeGreaterThan(0);
		});

		it('clicking add trigger button in empty state calls onAddTrigger', () => {
			render(<IntegrationDetail {...mockProps} triggers={[]} />);

			const addTriggerButtons = screen.getAllByText('+ Add Trigger');
			fireEvent.click(addTriggerButtons[0]); // Click the first one

			expect(mockProps.onAddTrigger).toHaveBeenCalled();
		});
	});

	describe('Trigger List', () => {
		it('renders all trigger items with correct information', () => {
			render(<IntegrationDetail {...mockProps} />);

			// First trigger
			expect(screen.getByText('Order Completed')).toBeInTheDocument();
			expect(
				screen.getByText('Triggered when an order is completed')
			).toBeInTheDocument();

			// Second trigger
			expect(
				screen.getByText('Customer Registration')
			).toBeInTheDocument();
			expect(
				screen.getByText('Triggered when a new customer registers')
			).toBeInTheDocument();
		});

		it('renders trigger items with fallback description', () => {
			const triggersWithoutDescription = [
				{
					...mockTriggers[0],
					description: undefined,
				},
			];

			render(
				<IntegrationDetail
					{...mockProps}
					triggers={triggersWithoutDescription}
				/>
			);

			// Should show trigger name as fallback
			expect(screen.getByText('order_completed')).toBeInTheDocument();
		});

		it('renders drag handles for trigger reordering', () => {
			render(<IntegrationDetail {...mockProps} />);

			const dragHandles = document.querySelectorAll(
				'.echodash-trigger-item__handle'
			);
			expect(dragHandles).toHaveLength(2);
		});
	});

	describe('Trigger Actions', () => {
		it('calls onEditTrigger when edit button is clicked', () => {
			render(<IntegrationDetail {...mockProps} />);

			const editButtons = screen.getAllByText('Edit');
			fireEvent.click(editButtons[0]);

			expect(mockProps.onEditTrigger).toHaveBeenCalledWith(
				mockTriggers[0]
			);
		});

		it('shows confirmation dialog and calls onDeleteTrigger when delete is confirmed', () => {
			const mockConfirm = jest
				.spyOn(window, 'confirm')
				.mockReturnValue(true);

			render(<IntegrationDetail {...mockProps} />);

			const deleteButtons = screen.getAllByTitle('Delete trigger');
			fireEvent.click(deleteButtons[0]);

			expect(mockConfirm).toHaveBeenCalledWith(
				'Are you sure you want to delete the "Order Completed" trigger? This action cannot be undone.'
			);
			expect(mockProps.onDeleteTrigger).toHaveBeenCalledWith(
				mockTriggers[0]
			);
		});

		it('does not call onDeleteTrigger when delete is cancelled', () => {
			const mockConfirm = jest
				.spyOn(window, 'confirm')
				.mockReturnValue(false);

			render(<IntegrationDetail {...mockProps} />);

			const deleteButtons = screen.getAllByTitle('Delete trigger');
			fireEvent.click(deleteButtons[0]);

			expect(mockConfirm).toHaveBeenCalled();
			expect(mockProps.onDeleteTrigger).not.toHaveBeenCalled();
		});

		it('handles delete confirmation with fallback trigger name', () => {
			const mockConfirm = jest
				.spyOn(window, 'confirm')
				.mockReturnValue(true);
			const triggerWithoutName = [
				{ ...mockTriggers[0], name: undefined },
			];

			render(
				<IntegrationDetail
					{...mockProps}
					triggers={triggerWithoutName}
				/>
			);

			const deleteButton = screen.getByTitle('Delete trigger');
			fireEvent.click(deleteButton);

			expect(mockConfirm).toHaveBeenCalledWith(
				expect.stringContaining('"Untitled" trigger')
			);
		});
	});

	describe('Send Test Functionality', () => {
		it('calls onSendTest when send test button is clicked', async () => {
			render(<IntegrationDetail {...mockProps} />);

			const sendTestButtons = screen.getAllByText('Send Test');
			fireEvent.click(sendTestButtons[0]);

			expect(mockProps.onSendTest).toHaveBeenCalledWith(mockTriggers[0]);
		});

		it('shows sending state during test event', async () => {
			// Mock a slow-resolving promise
			let resolvePromise: () => void;
			const slowPromise = new Promise<void>(resolve => {
				resolvePromise = resolve;
			});
			const mockOnSendTest = jest.fn().mockReturnValue(slowPromise);

			render(
				<IntegrationDetail {...mockProps} onSendTest={mockOnSendTest} />
			);

			const sendTestButton = screen.getAllByText('Send Test')[0];
			fireEvent.click(sendTestButton);

			// Should show sending state
			await waitFor(() => {
				expect(screen.getByText('Sending...')).toBeInTheDocument();
			});

			// Button should be disabled
			expect(sendTestButton).toBeDisabled();

			// Complete the promise
			resolvePromise!();

			// Should show sent state
			await waitFor(() => {
				expect(screen.getByText('Sent!')).toBeInTheDocument();
			});

			// Should return to normal state after 3 seconds
			await waitFor(
				() => {
					expect(screen.getByText('Send Test')).toBeInTheDocument();
				},
				{ timeout: 4000 }
			);
		});

		it('handles test event error gracefully', async () => {
			const mockOnSendTest = jest
				.fn()
				.mockRejectedValue(new Error('Network error'));

			render(
				<IntegrationDetail {...mockProps} onSendTest={mockOnSendTest} />
			);

			const sendTestButton = screen.getAllByText('Send Test')[0];
			fireEvent.click(sendTestButton);

			// Should return to normal state after error
			await waitFor(() => {
				expect(screen.getByText('Send Test')).toBeInTheDocument();
			});

			// Button should be re-enabled
			expect(sendTestButton).not.toBeDisabled();
		});

		it('disables buttons when trigger is being deleted', () => {
			render(<IntegrationDetail {...mockProps} deletingTrigger="1" />);

			const sendTestButton = screen.getAllByText('Send Test')[0];
			const editButton = screen.getAllByText('Edit')[0];

			expect(sendTestButton).toBeDisabled();
			expect(editButton).toBeDisabled();
		});

		it('shows loading spinner when trigger is being deleted', () => {
			render(<IntegrationDetail {...mockProps} deletingTrigger="1" />);

			const deleteButton = screen.getAllByTitle('Delete trigger')[0];
			const spinner = deleteButton.querySelector('.ecd-spinner');

			expect(spinner).toBeInTheDocument();
		});
	});

	describe('Single Item Triggers', () => {
		it('renders single-item triggers section when present', () => {
			render(<IntegrationDetail {...mockProps} />);

			expect(screen.getByText('Single-Item Events')).toBeInTheDocument();
			expect(
				screen.getByText(
					'These events are configured on individual posts, forms, products, or courses.'
				)
			).toBeInTheDocument();
			expect(screen.getByText('Product Purchased')).toBeInTheDocument();
		});

		it('renders single-item trigger items with correct information', () => {
			render(<IntegrationDetail {...mockProps} />);

			expect(
				screen.getByText('Premium Course Purchased')
			).toBeInTheDocument();
			expect(
				screen.getByText('Starter Kit Purchased')
			).toBeInTheDocument();
			expect(screen.getByText('Premium Course')).toBeInTheDocument();
			expect(screen.getByText('Starter Kit')).toBeInTheDocument();
		});

		it('renders edit item links with correct URLs', () => {
			render(<IntegrationDetail {...mockProps} />);

			const editItemLinks = screen.getAllByText('Edit Item →');
			expect(editItemLinks[0]).toBeInTheDocument();
			expect(editItemLinks[0].closest('a')).toHaveAttribute(
				'href',
				'/wp-admin/post.php?post=123&action=edit'
			);
			expect(editItemLinks[0].closest('a')).toHaveAttribute(
				'target',
				'_blank'
			);
			expect(editItemLinks[0].closest('a')).toHaveAttribute(
				'rel',
				'noopener noreferrer'
			);
		});

		it('handles single-item triggers with fallback event names', () => {
			const integrationWithFallbacks = {
				...mockIntegration,
				singleItemTriggers: [
					{
						...mockIntegration.singleItemTriggers![0],
						items: [
							{
								...mockIntegration.singleItemTriggers![0]
									.items[0],
								event_name: '',
							},
						],
					},
				],
			};

			render(
				<IntegrationDetail
					{...mockProps}
					integration={integrationWithFallbacks}
				/>
			);

			expect(screen.getByText('Untitled Event')).toBeInTheDocument();
		});

		it('does not render single-item triggers section when not present', () => {
			const integrationWithoutSingleItems = {
				...mockIntegration,
				singleItemTriggers: undefined,
			};

			render(
				<IntegrationDetail
					{...mockProps}
					integration={integrationWithoutSingleItems}
				/>
			);

			expect(
				screen.queryByText('Single-Item Events')
			).not.toBeInTheDocument();
		});

		it('does not render single-item triggers section when array is empty', () => {
			const integrationWithEmptySingleItems = {
				...mockIntegration,
				singleItemTriggers: [],
			};

			render(
				<IntegrationDetail
					{...mockProps}
					integration={integrationWithEmptySingleItems}
				/>
			);

			expect(
				screen.queryByText('Single-Item Events')
			).not.toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('calls onBack when breadcrumb integrations link is clicked', () => {
			render(<IntegrationDetail {...mockProps} />);

			const integrationsLink = screen.getByText('Integrations');
			fireEvent.click(integrationsLink);

			expect(mockProps.onBack).toHaveBeenCalled();
		});

		it('calls onAddTrigger when add trigger button is clicked', () => {
			render(<IntegrationDetail {...mockProps} />);

			const addTriggerButtons = screen.getAllByText('+ Add Trigger');
			fireEvent.click(addTriggerButtons[0]); // Click the first one

			expect(mockProps.onAddTrigger).toHaveBeenCalled();
		});
	});

	describe('External Links', () => {
		it('renders external links with correct attributes', () => {
			render(<IntegrationDetail {...mockProps} />);

			// Logo link
			const logoLink = screen.getByTestId('echodash-logo').closest('a');
			expect(logoLink).toHaveAttribute(
				'href',
				'https://echodash.com/?utm_source=echodash-plugin&utm_medium=plugin&utm_campaign=echodash-plugin'
			);
			expect(logoLink).toHaveAttribute('target', '_blank');
			expect(logoLink).toHaveAttribute('rel', 'noopener');

			// Documentation link
			const docsLink = screen.getByText(/Documentation/).closest('a');
			expect(docsLink).toHaveAttribute(
				'href',
				'https://echodash.com/docs/echodash-plugin/?utm_source=echodash-plugin&utm_medium=plugin&utm_campaign=echodash-plugin'
			);
			expect(docsLink).toHaveAttribute('target', '_blank');
			expect(docsLink).toHaveAttribute('rel', 'noopener');
		});
	});

	describe('Edge Cases', () => {
		it('handles triggers without IDs gracefully', () => {
			const triggersWithoutIds = [
				{
					...mockTriggers[0],
					id: undefined as any,
				},
			];

			render(
				<IntegrationDetail
					{...mockProps}
					triggers={triggersWithoutIds}
				/>
			);

			expect(screen.getByText('Order Completed')).toBeInTheDocument();
		});

		it('handles empty trigger mappings', () => {
			const triggersWithEmptyMappings = [
				{
					...mockTriggers[0],
					mappings: undefined,
				},
			];

			render(
				<IntegrationDetail
					{...mockProps}
					triggers={triggersWithEmptyMappings}
				/>
			);

			expect(screen.getByText('Order Completed')).toBeInTheDocument();
		});

		it('handles integration without icon', () => {
			const integrationWithoutIcon = {
				...mockIntegration,
				icon: '',
			};

			render(
				<IntegrationDetail
					{...mockProps}
					integration={integrationWithoutIcon}
				/>
			);

			// Should still render without breaking
			expect(screen.getAllByText('WooCommerce').length).toBeGreaterThan(
				0
			);
		});
	});
});
