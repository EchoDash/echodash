/**
 * EchoDashLogo Component Tests
 *
 * Unit tests for the EchoDashLogo component including props handling
 * and accessibility features.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { EchoDashLogo } from './EchoDashLogo';

describe('EchoDashLogo Component', () => {
	describe('Default Rendering', () => {
		it('renders with default props', () => {
			render(<EchoDashLogo />);

			const logo = document.querySelector('svg');
			expect(logo).toBeInTheDocument();
			expect(logo).toHaveAttribute('width', '189');
			expect(logo).toHaveAttribute('height', '36');
			expect(logo).toHaveAttribute('aria-label', 'EchoDash');
		});

		it('renders with default empty className', () => {
			render(<EchoDashLogo />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('class', '');
		});
	});

	describe('Props Handling', () => {
		it('renders with custom width and height as numbers', () => {
			render(<EchoDashLogo width={200} height={40} />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('width', '200');
			expect(logo).toHaveAttribute('height', '40');
		});

		it('renders with custom width and height as strings', () => {
			render(<EchoDashLogo width="100%" height="auto" />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('width', '100%');
			expect(logo).toHaveAttribute('height', 'auto');
		});

		it('renders with custom className', () => {
			render(<EchoDashLogo className="custom-logo-class" />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveClass('custom-logo-class');
		});

		it('handles undefined className gracefully', () => {
			// Test the default parameter fallback (line 10)
			render(<EchoDashLogo className={undefined} />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('class', '');
		});

		it('combines all props correctly', () => {
			render(
				<EchoDashLogo
					className="logo-container"
					width={250}
					height={50}
				/>
			);

			const logo = document.querySelector('svg');
			expect(logo).toHaveClass('logo-container');
			expect(logo).toHaveAttribute('width', '250');
			expect(logo).toHaveAttribute('height', '50');
		});
	});

	describe('SVG Structure and Accessibility', () => {
		it('has correct viewBox and namespace', () => {
			render(<EchoDashLogo />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('viewBox', '0 0 189 36');
			expect(logo).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
			expect(logo).toHaveAttribute('fill', 'none');
		});

		it('has proper accessibility attributes', () => {
			render(<EchoDashLogo />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('aria-label', 'EchoDash');
		});

		it('contains expected number of path elements', () => {
			render(<EchoDashLogo />);

			const paths = document.querySelectorAll('path');
			expect(paths).toHaveLength(9); // Based on the actual SVG structure
		});

		it('has correct fill color for all paths', () => {
			render(<EchoDashLogo />);

			const paths = document.querySelectorAll('path');
			paths.forEach(path => {
				expect(path).toHaveAttribute('fill', '#202E41');
			});
		});
	});

	describe('Edge Cases', () => {
		it('handles zero width and height', () => {
			render(<EchoDashLogo width={0} height={0} />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('width', '0');
			expect(logo).toHaveAttribute('height', '0');
		});

		it('handles negative width and height', () => {
			render(<EchoDashLogo width={-100} height={-50} />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('width', '-100');
			expect(logo).toHaveAttribute('height', '-50');
		});

		it('handles empty string className', () => {
			render(<EchoDashLogo className="" />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveAttribute('class', '');
		});

		it('handles multiple CSS classes', () => {
			render(<EchoDashLogo className="class1 class2 class3" />);

			const logo = document.querySelector('svg');
			expect(logo).toHaveClass('class1', 'class2', 'class3');
		});
	});
});
