/**
 * Error Boundary Tests
 * 
 * Tests for the ErrorBoundary component including error catching,
 * recovery mechanisms, and custom fallback components.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../ErrorBoundary';
import { TestUtils } from '../../utils/test-utils';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
	shouldThrow = false, 
	errorMessage = 'Test error' 
}) => {
	if (shouldThrow) {
		throw new Error(errorMessage);
	}
	return <div>No error</div>;
};

// Test component for async errors
const AsyncThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
	const { captureError } = useErrorHandler();
	
	React.useEffect(() => {
		if (shouldThrow) {
			setTimeout(() => {
				captureError(new Error('Async error'));
			}, 100);
		}
	}, [shouldThrow, captureError]);
	
	return <div>Async component</div>;
};

describe('ErrorBoundary', () => {
	let consoleSpy: jest.SpyInstance;
	
	beforeEach(() => {
		// Mock console.error to prevent error logs in tests
		consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	});
	
	afterEach(() => {
		consoleSpy.mockRestore();
	});
	
	it('should render children when there is no error', () => {
		render(
			<ErrorBoundary>
				<div>Test content</div>
			</ErrorBoundary>
		);
		
		expect(screen.getByText('Test content')).toBeInTheDocument();
	});
	
	it('should catch and display error with default fallback', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow errorMessage="Component crashed" />
			</ErrorBoundary>
		);
		
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		expect(screen.getByText('Component crashed')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
	});
	
	it('should show context in error message', () => {
		render(
			<ErrorBoundary context="User Dashboard">
				<ThrowError shouldThrow errorMessage="Dashboard error" />
			</ErrorBoundary>
		);
		
		expect(screen.getByText('Error in User Dashboard')).toBeInTheDocument();
	});
	
	it('should allow retry when enabled', async () => {
		const user = userEvent.setup();
		let shouldThrow = true;
		
		const TestComponent = () => (
			<ErrorBoundary enableRetry maxRetries={2}>
				<ThrowError shouldThrow={shouldThrow} errorMessage="Retry test" />
			</ErrorBoundary>
		);
		
		const { rerender } = render(<TestComponent />);
		
		// Error should be caught
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		
		// Fix the error condition
		shouldThrow = false;
		
		// Click retry
		const retryButton = screen.getByRole('button', { name: /try again/i });
		await user.click(retryButton);
		
		// Re-render with fixed condition
		rerender(<TestComponent />);
		
		// Error should be gone
		expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
	});
	
	it('should disable retry after max attempts', async () => {
		const user = userEvent.setup();
		
		render(
			<ErrorBoundary enableRetry maxRetries={1}>
				<ThrowError shouldThrow errorMessage="Max retry test" />
			</ErrorBoundary>
		);
		
		// First retry
		const retryButton = screen.getByRole('button', { name: /try again/i });
		await user.click(retryButton);
		
		// Error should still be shown
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		expect(screen.getByText('Retry attempt: 1 of 1')).toBeInTheDocument();
		
		// Retry button should be disabled
		expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
	});
	
	it('should call custom error handler', () => {
		const mockErrorHandler = jest.fn();
		
		render(
			<ErrorBoundary onError={mockErrorHandler}>
				<ThrowError shouldThrow errorMessage="Handler test" />
			</ErrorBoundary>
		);
		
		expect(mockErrorHandler).toHaveBeenCalledWith(
			expect.objectContaining({ message: 'Handler test' }),
			expect.objectContaining({ componentStack: expect.any(String) })
		);
	});
	
	it('should render custom fallback component', () => {
		const CustomFallback: React.FC<any> = ({ error, resetError }) => (
			<div>
				<h2>Custom Error</h2>
				<p>{error.message}</p>
				<button onClick={resetError}>Custom Retry</button>
			</div>
		);
		
		render(
			<ErrorBoundary fallback={CustomFallback}>
				<ThrowError shouldThrow errorMessage="Custom fallback test" />
			</ErrorBoundary>
		);
		
		expect(screen.getByText('Custom Error')).toBeInTheDocument();
		expect(screen.getByText('Custom fallback test')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
	});
	
	it('should reset on prop changes when resetKeys provided', () => {
		const TestWrapper: React.FC<{ resetKey: string }> = ({ resetKey }) => (
			<ErrorBoundary resetKeys={[resetKey]}>
				<ThrowError shouldThrow={resetKey === 'error'} />
			</ErrorBoundary>
		);
		
		const { rerender } = render(<TestWrapper resetKey="error" />);
		
		// Error should be caught
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		
		// Change reset key
		rerender(<TestWrapper resetKey="fixed" />);
		
		// Error should be cleared
		expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
		expect(screen.getByText('No error')).toBeInTheDocument();
	});
	
	it('should reset on prop changes when resetOnPropsChange returns true', () => {
		const resetOnPropsChange = (prevProps: any, props: any) => {
			return prevProps.testProp !== props.testProp;
		};
		
		const TestWrapper: React.FC<{ testProp: string }> = ({ testProp }) => (
			<ErrorBoundary resetOnPropsChange={resetOnPropsChange}>
				<ThrowError shouldThrow={testProp === 'error'} />
			</ErrorBoundary>
		);
		
		const { rerender } = render(<TestWrapper testProp="error" />);
		
		// Error should be caught
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		
		// Change prop that triggers reset
		rerender(<TestWrapper testProp="fixed" />);
		
		// Error should be cleared
		expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
	});
	
	it('should show debug details when in debug mode', () => {
		// Enable debug mode
		window.ecdReactData.environment.debugMode = true;
		
		render(
			<ErrorBoundary showDetails>
				<ThrowError shouldThrow errorMessage="Debug test" />
			</ErrorBoundary>
		);
		
		expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
	});
	
	it('should send error to logging service', async () => {
		const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
		} as Response);
		
		render(
			<ErrorBoundary context="Test Component">
				<ThrowError shouldThrow errorMessage="Logging test" />
			</ErrorBoundary>
		);
		
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'/wp-admin/admin-ajax.php',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: expect.stringContaining('action=ecd_log_client_error'),
				})
			);
		});
		
		mockFetch.mockRestore();
	});
	
	it('should record performance metrics', () => {
		const mockRecordMetric = jest.spyOn(TestUtils.mockPerformance().performanceMonitor, 'recordMetric');
		
		render(
			<ErrorBoundary context="Performance Test">
				<ThrowError shouldThrow errorMessage="Performance test" />
			</ErrorBoundary>
		);
		
		expect(mockRecordMetric).toHaveBeenCalledWith(
			'error-boundary-performance test',
			expect.any(Number),
			expect.objectContaining({
				error: 'Performance test',
				retryCount: 0,
			})
		);
	});
});

describe('withErrorBoundary HOC', () => {
	it('should wrap component with error boundary', () => {
		const TestComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => (
			<ThrowError shouldThrow={shouldThrow} />
		);
		
		const WrappedComponent = withErrorBoundary(TestComponent, {
			context: 'HOC Test',
		});
		
		render(<WrappedComponent shouldThrow />);
		
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		expect(screen.getByText('Error in HOC Test')).toBeInTheDocument();
	});
	
	it('should preserve component display name', () => {
		const TestComponent: React.FC = () => <div>Test</div>;
		TestComponent.displayName = 'CustomTestComponent';
		
		const WrappedComponent = withErrorBoundary(TestComponent);
		
		expect(WrappedComponent.displayName).toBe('withErrorBoundary(CustomTestComponent)');
	});
});

describe('useErrorHandler hook', () => {
	it('should capture and throw async errors', async () => {
		render(
			<ErrorBoundary>
				<AsyncThrowError shouldThrow />
			</ErrorBoundary>
		);
		
		// Wait for async error to be thrown
		await waitFor(() => {
			expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		});
		
		expect(screen.getByText('Async error')).toBeInTheDocument();
	});
	
	it('should handle string errors', async () => {
		const TestComponent: React.FC = () => {
			const { captureError } = useErrorHandler();
			
			React.useEffect(() => {
				captureError('String error message');
			}, [captureError]);
			
			return <div>Component</div>;
		};
		
		render(
			<ErrorBoundary>
				<TestComponent />
			</ErrorBoundary>
		);
		
		await waitFor(() => {
			expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		});
		
		expect(screen.getByText('String error message')).toBeInTheDocument();
	});
	
	it('should provide reset functionality', async () => {
		const user = userEvent.setup();
		
		const TestComponent: React.FC = () => {
			const { captureError, resetError, error } = useErrorHandler();
			
			if (error) {
				return (
					<div>
						<p>Error caught: {error.message}</p>
						<button onClick={resetError}>Reset</button>
					</div>
				);
			}
			
			return (
				<div>
					<p>No error</p>
					<button onClick={() => captureError('Test error')}>Throw Error</button>
				</div>
			);
		};
		
		render(<TestComponent />);
		
		// Initially no error
		expect(screen.getByText('No error')).toBeInTheDocument();
		
		// Trigger error
		const throwButton = screen.getByRole('button', { name: /throw error/i });
		await user.click(throwButton);
		
		// Error should be displayed
		expect(screen.getByText('Error caught: Test error')).toBeInTheDocument();
		
		// Reset error
		const resetButton = screen.getByRole('button', { name: /reset/i });
		await user.click(resetButton);
		
		// Should be back to no error state
		expect(screen.getByText('No error')).toBeInTheDocument();
	});
});