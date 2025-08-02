/**
 * Performance Monitoring Utilities
 * 
 * Comprehensive performance monitoring system for the EchoDash React application.
 * Tracks metrics, monitors thresholds, and provides actionable insights.
 */

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
	INITIAL_LOAD: 3000,        // Initial app load
	COMPONENT_RENDER: 100,     // Individual component render
	API_REQUEST: 1000,         // API request timeout
	INTERACTION_RESPONSE: 100, // User interaction response
	BUNDLE_SIZE: 500000,       // 500KB bundle size limit
} as const;

// Performance metric types
export interface PerformanceMetric {
	name: string;
	value: number;
	timestamp: number;
	threshold?: number;
	metadata?: Record<string, any>;
}

export interface PerformanceMark {
	name: string;
	startTime: number;
	metadata?: Record<string, any>;
}

export interface PerformanceMeasure {
	name: string;
	duration: number;
	startMark: string;
	endMark: string;
	metadata?: Record<string, any>;
}

/**
 * Performance Monitor Class
 * 
 * Centralized performance monitoring with metrics collection,
 * threshold checking, and reporting capabilities.
 */
export class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private metrics: PerformanceMetric[] = [];
	private marks: Map<string, PerformanceMark> = new Map();
	private measures: PerformanceMeasure[] = [];
	private isEnabled: boolean = false;

	constructor() {
		this.isEnabled = this.shouldEnableMonitoring();
		if (this.isEnabled) {
			this.initializeMonitoring();
		}
	}

	public static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}

	/**
	 * Check if performance monitoring should be enabled
	 */
	private shouldEnableMonitoring(): boolean {
		return !!(
			window.ecdReactData?.performance?.enableMetrics ||
			window.ecdReactData?.environment?.debugMode ||
			localStorage.getItem('ecd_enable_performance') === 'true'
		);
	}

	/**
	 * Initialize performance monitoring
	 */
	private initializeMonitoring(): void {
		// Listen for browser performance entries
		if ('PerformanceObserver' in window) {
			try {
				// Monitor navigation timing
				const navObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						this.recordNavigationTiming(entry as PerformanceNavigationTiming);
					}
				});
				navObserver.observe({ type: 'navigation', buffered: true });

				// Monitor resource loading
				const resourceObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						this.recordResourceTiming(entry as PerformanceResourceTiming);
					}
				});
				resourceObserver.observe({ type: 'resource', buffered: true });

				// Monitor long tasks
				const longTaskObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						this.recordLongTask(entry);
					}
				});
				longTaskObserver.observe({ type: 'longtask', buffered: true });

			} catch (error) {
				console.warn('Performance Observer not fully supported:', error);
			}
		}

		// Monitor memory usage if available
		this.monitorMemoryUsage();

		// Set up periodic reporting
		this.setupPeriodicReporting();
	}

	/**
	 * Create a performance mark
	 */
	public mark(name: string, metadata?: Record<string, any>): void {
		if (!this.isEnabled) return;

		const startTime = performance.now();
		
		// Use native performance API if available
		if (performance.mark) {
			try {
				performance.mark(name);
			} catch (error) {
				console.warn('Failed to create performance mark:', error);
			}
		}

		// Store in our tracking system
		this.marks.set(name, {
			name,
			startTime,
			metadata,
		});

		this.logDebug(`Mark created: ${name}`, { startTime, metadata });
	}

	/**
	 * Measure time between two marks
	 */
	public measure(name: string, startMark: string, endMark?: string, metadata?: Record<string, any>): number {
		if (!this.isEnabled) return 0;

		let duration = 0;

		// Use native performance API if available
		if (performance.measure) {
			try {
				performance.measure(name, startMark, endMark);
				const entries = performance.getEntriesByName(name, 'measure');
				if (entries.length > 0) {
					duration = entries[entries.length - 1].duration;
				}
			} catch (error) {
				console.warn('Failed to create performance measure:', error);
			}
		}

		// Fallback to manual calculation
		if (duration === 0) {
			const startMarkData = this.marks.get(startMark);
			const endTime = endMark ? (this.marks.get(endMark)?.startTime || performance.now()) : performance.now();
			
			if (startMarkData) {
				duration = endTime - startMarkData.startTime;
			}
		}

		// Store measure
		const measure: PerformanceMeasure = {
			name,
			duration,
			startMark,
			endMark: endMark || 'now',
			metadata,
		};
		this.measures.push(measure);

		// Record as metric
		this.recordMetric(name, duration, metadata);

		this.logDebug(`Measure created: ${name}`, { duration: `${duration.toFixed(2)}ms`, metadata });

		return duration;
	}

	/**
	 * Record a performance metric
	 */
	public recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
		if (!this.isEnabled) return;

		const metric: PerformanceMetric = {
			name,
			value,
			timestamp: Date.now(),
			threshold: this.getThresholdForMetric(name),
			metadata,
		};

		this.metrics.push(metric);

		// Check threshold violation
		if (metric.threshold && value > metric.threshold) {
			this.handleThresholdViolation(metric);
		}

		// Limit metrics array size
		if (this.metrics.length > 1000) {
			this.metrics = this.metrics.slice(-500); // Keep last 500 metrics
		}
	}

	/**
	 * Get threshold for a specific metric
	 */
	private getThresholdForMetric(name: string): number | undefined {
		const thresholdMap: Record<string, number> = {
			'app-load': PERFORMANCE_THRESHOLDS.INITIAL_LOAD,
			'component-render': PERFORMANCE_THRESHOLDS.COMPONENT_RENDER,
			'api-request': PERFORMANCE_THRESHOLDS.API_REQUEST,
			'user-interaction': PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE,
		};

		return thresholdMap[name];
	}

	/**
	 * Handle threshold violations
	 */
	private handleThresholdViolation(metric: PerformanceMetric): void {
		const message = `Performance threshold violated: ${metric.name} took ${metric.value.toFixed(2)}ms (threshold: ${metric.threshold}ms)`;
		
		console.warn(message, metric);

		// Send to logging service if available
		this.sendToLoggingService('warning', message, {
			metric: metric.name,
			value: metric.value,
			threshold: metric.threshold,
			metadata: metric.metadata,
		});
	}

	/**
	 * Record navigation timing
	 */
	private recordNavigationTiming(entry: PerformanceNavigationTiming): void {
		this.recordMetric('navigation-start-to-load', entry.loadEventEnd - entry.navigationStart);
		this.recordMetric('dom-content-loaded', entry.domContentLoadedEventEnd - entry.navigationStart);
		this.recordMetric('first-contentful-paint', entry.loadEventEnd - entry.fetchStart);
	}

	/**
	 * Record resource timing
	 */
	private recordResourceTiming(entry: PerformanceResourceTiming): void {
		// Only track our assets
		if (entry.name.includes('echodash') || entry.name.includes('wp-content/plugins/echodash')) {
			const duration = entry.responseEnd - entry.startTime;
			this.recordMetric(`resource-load-${entry.name.split('/').pop()}`, duration, {
				url: entry.name,
				size: entry.transferSize,
				type: entry.initiatorType,
			});
		}
	}

	/**
	 * Record long tasks
	 */
	private recordLongTask(entry: PerformanceEntry): void {
		this.recordMetric('long-task', entry.duration, {
			startTime: entry.startTime,
			name: entry.name,
		});
	}

	/**
	 * Monitor memory usage
	 */
	private monitorMemoryUsage(): void {
		if ('memory' in performance) {
			const memoryInfo = (performance as any).memory;
			if (memoryInfo) {
				this.recordMetric('memory-used', memoryInfo.usedJSHeapSize, {
					total: memoryInfo.totalJSHeapSize,
					limit: memoryInfo.jsHeapSizeLimit,
				});
			}
		}
	}

	/**
	 * Set up periodic reporting
	 */
	private setupPeriodicReporting(): void {
		// Report metrics every 30 seconds
		setInterval(() => {
			this.reportMetrics();
		}, 30000);

		// Report on page unload
		window.addEventListener('beforeunload', () => {
			this.reportMetrics();
		});
	}

	/**
	 * Get performance summary
	 */
	public getPerformanceSummary(): {
		metrics: PerformanceMetric[];
		measures: PerformanceMeasure[];
		thresholdViolations: PerformanceMetric[];
		averages: Record<string, number>;
	} {
		const thresholdViolations = this.metrics.filter(
			(metric) => metric.threshold && metric.value > metric.threshold
		);

		const averages: Record<string, number> = {};
		const metricGroups: Record<string, number[]> = {};

		// Group metrics by name for averaging
		this.metrics.forEach((metric) => {
			if (!metricGroups[metric.name]) {
				metricGroups[metric.name] = [];
			}
			metricGroups[metric.name].push(metric.value);
		});

		// Calculate averages
		Object.entries(metricGroups).forEach(([name, values]) => {
			averages[name] = values.reduce((sum, value) => sum + value, 0) / values.length;
		});

		return {
			metrics: this.metrics.slice(-50), // Last 50 metrics
			measures: this.measures.slice(-20), // Last 20 measures
			thresholdViolations,
			averages,
		};
	}

	/**
	 * Report metrics to server
	 */
	private reportMetrics(): void {
		if (this.metrics.length === 0) return;

		const summary = this.getPerformanceSummary();
		
		// Send to WordPress admin-ajax endpoint
		if (window.ecdReactData?.apiUrl) {
			fetch(`${window.ecdReactData.apiUrl}performance-metrics`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.ecdReactData.nonce,
				},
				body: JSON.stringify({
					summary,
					userAgent: navigator.userAgent,
					timestamp: Date.now(),
				}),
			}).catch((error) => {
				console.warn('Failed to send performance metrics:', error);
			});
		}
	}

	/**
	 * Send message to logging service
	 */
	private sendToLoggingService(level: string, message: string, context?: Record<string, any>): void {
		if (window.ecdReactData?.apiUrl) {
			fetch('/wp-admin/admin-ajax.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					action: 'ecd_log_client_event',
					level,
					message,
					context: JSON.stringify(context || {}),
					nonce: window.ecdReactData.nonce,
				}),
			}).catch(() => {
				// Silently fail
			});
		}
	}

	/**
	 * Debug logging
	 */
	private logDebug(message: string, data?: any): void {
		if (window.ecdReactData?.environment?.debugMode) {
			console.log(`[Performance] ${message}`, data);
		}
	}
}

// Convenience functions for common use cases
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Measure performance of a function execution
 */
export function measurePerformance<T>(
	name: string,
	fn: () => T,
	metadata?: Record<string, any>
): T {
	performanceMonitor.mark(`${name}-start`, metadata);
	
	try {
		const result = fn();
		
		// Handle promises
		if (result instanceof Promise) {
			return result.finally(() => {
				performanceMonitor.mark(`${name}-end`);
				performanceMonitor.measure(name, `${name}-start`, `${name}-end`, metadata);
			}) as T;
		}
		
		// Handle synchronous functions
		performanceMonitor.mark(`${name}-end`);
		performanceMonitor.measure(name, `${name}-start`, `${name}-end`, metadata);
		
		return result;
	} catch (error) {
		performanceMonitor.mark(`${name}-error`);
		performanceMonitor.measure(`${name}-error`, `${name}-start`, `${name}-error`, {
			...metadata,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

/**
 * Measure async function performance
 */
export async function measureAsyncPerformance<T>(
	name: string,
	fn: () => Promise<T>,
	metadata?: Record<string, any>
): Promise<T> {
	performanceMonitor.mark(`${name}-start`, metadata);
	
	try {
		const result = await fn();
		performanceMonitor.mark(`${name}-end`);
		performanceMonitor.measure(name, `${name}-start`, `${name}-end`, metadata);
		return result;
	} catch (error) {
		performanceMonitor.mark(`${name}-error`);
		performanceMonitor.measure(`${name}-error`, `${name}-start`, `${name}-error`, {
			...metadata,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

/**
 * Track user interaction performance
 */
export function trackUserInteraction(interactionName: string, metadata?: Record<string, any>): () => void {
	const startMark = `interaction-${interactionName}-start`;
	performanceMonitor.mark(startMark, { type: 'user-interaction', ...metadata });
	
	return () => {
		const endMark = `interaction-${interactionName}-end`;
		performanceMonitor.mark(endMark);
		performanceMonitor.measure(`user-interaction-${interactionName}`, startMark, endMark, metadata);
	};
}

/**
 * Track component render performance
 */
export function trackComponentRender(componentName: string, metadata?: Record<string, any>): () => void {
	const startMark = `component-${componentName}-render-start`;
	performanceMonitor.mark(startMark, { type: 'component-render', ...metadata });
	
	return () => {
		const endMark = `component-${componentName}-render-end`;
		performanceMonitor.mark(endMark);
		performanceMonitor.measure(`component-render-${componentName}`, startMark, endMark, metadata);
	};
}

/**
 * Get bundle size information from window object
 */
export function getBundleInfo(): {
	totalSize: number;
	formattedSize: string;
	breakdown: Record<string, { size: number; formatted: string }>;
} {
	const bundleSize = window.ecdReactData?.performance?.bundleSize;
	
	if (!bundleSize) {
		return {
			totalSize: 0,
			formattedSize: '0 B',
			breakdown: {},
		};
	}

	return {
		totalSize: bundleSize.total,
		formattedSize: bundleSize.formatted.total,
		breakdown: {
			javascript: {
				size: bundleSize.js,
				formatted: bundleSize.formatted.js,
			},
			css: {
				size: bundleSize.css,
				formatted: bundleSize.formatted.css,
			},
		},
	};
}

// Initialize performance monitoring when module loads
if (typeof window !== 'undefined') {
	// Mark initial script load
	performanceMonitor.mark('echodash-performance-utils-loaded');
}