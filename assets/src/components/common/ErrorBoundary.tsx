/**
 * Error Boundary Component
 * 
 * React error boundary for graceful error handling and recovery
 * with comprehensive error reporting and user-friendly fallbacks.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardBody, Button, Flex, Text } from '@wordpress/components';
import { performanceMonitor } from '../../utils/performance';

// Error boundary props
export interface ErrorBoundaryProps {
	/** Child components to wrap */
	children: ReactNode;
	
	/** Custom fallback component */
	fallback?: React.ComponentType<ErrorFallbackProps>;
	
	/** Error handler callback */
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	
	/** Context name for error reporting */
	context?: string;
	
	/** Whether to show detailed error information */
	showDetails?: boolean;
	
	/** Whether to enable retry functionality */
	enableRetry?: boolean;
	
	/** Maximum number of retries */
	maxRetries?: number;
	
	/** Reset error boundary when these props change */
	resetKeys?: Array<string | number>;
	
	/** Reset error boundary when this function returns true */
	resetOnPropsChange?: (prevProps: any, props: any) => boolean;
}

// Error fallback props
export interface ErrorFallbackProps {
	error: Error;
	errorInfo?: ErrorInfo;
	resetError: () => void;
	retryCount: number;
	maxRetries: number;
	context: string;
	canRetry: boolean;
}

// Error boundary state
interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	retryCount: number;
	errorId: string;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
	error,
	errorInfo,
	resetError,
	retryCount,
	maxRetries,
	context,
	canRetry,
}) => {
	const isDebugMode = window.ecdReactData?.environment?.debugMode;
	
	return (
		<Card className="ecd-error-boundary">
			<CardBody>
				<Flex direction="column" gap="4">
					<div className="error-header">
						<Text size="20" weight="600" className="error-title">
							Something went wrong
						</Text>
						<Text variant="muted" className="error-subtitle">
							{context ? `Error in ${context}` : 'An unexpected error occurred'}
						</Text>
					</div>
					
					<div className="error-message">
						<Text className="error-description">
							{error.message || 'An unknown error occurred while rendering this component.'}
						</Text>
						
						{retryCount > 0 && (
							<Text variant="muted" className="retry-info">
								Retry attempt: {retryCount} of {maxRetries}
							</Text>
						)}
					</div>
					
					<Flex gap="3" className="error-actions">
						{canRetry && (
							<Button variant="primary" onClick={resetError}>
								Try Again
							</Button>
						)}
						
						<Button variant="secondary" onClick={() => window.location.reload()}>
							Refresh Page
						</Button>
						
						{isDebugMode && (
							<Button 
								variant="tertiary" 
								onClick={() => {
									console.group('Error Boundary Details');
									console.error('Error:', error);
									console.error('Error Info:', errorInfo);
									console.error('Stack Trace:', error.stack);
									console.groupEnd();
								}}
							>
								Show Details
							</Button>
						)}
					</Flex>
					
					{isDebugMode && (
						<details className="error-details">
							<summary>
								<Text weight="600">Technical Details</Text>
							</summary>
							<div className="error-debug">
								<Text variant="muted" className="error-stack">
									<strong>Error:</strong> {error.name}: {error.message}
								</Text>
								
								{error.stack && (
									<pre className="error-stack-trace">
										{error.stack}
									</pre>
								)}
								
								{errorInfo?.componentStack && (
									<div className="component-stack">
										<Text weight="600">Component Stack:</Text>
										<pre>{errorInfo.componentStack}</pre>
									</div>
								)}
							</div>
						</details>
					)}
				</Flex>
			</CardBody>
		</Card>
	);
};

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	private resetTimeoutId: number | null = null;

	constructor(props: ErrorBoundaryProps) {
		super(props);

		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			retryCount: 0,
			errorId: '',
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		// Generate unique error ID for tracking
		const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		return {
			hasError: true,
			error,
			errorId,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const { onError, context = 'Unknown' } = this.props;
		
		// Update state with error info
		this.setState({ errorInfo });
		
		// Record performance metric
		performanceMonitor.recordMetric(`error-boundary-${context.toLowerCase()}`, performance.now(), {
			error: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
			retryCount: this.state.retryCount,
			errorId: this.state.errorId,
		});
		
		// Log error for debugging
		if (window.ecdReactData?.environment?.debugMode) {
			console.group(`Error Boundary: ${context}`);
			console.error('Error caught by ErrorBoundary:', error);
			console.error('Error Info:', errorInfo);
			console.error('Component Stack:', errorInfo.componentStack);
			console.groupEnd();
		}
		
		// Send error to logging service
		this.sendErrorToLoggingService(error, errorInfo);
		
		// Call custom error handler
		if (onError) {
			try {
				onError(error, errorInfo);
			} catch (handlerError) {
				console.error('Error in custom error handler:', handlerError);
			}
		}
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps) {
		const { resetKeys, resetOnPropsChange } = this.props;
		const { hasError } = this.state;
		
		if (hasError && prevProps.resetKeys !== resetKeys) {
			if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
				this.resetError();
			}
		}
		
		if (hasError && resetOnPropsChange && resetOnPropsChange(prevProps, this.props)) {
			this.resetError();
		}
	}

	componentWillUnmount() {
		if (this.resetTimeoutId) {
			clearTimeout(this.resetTimeoutId);
		}
	}

	/**
	 * Send error information to logging service
	 */
	private sendErrorToLoggingService = (error: Error, errorInfo: ErrorInfo) => {
		if (!window.ecdReactData?.apiUrl) return;
		
		const errorData = {
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
			context: this.props.context || 'ErrorBoundary',
			retryCount: this.state.retryCount,
			errorId: this.state.errorId,
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			url: window.location.href,
		};
		
		fetch('/wp-admin/admin-ajax.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				action: 'ecd_log_client_error',
				error_data: JSON.stringify(errorData),
				nonce: window.ecdReactData.nonce,
			}),
		}).catch(() => {
			// Silently fail - we don't want error reporting to cause more errors
		});
	};

	/**
	 * Reset error boundary state
	 */
	private resetError = () => {
		const { maxRetries = 3 } = this.props;
		const { retryCount } = this.state;
		
		if (retryCount >= maxRetries) {
			return;
		}
		
		this.setState(prevState => ({
			hasError: false,
			error: null,
			errorInfo: null,
			retryCount: prevState.retryCount + 1,
			errorId: '',
		}));
		
		// Record retry attempt
		performanceMonitor.recordMetric(`error-boundary-retry-${this.props.context?.toLowerCase()}`, performance.now(), {
			retryCount: retryCount + 1,
			maxRetries,
		});
	};

	/**
	 * Check if retry is allowed
	 */
	private canRetry = (): boolean => {
		const { enableRetry = true, maxRetries = 3 } = this.props;
		const { retryCount } = this.state;
		
		return enableRetry && retryCount < maxRetries;
	};

	render() {
		const { hasError, error, errorInfo, retryCount } = this.state;
		const { 
			children, 
			fallback: CustomFallback,
			context = 'Component',
			showDetails = false,
			maxRetries = 3,
		} = this.props;

		if (hasError && error) {
			const FallbackComponent = CustomFallback || DefaultErrorFallback;
			
			return (
				<div className="ecd-error-boundary-wrapper">
					<FallbackComponent
						error={error}
						errorInfo={showDetails ? errorInfo : undefined}
						resetError={this.resetError}
						retryCount={retryCount}
						maxRetries={maxRetries}
						context={context}
						canRetry={this.canRetry()}
					/>
				</div>
			);
		}

		return children;
	}
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
	const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
		<ErrorBoundary {...errorBoundaryProps}>
			<Component {...props} ref={ref} />
		</ErrorBoundary>
	));
	
	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
	
	return WrappedComponent;
}

/**
 * Hook for handling async errors in functional components
 */
export function useErrorHandler() {
	const [error, setError] = React.useState<Error | null>(null);
	
	const resetError = React.useCallback(() => {
		setError(null);
	}, []);
	
	const captureError = React.useCallback((error: Error | string) => {
		const errorObj = typeof error === 'string' ? new Error(error) : error;
		setError(errorObj);
		
		// Log error
		if (window.ecdReactData?.environment?.debugMode) {
			console.error('Error captured by useErrorHandler:', errorObj);
		}
		
		// Record performance metric
		performanceMonitor.recordMetric('async-error-handler', performance.now(), {
			error: errorObj.message,
			stack: errorObj.stack,
		});
	}, []);
	
	// Throw error to be caught by error boundary
	React.useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);
	
	return { captureError, resetError, error };
}

/**
 * Error boundary context for accessing error state
 */
export const ErrorBoundaryContext = React.createContext<{
	hasError: boolean;
	error: Error | null;
	resetError: () => void;
	retryCount: number;
}>({
	hasError: false,
	error: null,
	resetError: () => {},
	retryCount: 0,
});

/**
 * Provider component that makes error boundary state available to children
 */
export const ErrorBoundaryProvider: React.FC<{
	children: ReactNode;
	errorBoundaryProps?: ErrorBoundaryProps;
}> = ({ children, errorBoundaryProps = {} }) => {
	const [contextState, setContextState] = React.useState({
		hasError: false,
		error: null as Error | null,
		retryCount: 0,
	});
	
	const resetError = React.useCallback(() => {
		setContextState({
			hasError: false,
			error: null,
			retryCount: 0,
		});
	}, []);
	
	const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
		setContextState(prev => ({
			hasError: true,
			error,
			retryCount: prev.retryCount + 1,
		}));
	}, []);
	
	return (
		<ErrorBoundaryContext.Provider value={{
			...contextState,
			resetError,
		}}>
			<ErrorBoundary
				{...errorBoundaryProps}
				onError={handleError}
			>
				{children}
			</ErrorBoundary>
		</ErrorBoundaryContext.Provider>
	);
};

/**
 * Hook to use error boundary context
 */
export function useErrorBoundaryContext() {
	return React.useContext(ErrorBoundaryContext);
}

// CSS styles for error boundary
const styles = `
.ecd-error-boundary {
	border-color: #d63638;
	background-color: #fef7f7;
}

.ecd-error-boundary .error-title {
	color: #d63638;
	margin-bottom: 8px;
}

.ecd-error-boundary .error-subtitle {
	margin-bottom: 16px;
}

.ecd-error-boundary .error-description {
	color: #1e1e1e;
	margin-bottom: 8px;
}

.ecd-error-boundary .retry-info {
	font-size: 12px;
	margin-bottom: 16px;
}

.ecd-error-boundary .error-actions {
	margin-bottom: 16px;
}

.ecd-error-boundary .error-details {
	border-top: 1px solid #ddd;
	padding-top: 16px;
	margin-top: 16px;
}

.ecd-error-boundary .error-details summary {
	cursor: pointer;
	font-weight: 600;
	margin-bottom: 12px;
}

.ecd-error-boundary .error-debug {
	background-color: #f6f7f7;
	padding: 12px;
	border-radius: 4px;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
	font-size: 12px;
}

.ecd-error-boundary .error-stack-trace,
.ecd-error-boundary .component-stack pre {
	background-color: #2c3338;
	color: #f1f1f1;
	padding: 12px;
	border-radius: 4px;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
	margin: 8px 0;
	font-size: 11px;
	line-height: 1.4;
}

.ecd-error-boundary .component-stack {
	margin-top: 12px;
}

.ecd-error-boundary-wrapper {
	min-height: 200px;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
	.ecd-error-boundary .error-actions {
		flex-direction: column;
	}
	
	.ecd-error-boundary .error-actions .components-button {
		width: 100%;
		justify-content: center;
	}
	
	.ecd-error-boundary .error-stack-trace,
	.ecd-error-boundary .component-stack pre {
		font-size: 10px;
		padding: 8px;
	}
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
	.ecd-error-boundary {
		background-color: #2c1810;
		border-color: #cc1818;
	}
	
	.ecd-error-boundary .error-debug {
		background-color: #1e1e1e;
		color: #f1f1f1;
	}
}
`;

// Inject styles
if (typeof document !== 'undefined') {
	const styleSheet = document.createElement('style');
	styleSheet.textContent = styles;
	document.head.appendChild(styleSheet);
}