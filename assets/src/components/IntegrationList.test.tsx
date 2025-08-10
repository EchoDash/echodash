/**
 * IntegrationList Component Tests
 *
 * Unit tests for the IntegrationList component including
 * integration display, endpoint management, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntegrationList } from './IntegrationList';
import { mockFetchResponse, mockFetchError } from '../../tests/setup';
import type { Integration, EchoDashSettings } from '../types';

// Mock the EchoDashLogo component
jest.mock('./EchoDashLogo', () => ({
	EchoDashLogo: ({ className }: { className?: string }) => (
		<div data-testid="echodash-logo" className={className}>
			EchoDash Logo
		</div>
	),
}));

describe('IntegrationList Component', () => {
	const mockIntegrations: Integration[] = [
		{
			slug: 'woocommerce',
			name: 'WooCommerce',
			icon: '/path/to/woocommerce-icon.png',
			iconBackgroundColor: '#96588a',
			triggerCount: 3,
			enabled: true,
			description: 'Track WooCommerce events',
		},
		{
			slug: 'gravity-forms',
			name: 'Gravity Forms',
			icon: '/path/to/gravity-forms-icon.png',
			iconBackgroundColor: '#ff6900',
			triggerCount: 0,
			enabled: true,
			description: 'Track form submissions',
		},
		{
			slug: 'learndash',
			name: 'LearnDash',
			icon: '/path/to/learndash-icon.png',
			iconBackgroundColor: '#2196F3',
			triggerCount: 1,
			enabled: false,
			description: 'Track learning management events',
		},
	];

	const mockConnectedSettings: EchoDashSettings = {
		endpoint: 'https://test.echodash.com/webhook/test-endpoint',
		isConnected: true,
		connectUrl: 'https://echodash.com/connect',
	};

	const mockDisconnectedSettings: EchoDashSettings = {
		endpoint: '',
		isConnected: false,
		connectUrl: 'https://echodash.com/connect',
	};

	const mockOnIntegrationClick = jest.fn();
	const mockOnAddTrigger = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders header with logo and documentation link', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			expect(screen.getByTestId('echodash-logo')).toBeInTheDocument();
			expect(screen.getByText(/Documentation/)).toBeInTheDocument();
			expect(
				screen.getByText(/Documentation/).closest('a')
			).toHaveAttribute(
				'href',
				'https://echodash.com/docs/echodash-plugin/?utm_source=echodash-plugin&utm_medium=plugin&utm_campaign=echodash-plugin'
			);
		});

		it('renders welcome section with correct title and description', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			expect(screen.getByText('Welcome to EchoDash')).toBeInTheDocument();
			expect(
				screen.getByText(
					"EchoDash is a service for tracking real-time events on your WordPress site. It's free and easy to use."
				)
			).toBeInTheDocument();
		});

		it('renders all integrations in the list', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			expect(screen.getByText('WooCommerce')).toBeInTheDocument();
			expect(screen.getByText('Gravity Forms')).toBeInTheDocument();
			expect(screen.getByText('LearnDash')).toBeInTheDocument();
		});

		it('displays correct trigger counts for each integration', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			// WooCommerce should show "3 Triggers"
			expect(screen.getByText('3 Triggers')).toBeInTheDocument();

			// Gravity Forms should show "0 Triggers"
			expect(screen.getByText('0 Triggers')).toBeInTheDocument();

			// LearnDash should show "1 Trigger"
			expect(screen.getByText('1 Trigger')).toBeInTheDocument();
		});

		it('renders integration icons with correct styling', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const wooIcon = screen.getByAltText('WooCommerce logo');
			expect(wooIcon).toHaveAttribute(
				'src',
				'/path/to/woocommerce-icon.png'
			);
			expect(
				wooIcon.closest('.echodash-integration-item__icon')
			).toHaveStyle({
				backgroundColor: '#96588a',
			});

			const gravityIcon = screen.getByAltText('Gravity Forms logo');
			expect(gravityIcon).toHaveAttribute(
				'src',
				'/path/to/gravity-forms-icon.png'
			);
			expect(
				gravityIcon.closest('.echodash-integration-item__icon')
			).toHaveStyle({
				backgroundColor: '#ff6900',
			});
		});
	});

	describe('Connection States', () => {
		it('shows connect button when not connected', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockDisconnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			expect(
				screen.getByText(
					'To get started, create an endpoint in your EchoDash account by clicking the button below.'
				)
			).toBeInTheDocument();

			const connectButton = screen.getByText(/Connect to EchoDash/);
			expect(connectButton).toBeInTheDocument();
			expect(connectButton.closest('a')).toHaveAttribute(
				'href',
				'https://echodash.com/connect'
			);
		});

		it('shows endpoint input when connected', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			expect(
				screen.getByText(
					'Your endpoint URL is configured below. You can update it anytime if needed.'
				)
			).toBeInTheDocument();

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);
			expect(endpointInput).toBeInTheDocument();
			expect(endpointInput).toHaveAttribute('id', 'endpoint-url');
		});
	});

	describe('Endpoint Management', () => {
		it('saves endpoint when input loses focus with changed value', async () => {
			mockFetchResponse({});

			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			// Change the value
			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com/webhook' },
			});

			// Trigger onBlur
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith(
					'/wp-json/echodash/v1/settings',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json',
							'X-WP-Nonce': 'test-nonce-12345',
						}),
						body: JSON.stringify({
							endpoint: 'https://new-endpoint.com/webhook',
						}),
					})
				);
			});
		});

		it('does not save endpoint when value has not changed', async () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			// Trigger onBlur without changing value
			fireEvent.blur(endpointInput);

			// Should not make any API calls
			expect(fetch).not.toHaveBeenCalled();
		});

		it('shows saving indicator during save operation', async () => {
			// Create a promise that we can control
			let resolvePromise!: (value: {
				ok: boolean;
				json: () => Promise<Record<string, unknown>>;
			}) => void;
			const savePromise = new Promise(resolve => {
				resolvePromise = resolve;
			});

			(fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
				savePromise.then(() => ({
					ok: true,
					json: async () => ({}),
				})) as Promise<Response>
			);

			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			// Change value and trigger save
			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			// Should show saving indicator
			await waitFor(() => {
				expect(screen.getByText('Saving...')).toBeInTheDocument();
			});

			// Should disable input during save
			expect(endpointInput).toBeDisabled();

			// Complete the save
			resolvePromise({ ok: true, json: async () => ({}) });

			// Saving indicator should disappear
			await waitFor(() => {
				expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
			});

			// Input should be re-enabled
			expect(endpointInput).not.toBeDisabled();
		});

		it('handles save error and reverts value', async () => {
			mockFetchError('Network error');
			const mockAlert = jest.spyOn(window, 'alert');

			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			// Change value and trigger save
			fireEvent.change(endpointInput, {
				target: { value: 'https://invalid-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Failed to save endpoint URL. Please try again.'
				);
			});

			// Value should be reverted to original
			expect(endpointInput).toHaveValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);
		});

		it('shows configuration error when API URL is not available', async () => {
			const originalData = window.ecdReactData;
			window.ecdReactData = {
				...originalData,
				apiUrl: undefined,
			} as typeof window.ecdReactData;

			const mockAlert = jest.spyOn(window, 'alert');

			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const endpointInput = screen.getByDisplayValue(
				'https://test.echodash.com/webhook/test-endpoint'
			);

			fireEvent.change(endpointInput, {
				target: { value: 'https://new-endpoint.com' },
			});
			fireEvent.blur(endpointInput);

			await waitFor(() => {
				expect(mockAlert).toHaveBeenCalledWith(
					'Configuration error: API URL not available. Please refresh the page and try again.'
				);
			});

			// Restore original data
			window.ecdReactData = originalData;
		});
	});

	describe('User Interactions', () => {
		it('calls onIntegrationClick when manage button is clicked', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const manageButtons = screen.getAllByText('Manage');
			fireEvent.click(manageButtons[0]); // Click WooCommerce manage button

			expect(mockOnIntegrationClick).toHaveBeenCalledWith('woocommerce');
		});

		it('calls onAddTrigger when add trigger button is clicked', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const addTriggerButtons = screen.getAllByText(/Add Trigger/);
			fireEvent.click(addTriggerButtons[0]); // Click WooCommerce add trigger button

			expect(mockOnAddTrigger).toHaveBeenCalledWith('woocommerce');
		});

		it('handles integration interactions for all integrations', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const manageButtons = screen.getAllByText('Manage');
			const addTriggerButtons = screen.getAllByText(/Add Trigger/);

			// Test all manage buttons
			fireEvent.click(manageButtons[0]); // WooCommerce
			expect(mockOnIntegrationClick).toHaveBeenCalledWith('woocommerce');

			fireEvent.click(manageButtons[1]); // Gravity Forms
			expect(mockOnIntegrationClick).toHaveBeenCalledWith(
				'gravity-forms'
			);

			fireEvent.click(manageButtons[2]); // LearnDash
			expect(mockOnIntegrationClick).toHaveBeenCalledWith('learndash');

			// Test all add trigger buttons
			fireEvent.click(addTriggerButtons[0]); // WooCommerce
			expect(mockOnAddTrigger).toHaveBeenCalledWith('woocommerce');

			fireEvent.click(addTriggerButtons[1]); // Gravity Forms
			expect(mockOnAddTrigger).toHaveBeenCalledWith('gravity-forms');

			fireEvent.click(addTriggerButtons[2]); // LearnDash
			expect(mockOnAddTrigger).toHaveBeenCalledWith('learndash');
		});
	});

	describe('External Links', () => {
		it('renders external links with correct attributes', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

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

	describe('Video Placeholder', () => {
		it('renders video placeholder section', () => {
			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			const videoPlaceholder = document.querySelector(
				'.echodash-video-placeholder'
			);
			expect(videoPlaceholder).toBeInTheDocument();

			const playButton = document.querySelector(
				'.echodash-video-placeholder__play-button'
			);
			expect(playButton).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('handles empty integrations array', () => {
			render(
				<IntegrationList
					integrations={[]}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			// Should still render header and welcome sections
			expect(screen.getByText('Welcome to EchoDash')).toBeInTheDocument();
			expect(screen.getByText('Integrations')).toBeInTheDocument();

			// But no integration items should be present
			expect(screen.queryByText('WooCommerce')).not.toBeInTheDocument();
		});

		it('handles integrations with missing optional properties', () => {
			const minimalIntegrations: Integration[] = [
				{
					slug: 'minimal',
					name: 'Minimal Integration',
					icon: '',
					iconBackgroundColor: '#000000',
					triggerCount: 0,
					enabled: true,
					// No description
				},
			];

			render(
				<IntegrationList
					integrations={minimalIntegrations}
					settings={mockConnectedSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			expect(screen.getByText('Minimal Integration')).toBeInTheDocument();
			expect(screen.getByText('0 Triggers')).toBeInTheDocument();
		});

		it('handles settings with missing optional properties', () => {
			const minimalSettings: EchoDashSettings = {
				isConnected: false,
			};

			render(
				<IntegrationList
					integrations={mockIntegrations}
					settings={minimalSettings}
					onIntegrationClick={mockOnIntegrationClick}
					onAddTrigger={mockOnAddTrigger}
				/>
			);

			// Should show connect button with fallback href
			const connectButton = screen.getByText(/Connect to EchoDash/);
			expect(connectButton.closest('a')).toHaveAttribute('href', '#');
		});
	});
});
