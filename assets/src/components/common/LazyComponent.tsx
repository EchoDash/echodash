/**
 * Lazy Component Loader
 * 
 * Enhanced lazy loading component with error boundaries, loading states,
 * and performance monitoring for optimal code splitting.
 */

import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';
import { Spinner, Card, CardBody, Button, Flex, Text } from '@wordpress/components';
import { performanceMonitor, trackComponentRender } from '../../utils/performance';

export interface LazyComponentProps {
	/** Factory function that returns a dynamic import promise */
	factory: () => Promise<{ default: ComponentType<any> }>;
	
	/** Component name for debugging and performance tracking */
	name: string;
	
	/** Custom loading component */
	fallback?: React.ComponentType;
	
	/** Props to pass to the lazy component */
	componentProps?: Record<string, any>;
	
	/** Custom error boundary component */
	errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
	
	/** Retry attempts for failed loads */
	maxRetries?: number;
	
	/** Delay before showing loading state (ms) */
	delay?: number;
	
	/** Timeout for component loading (ms) */
	timeout?: number;
	
	/** Additional CSS class names */
	className?: string;
	
	/** Whether to preload the component */
	preload?: boolean;
}

interface LazyComponentState {
	hasError: boolean;
	error: Error | null;
	retryCount: number;
	isLoading: boolean;
	Component: LazyExoticComponent<ComponentType<any>> | null;
}

/**
 * Default loading component
 */
const DefaultLoadingComponent: React.FC = () => (
	<Card className="ecd-lazy-loading">
		<CardBody>
			<Flex justify="center" align="center" direction="column" gap="3">
				<Spinner />
				<Text variant="muted">Loading component...</Text>
			</Flex>
		</CardBody>
	</Card>
);

/**
 * Default error boundary component
 */
const DefaultErrorComponent: React.FC<{ error: Error; retry: () => void; name: string }> = ({ 
	error, 
	retry, 
	name 
}) => (
	<Card className="ecd-lazy-error">
		<CardBody>
			<Flex direction="column" gap="3">
				<Text size="16" weight="600" className="error-title">
					Failed to load {name}
				</Text>
				<Text variant="muted" className="error-message">
					{error.message || 'An error occurred while loading this component.'}
				</Text>
				<Flex gap="2">
					<Button variant="primary" onClick={retry}>
						Retry
					</Button>
					<Button variant="tertiary" onClick={() => window.location.reload()}>
						Refresh Page
					</Button>
				</Flex>
			</Flex>
		</CardBody>
	</Card>
);

/**
 * Enhanced Lazy Component with error handling and performance monitoring
 */
export class LazyComponent extends React.Component<LazyComponentProps, LazyComponentState> {
	private timeoutId: NodeJS.Timeout | null = null;
	private delayTimeoutId: NodeJS.Timeout | null = null;
	private performanceTracker: (() => void) | null = null;

	constructor(props: LazyComponentProps) {
		super(props);

		this.state = {
			hasError: false,
			error: null,
			retryCount: 0,
			isLoading: false,
			Component: null,
		};
	}

	componentDidMount() {
		this.loadComponent();
		
		// Preload if requested
		if (this.props.preload) {
			this.preloadComponent();
		}
	}

	componentWillUnmount() {
		this.clearTimeouts();
		
		// End performance tracking
		if (this.performanceTracker) {
			this.performanceTracker();
		}
	}

	private clearTimeouts() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
		if (this.delayTimeoutId) {
			clearTimeout(this.delayTimeoutId);
		}
	}

	/**
	 * Preload the component without rendering
	 */
	private preloadComponent = async () => {
		try {
			await this.props.factory();
			performanceMonitor.recordMetric(`component-preload-${this.props.name}`, performance.now(), {
				success: true,
			});
		} catch (error) {
			performanceMonitor.recordMetric(`component-preload-${this.props.name}`, performance.now(), {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	/**
	 * Load the lazy component
	 */
	private loadComponent = async () => {
		const { factory, name, timeout = 10000, delay = 0 } = this.props;

		// Start performance tracking
		this.performanceTracker = trackComponentRender(`lazy-${name}`);

		// Handle delay
		if (delay > 0) {
			this.delayTimeoutId = setTimeout(() => {
				this.setState({ isLoading: true });
			}, delay);
		} else {
			this.setState({ isLoading: true });
		}

		// Set loading timeout
		this.timeoutId = setTimeout(() => {
			this.handleError(new Error(`Component "${name}" failed to load within ${timeout}ms`));
		}, timeout);

		try {
			// Create lazy component
			const LazyComp = lazy(factory);
			
			// Clear timeout on success
			this.clearTimeouts();
			
			this.setState({
				Component: LazyComp,
				hasError: false,
				error: null,
				isLoading: false,
			});

			// Record successful load
			performanceMonitor.recordMetric(`component-load-${name}`, performance.now(), {
				success: true,
				retryCount: this.state.retryCount,
			});

		} catch (error) {
			this.handleError(error instanceof Error ? error : new Error('Unknown error'));
		}
	};

	/**
	 * Handle component loading errors
	 */
	private handleError = (error: Error) => {
		this.clearTimeouts();
		
		// End performance tracking with error
		if (this.performanceTracker) {
			this.performanceTracker();
			this.performanceTracker = null;
		}

		// Record error metric
		performanceMonitor.recordMetric(`component-load-error-${this.props.name}`, performance.now(), {
			success: false,
			error: error.message,
			retryCount: this.state.retryCount,
		});

		this.setState({
			hasError: true,
			error,
			isLoading: false,
		});

		// Log error for debugging
		if (window.ecdReactData?.environment?.debugMode) {
			console.error(`Failed to load lazy component "${this.props.name}":`, error);
		}
	};

	/**
	 * Retry loading the component
	 */
	private retryLoad = () => {
		const { maxRetries = 3 } = this.props;
		
		if (this.state.retryCount >= maxRetries) {
			return;
		}

		this.setState(prevState => ({
			hasError: false,
			error: null,
			retryCount: prevState.retryCount + 1,
			isLoading: false,
			Component: null,
		}), () => {
			// Exponential backoff for retries
			const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000);
			setTimeout(this.loadComponent, delay);
		});
	};

	render() {
		const { 
			fallback: CustomFallback, 
			errorBoundary: CustomErrorBoundary,
			componentProps = {},
			className,
			name
		} = this.props;
		
		const { hasError, error, isLoading, Component } = this.state;

		// Show error state
		if (hasError && error) {
			const ErrorComponent = CustomErrorBoundary || DefaultErrorComponent;
			return (
				<div className={`ecd-lazy-component ecd-lazy-error ${className || ''}`}>
					<ErrorComponent 
						error={error} 
						retry={this.retryLoad}
						name={name}
					/>
				</div>
			);
		}

		// Show loading state
		if (isLoading || !Component) {
			const LoadingComponent = CustomFallback || DefaultLoadingComponent;
			return (
				<div className={`ecd-lazy-component ecd-lazy-loading ${className || ''}`}>
					<LoadingComponent />
				</div>
			);
		}

		// Render the loaded component
		return (
			<div className={`ecd-lazy-component ecd-lazy-loaded ${className || ''}`}>
				<Suspense fallback={<DefaultLoadingComponent />}>
					<Component {...componentProps} />
				</Suspense>
			</div>
		);
	}
}

/**
 * Higher-order component for creating lazy components
 */
export function withLazyLoading<P extends object>(
	factory: () => Promise<{ default: ComponentType<P> }>,
	options: Partial<LazyComponentProps> = {}
) {
	return React.forwardRef<any, P>((props, ref) => (
		<LazyComponent
			factory={factory}
			componentProps={{ ...props, ref }}
			{...options}
		/>
	));
}

/**
 * Hook for creating lazy components
 */
export function useLazyComponent<P extends object>(
	factory: () => Promise<{ default: ComponentType<P> }>,
	options: Partial<LazyComponentProps> = {}
): {
	Component: React.ComponentType<P> | null;
	isLoading: boolean;
	error: Error | null;
	retry: () => void;
} {
	const [state, setState] = React.useState<{
		Component: React.ComponentType<P> | null;
		isLoading: boolean;
		error: Error | null;
		retryCount: number;
	}>({
		Component: null,
		isLoading: true,
		error: null,
		retryCount: 0,
	});

	const load = React.useCallback(async () => {
		try {
			setState(prev => ({ ...prev, isLoading: true, error: null }));
			
			const module = await factory();
			const Component = module.default;
			
			setState(prev => ({
				...prev,
				Component,
				isLoading: false,
				error: null,
			}));
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error : new Error('Failed to load component'),
			}));
		}
	}, [factory]);

	const retry = React.useCallback(() => {
		const maxRetries = options.maxRetries || 3;
		if (state.retryCount < maxRetries) {
			setState(prev => ({
				...prev,
				retryCount: prev.retryCount + 1,
			}));
			setTimeout(load, Math.min(1000 * Math.pow(2, state.retryCount), 5000));
		}
	}, [load, state.retryCount, options.maxRetries]);

	React.useEffect(() => {
		load();
	}, [load]);

	return {
		Component: state.Component,
		isLoading: state.isLoading,
		error: state.error,
		retry,
	};
}

/**
 * Lazy component preloader
 */
export class ComponentPreloader {
	private static preloadedComponents = new Set<string>();

	static preload(
		name: string,
		factory: () => Promise<{ default: ComponentType<any> }>
	): Promise<void> {
		if (this.preloadedComponents.has(name)) {
			return Promise.resolve();
		}

		this.preloadedComponents.add(name);
		
		return factory()
			.then(() => {
				performanceMonitor.recordMetric(`preload-${name}`, performance.now(), {
					success: true,
				});
			})
			.catch((error) => {
				this.preloadedComponents.delete(name); // Allow retry
				performanceMonitor.recordMetric(`preload-error-${name}`, performance.now(), {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
				throw error;
			});
	}

	static preloadMultiple(components: Array<{
		name: string;
		factory: () => Promise<{ default: ComponentType<any> }>;
	}>): Promise<void[]> {
		return Promise.allSettled(
			components.map(({ name, factory }) => this.preload(name, factory))
		).then((results) => {
			const failures = results.filter(result => result.status === 'rejected');
			if (failures.length > 0) {
				console.warn(`Failed to preload ${failures.length} components`);
			}
			return results.map(() => undefined);
		});
	}

	static isPreloaded(name: string): boolean {
		return this.preloadedComponents.has(name);
	}
}

// CSS styles for lazy components
const styles = `
.ecd-lazy-component {
	position: relative;
	min-height: 200px;
}

.ecd-lazy-loading .components-card__body {
	padding: 40px 20px;
	text-align: center;
}

.ecd-lazy-error .components-card {
	border-color: #d63638;
}

.ecd-lazy-error .error-title {
	color: #d63638;
}

.ecd-lazy-error .error-message {
	margin-bottom: 16px;
}

/* Animation for loading states */
.ecd-lazy-loading .components-spinner {
	margin: 0 auto 16px;
}

/* Smooth transition when component loads */
.ecd-lazy-loaded {
	animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
	.ecd-lazy-component {
		min-height: 150px;
	}
	
	.ecd-lazy-loading .components-card__body {
		padding: 20px 16px;
	}
}
`;

// Inject styles
if (typeof document !== 'undefined') {
	const styleSheet = document.createElement('style');
	styleSheet.textContent = styles;
	document.head.appendChild(styleSheet);
}