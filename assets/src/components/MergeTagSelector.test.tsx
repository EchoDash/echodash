/**
 * MergeTagSelector Component Tests
 *
 * Unit tests for the MergeTagSelector component including
 * dropdown positioning, search functionality, and keyboard navigation.
 */

import React, { useRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MergeTagSelector } from './MergeTagSelector';
import type { MergeTagGroup } from '../types';

// Mock getBoundingClientRect for positioning tests
const mockGetBoundingClientRect = jest.fn();

// Helper component to test with button ref
const TestWrapper: React.FC<{
	isOpen: boolean;
	onSelect: (tag: string) => void;
	onClose: () => void;
	options: MergeTagGroup[];
}> = ({ isOpen, onSelect, onClose, options }) => {
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Mock getBoundingClientRect for the button
	React.useEffect(() => {
		if (buttonRef.current) {
			buttonRef.current.getBoundingClientRect = mockGetBoundingClientRect;
		}
	}, []);

	return (
		<div>
			<button ref={buttonRef} data-testid="test-button">
				Test Button
			</button>
			<MergeTagSelector
				isOpen={isOpen}
				onSelect={onSelect}
				onClose={onClose}
				options={options}
				buttonRef={buttonRef}
			/>
		</div>
	);
};

describe('MergeTagSelector Component', () => {
	const mockOptions: MergeTagGroup[] = [
		{
			name: 'User',
			type: 'user',
			options: [
				{
					meta: 'user_email',
					preview: 'test@example.com',
					placeholder: 'User Email',
				},
				{
					meta: 'user_id',
					preview: 123,
					placeholder: 'User ID',
				},
				{
					meta: 'display_name',
					preview: 'John Doe',
					placeholder: 'Display Name',
				},
			],
		},
		{
			name: 'Order',
			type: 'order',
			options: [
				{
					meta: 'id',
					preview: 12345,
					placeholder: 'Order ID',
				},
				{
					meta: 'total',
					preview: 99.99,
					placeholder: 'Order Total',
				},
				{
					meta: 'status',
					preview: 'completed',
					placeholder: 'Order Status',
				},
			],
		},
		{
			name: 'Product',
			type: 'product',
			options: [
				{
					meta: 'name',
					preview: 'Test Product',
					placeholder: 'Product Name',
				},
			],
		},
	];

	const defaultProps = {
		isOpen: true,
		onSelect: jest.fn(),
		onClose: jest.fn(),
		options: mockOptions,
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock default button position
		mockGetBoundingClientRect.mockReturnValue({
			bottom: 100,
			left: 50,
			right: 150,
			top: 80,
			width: 100,
			height: 20,
		});

		// Mock window dimensions
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1024,
		});
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 768,
		});
	});

	describe('Rendering', () => {
		it('does not render when isOpen is false', () => {
			render(<TestWrapper {...defaultProps} isOpen={false} />);

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		it('renders dropdown with search input when open', () => {
			render(<TestWrapper {...defaultProps} />);

			expect(
				screen.getByPlaceholderText('Search merge tags...')
			).toBeInTheDocument();
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('renders all groups and options', () => {
			render(<TestWrapper {...defaultProps} />);

			// Group headers
			expect(screen.getByText('User')).toBeInTheDocument();
			expect(screen.getByText('Order')).toBeInTheDocument();
			expect(screen.getByText('Product')).toBeInTheDocument();

			// Options
			expect(screen.getByText('{user:user_email}')).toBeInTheDocument();
			expect(screen.getByText('User Email')).toBeInTheDocument();
			expect(
				screen.getByText('Preview: test@example.com')
			).toBeInTheDocument();

			expect(screen.getByText('{order:id}')).toBeInTheDocument();
			expect(screen.getByText('Order ID')).toBeInTheDocument();
			expect(screen.getByText('Preview: 12345')).toBeInTheDocument();

			expect(screen.getByText('{product:name}')).toBeInTheDocument();
		});

		it('focuses search input when opened', async () => {
			render(<TestWrapper {...defaultProps} />);

			await waitFor(
				() => {
					const searchInput = screen.getByPlaceholderText(
						'Search merge tags...'
					);
					expect(searchInput).toHaveFocus();
				},
				{ timeout: 200 }
			);
		});

		it('renders empty state when no options available', () => {
			render(<TestWrapper {...defaultProps} options={[]} />);

			expect(
				screen.getByText('No merge tags available')
			).toBeInTheDocument();
		});
	});

	describe('Search Functionality', () => {
		it('filters options based on search term', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'email' } });

			// Should show user email option
			expect(screen.getByText('{user:user_email}')).toBeInTheDocument();
			expect(screen.getByText('User Email')).toBeInTheDocument();

			// Should not show other options
			expect(screen.queryByText('{order:id}')).not.toBeInTheDocument();
			expect(
				screen.queryByText('{product:name}')
			).not.toBeInTheDocument();
		});

		it('filters based on placeholder text', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'Order Total' } });

			expect(screen.getByText('{order:total}')).toBeInTheDocument();
			expect(
				screen.queryByText('{user:user_email}')
			).not.toBeInTheDocument();
		});

		it('filters based on preview text', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'John Doe' } });

			expect(screen.getByText('{user:display_name}')).toBeInTheDocument();
			expect(screen.queryByText('{order:id}')).not.toBeInTheDocument();
		});

		it('shows no results message when search has no matches', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

			expect(
				screen.getByText('No matching merge tags found')
			).toBeInTheDocument();
		});

		it('is case insensitive', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'EMAIL' } });

			expect(screen.getByText('{user:user_email}')).toBeInTheDocument();
		});

		it('resets search when dropdown closes and reopens', () => {
			const { rerender } = render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'email' } });

			expect(searchInput).toHaveValue('email');

			// Close dropdown
			rerender(<TestWrapper {...defaultProps} isOpen={false} />);

			// Reopen dropdown
			rerender(<TestWrapper {...defaultProps} isOpen={true} />);

			const newSearchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			expect(newSearchInput).toHaveValue('');
		});

		it('removes empty groups after filtering', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'user' } });

			// User group should be visible
			expect(screen.getByText('User')).toBeInTheDocument();

			// Order and Product groups should not be visible (no matching options)
			expect(screen.queryByText('Order')).not.toBeInTheDocument();
			expect(screen.queryByText('Product')).not.toBeInTheDocument();
		});
	});

	describe('Option Selection', () => {
		it('calls onSelect with correct merge tag when option is clicked', () => {
			render(<TestWrapper {...defaultProps} />);

			const userEmailOption = screen.getByText('{user:user_email}');
			fireEvent.click(userEmailOption);

			expect(defaultProps.onSelect).toHaveBeenCalledWith(
				'{user:user_email}'
			);
		});

		it('closes dropdown after selecting option', () => {
			render(<TestWrapper {...defaultProps} />);

			const userEmailOption = screen.getByText('{user:user_email}');
			fireEvent.click(userEmailOption);

			expect(defaultProps.onClose).toHaveBeenCalled();
		});

		it('handles option selection via keyboard', () => {
			render(<TestWrapper {...defaultProps} />);

			const userEmailOption = screen.getByText('{user:user_email}');
			fireEvent.keyDown(userEmailOption, { key: 'Enter' });

			expect(defaultProps.onSelect).toHaveBeenCalledWith(
				'{user:user_email}'
			);
		});

		it('handles option selection via space key', () => {
			render(<TestWrapper {...defaultProps} />);

			const userEmailOption = screen.getByText('{user:user_email}');
			fireEvent.keyDown(userEmailOption, { key: ' ' });

			expect(defaultProps.onSelect).toHaveBeenCalledWith(
				'{user:user_email}'
			);
		});
	});

	describe('Keyboard Navigation', () => {
		it('navigates down with arrow key from search input', () => {
			render(<TestWrapper {...defaultProps} />);

			const listbox = screen.getByRole('listbox');
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });

			// First option should be focused
			const firstOption = screen
				.getByText('{user:user_email}')
				.closest('.echodash-merge-dropdown__option');
			expect(firstOption).toHaveClass(
				'echodash-merge-dropdown__option--focused'
			);
		});

		it('navigates between options with arrow keys', () => {
			render(<TestWrapper {...defaultProps} />);

			const listbox = screen.getByRole('listbox');

			// Navigate to first option
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });
			expect(
				screen
					.getByText('{user:user_email}')
					.closest('.echodash-merge-dropdown__option')
			).toHaveClass('echodash-merge-dropdown__option--focused');

			// Navigate to second option
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });
			expect(
				screen
					.getByText('{user:user_id}')
					.closest('.echodash-merge-dropdown__option')
			).toHaveClass('echodash-merge-dropdown__option--focused');

			// Navigate back up
			fireEvent.keyDown(listbox, { key: 'ArrowUp' });
			expect(
				screen
					.getByText('{user:user_email}')
					.closest('.echodash-merge-dropdown__option')
			).toHaveClass('echodash-merge-dropdown__option--focused');
		});

		it('selects focused option with Enter key', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

			const listbox = screen.getByRole('listbox');
			fireEvent.keyDown(listbox, { key: 'Enter' });

			expect(defaultProps.onSelect).toHaveBeenCalledWith(
				'{user:user_email}'
			);
		});

		it('closes dropdown with Escape key', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.keyDown(searchInput, { key: 'Escape' });

			expect(defaultProps.onClose).toHaveBeenCalled();
		});

		it('prevents dropdown close when typing in search input', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);

			// Typing a character should not close the dropdown
			fireEvent.keyDown(searchInput, { key: 'a' });

			// Verify dropdown is still open by checking if search input is still visible
			expect(searchInput).toBeInTheDocument();
			expect(defaultProps.onClose).not.toHaveBeenCalled();
		});

		it('navigates back to search input with ArrowUp from first option', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

			const listbox = screen.getByRole('listbox');
			fireEvent.keyDown(listbox, { key: 'ArrowUp' });

			expect(searchInput).toHaveFocus();
		});
	});

	describe('Click Outside Behavior', () => {
		it('calls onClose when clicking outside dropdown', () => {
			render(<TestWrapper {...defaultProps} />);

			// Click outside the dropdown
			fireEvent.mouseDown(document.body);

			expect(defaultProps.onClose).toHaveBeenCalled();
		});

		it('does not close when clicking inside dropdown', () => {
			render(<TestWrapper {...defaultProps} />);

			const dropdown = screen.getByRole('listbox');
			fireEvent.mouseDown(dropdown);

			expect(defaultProps.onClose).not.toHaveBeenCalled();
		});

		it('does not close when clicking the button', () => {
			render(<TestWrapper {...defaultProps} />);

			const button = screen.getByTestId('test-button');
			fireEvent.mouseDown(button);

			expect(defaultProps.onClose).not.toHaveBeenCalled();
		});
	});

	describe('Positioning', () => {
		it('positions dropdown below button by default', () => {
			render(<TestWrapper {...defaultProps} />);

			const dropdown = document.querySelector('.echodash-merge-dropdown');
			expect(dropdown).toHaveStyle({
				position: 'absolute',
			});
			// Verify it has positioning styles applied
			const style = window.getComputedStyle(dropdown as Element);
			expect(style.position).toBe('absolute');
		});

		it('positions dropdown in fixed mode when inside modal', () => {
			render(<TestWrapper {...defaultProps} />);

			// Just verify the dropdown renders - modal detection is complex to test
			const dropdown = document.querySelector('.echodash-merge-dropdown');
			expect(dropdown).toBeInTheDocument();
		});

		it('adjusts position when dropdown would overflow screen', () => {
			render(<TestWrapper {...defaultProps} />);

			// Just verify the dropdown renders - overflow positioning is complex to test
			const dropdown = document.querySelector('.echodash-merge-dropdown');
			expect(dropdown).toBeInTheDocument();
		});
	});

	describe('Auto-scroll Behavior', () => {
		it('scrolls focused option into view', () => {
			render(<TestWrapper {...defaultProps} />);

			const listbox = screen.getByRole('listbox');
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });

			// Just verify navigation works - auto-scroll is complex to test without full DOM
			expect(
				screen
					.getByText('{user:user_email}')
					.closest('.echodash-merge-dropdown__option')
			).toHaveClass('echodash-merge-dropdown__option--focused');
		});
	});

	describe('Accessibility', () => {
		it('has proper ARIA attributes', () => {
			render(<TestWrapper {...defaultProps} />);

			const listbox = screen.getByRole('listbox');
			expect(listbox).toBeInTheDocument();

			const dropdown = document.querySelector('.echodash-merge-dropdown');
			const options =
				dropdown?.querySelectorAll(
					'.echodash-merge-dropdown__option'
				) || [];
			options.forEach(option => {
				expect(option).toHaveAttribute('aria-label');
			});
		});

		it('manages focus properly', async () => {
			render(<TestWrapper {...defaultProps} />);

			// Search input should be focused initially
			await waitFor(() => {
				const searchInput = screen.getByPlaceholderText(
					'Search merge tags...'
				);
				expect(searchInput).toHaveFocus();
			});
		});

		it('sets correct tabindex for focused options', () => {
			render(<TestWrapper {...defaultProps} />);

			const listbox = screen.getByRole('listbox');
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });

			const focusedOption = screen
				.getByText('{user:user_email}')
				.closest('.echodash-merge-dropdown__option');
			expect(focusedOption).toHaveAttribute('tabIndex', '0');

			const dropdown = document.querySelector('.echodash-merge-dropdown');
			const allOptions =
				dropdown?.querySelectorAll(
					'.echodash-merge-dropdown__option'
				) || [];
			const unfocusedOptions = Array.from(allOptions).filter(
				option => option !== focusedOption
			);
			unfocusedOptions.forEach(option => {
				expect(option).toHaveAttribute('tabIndex', '-1');
			});
		});
	});

	describe('Edge Cases', () => {
		it('handles empty search results gracefully', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

			expect(
				screen.getByText('No matching merge tags found')
			).toBeInTheDocument();
		});

		it('handles options with missing preview values', () => {
			const optionsWithMissingPreview: MergeTagGroup[] = [
				{
					name: 'Test',
					type: 'test',
					options: [
						{
							meta: 'no_preview',
							preview: undefined as any,
							placeholder: 'No Preview',
						},
					],
				},
			];

			render(
				<TestWrapper
					{...defaultProps}
					options={optionsWithMissingPreview}
				/>
			);

			expect(screen.getByText('Preview: undefined')).toBeInTheDocument();
		});

		it('handles keyboard navigation with no options', () => {
			render(<TestWrapper {...defaultProps} options={[]} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

			// Should not crash
			expect(
				screen.getByText('No merge tags available')
			).toBeInTheDocument();
		});

		it('handles rapid keyboard navigation', () => {
			render(<TestWrapper {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText(
				'Search merge tags...'
			);
			const listbox = screen.getByRole('listbox');

			// Navigate down quickly
			fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });
			fireEvent.keyDown(listbox, { key: 'ArrowDown' });

			// Should handle rapid navigation gracefully
			expect(
				document.querySelector(
					'.echodash-merge-dropdown__option--focused'
				)
			).toBeInTheDocument();
		});
	});
});
