/**
 * Live Preview Component
 * 
 * Shows a real-time preview of event data with merge tag processing.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	Button,
	Flex,
	Text,
	Spinner,
	Notice,
	TextControl,
	SelectControl,
	ToggleControl,
	__experimentalSpacer as Spacer
} from '@wordpress/components';
import { Icon, visibility, code, send } from '@wordpress/icons';
import clsx from 'clsx';

import { MergeTagProcessor, defaultTestData } from '../../services/merge-tags';
import { useDebounce } from '../../hooks/useDebounce';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface LivePreviewProps {
	/** Event configuration to preview */
	eventConfig: {
		name: string;
		mappings: Record<string, string>;
		[key: string]: any;
	};
	
	/** Integration slug for context */
	integrationSlug: string;
	
	/** Custom test data */
	testData?: Record<string, any>;
	
	/** Loading state */
	loading?: boolean;
	
	/** Error state */
	error?: string;
	
	/** Callback for sending test event */
	onSendTest?: (eventData: Record<string, any>) => Promise<void>;
	
	/** Callback when preview data changes */
	onChange?: (previewData: Record<string, any>) => void;
	
	/** CSS class name */
	className?: string;
}

interface PreviewData {
	eventName: string;
	processedData: Record<string, any>;
	rawData: Record<string, string>;
	timestamp: string;
	hasErrors: boolean;
	errors: string[];
}

export const LivePreview: React.FC<LivePreviewProps> = ({
	eventConfig,
	integrationSlug,
	testData,
	loading = false,
	error,
	onSendTest,
	onChange,
	className
}) => {
	const { announceToScreenReader } = useAccessibility();
	
	// Component state
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);
	const [showRawData, setShowRawData] = useState(false);
	const [sendingTest, setSendingTest] = useState(false);
	const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
	const [autoRefresh, setAutoRefresh] = useState(true);
	
	// Merge tag processor
	const mergeTagProcessor = useMemo(() => {
		const data = { ...defaultTestData, ...testData };
		return new MergeTagProcessor({
			testData: data,
			showPlaceholders: true,
			placeholderFormat: (tag) => `[${tag}]`
		});
	}, [testData]);
	
	// Debounced event config for performance
	const debouncedEventConfig = useDebounce(eventConfig, 500);
	
	// Generate preview data
	const generatePreview = useCallback(() => {
		if (!debouncedEventConfig || !debouncedEventConfig.mappings) {
			setPreviewData(null);
			return;
		}

		try {
			const processedData: Record<string, any> = {};
			const rawData: Record<string, string> = {};
			const errors: string[] = [];

			// Process each mapping
			Object.entries(debouncedEventConfig.mappings).forEach(([key, template]) => {
				if (typeof template === 'string') {
					rawData[key] = template;
					
					// Validate template
					const validation = mergeTagProcessor.validateTemplate(template);
					if (!validation.valid) {
						errors.push(...validation.errors);
					}
					
					// Process template
					const processedValue = mergeTagProcessor.process(template);
					processedData[key] = processedValue;
				} else {
					rawData[key] = String(template);
					processedData[key] = template;
				}
			});

			const newPreviewData: PreviewData = {
				eventName: debouncedEventConfig.name || 'Untitled Event',
				processedData,
				rawData,
				timestamp: new Date().toISOString(),
				hasErrors: errors.length > 0,
				errors
			};

			setPreviewData(newPreviewData);
			onChange?.(processedData);

			// Announce changes to screen readers
			if (autoRefresh) {
				announceToScreenReader('Preview updated', 'polite');
			}

		} catch (err) {
			console.error('Error generating preview:', err);
			setPreviewData({
				eventName: debouncedEventConfig.name || 'Untitled Event',
				processedData: {},
				rawData: {},
				timestamp: new Date().toISOString(),
				hasErrors: true,
				errors: [`Preview generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`]
			});
		}
	}, [debouncedEventConfig, mergeTagProcessor, onChange, autoRefresh, announceToScreenReader]);

	// Auto-generate preview when config changes
	useEffect(() => {
		if (autoRefresh) {
			generatePreview();
		}
	}, [generatePreview, autoRefresh]);

	// Handle manual refresh
	const handleRefresh = useCallback(() => {
		generatePreview();
		announceToScreenReader('Preview refreshed manually', 'polite');
	}, [generatePreview, announceToScreenReader]);

	// Handle test event sending
	const handleSendTest = useCallback(async () => {
		if (!previewData || !onSendTest) {
			return;
		}

		setSendingTest(true);
		setTestResult(null);

		try {
			await onSendTest(previewData.processedData);
			setTestResult({
				success: true,
				message: 'Test event sent successfully!'
			});
			announceToScreenReader('Test event sent successfully', 'polite');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to send test event';
			setTestResult({
				success: false,
				message
			});
			announceToScreenReader(`Test event failed: ${message}`, 'assertive');
		} finally {
			setSendingTest(false);
		}
	}, [previewData, onSendTest, announceToScreenReader]);

	// Render preview data
	const renderPreviewData = () => {
		if (!previewData) {
			return (
				<div className="ecd-preview-empty">
					<Icon icon={visibility} size={48} />
					<Text variant="muted">Configure event properties to see preview</Text>
				</div>
			);
		}

		const dataToShow = showRawData ? previewData.rawData : previewData.processedData;

		return (
			<div className="ecd-preview-data">
				<div className="ecd-preview-header">
					<Text weight="600" size="14">Event Name:</Text>
					<Text className="ecd-event-name">{previewData.eventName}</Text>
				</div>

				<Spacer marginY="3" />

				<div className="ecd-preview-properties">
					<Flex justify="space-between" align="center" className="properties-header">
						<Text weight="600" size="14">
							{showRawData ? 'Raw Templates' : 'Processed Data'}
						</Text>
						<Button
							icon={code}
							variant="tertiary"
							size="small"
							onClick={() => setShowRawData(!showRawData)}
							className={clsx({ 'is-pressed': showRawData })}
						>
							{showRawData ? 'Show Processed' : 'Show Raw'}
						</Button>
					</Flex>

					<div className="ecd-data-display" role="region" aria-label="Event data preview">
						{Object.keys(dataToShow).length === 0 ? (
							<Text variant="muted" className="no-properties">
								No properties configured
							</Text>
						) : (
							<div className="ecd-property-list">
								{Object.entries(dataToShow).map(([key, value]) => (
									<div key={key} className="ecd-property-item">
										<div className="property-key">
											<Text weight="500" size="13">{key}:</Text>
										</div>
										<div className="property-value">
											<code className={clsx('property-code', {
												'has-placeholder': showRawData && String(value).includes('['),
												'is-processed': !showRawData
											})}>
												{String(value)}
											</code>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="ecd-preview-meta">
					<Text variant="muted" size="11">
						Last updated: {new Date(previewData.timestamp).toLocaleString()}
					</Text>
				</div>
			</div>
		);
	};

	return (
		<Card className={clsx('ecd-live-preview', className)} isElevated>
			<CardHeader>
				<Flex justify="space-between" align="center">
					<Flex align="center" gap="2">
						<Icon icon={visibility} size={20} />
						<Text weight="600" size="16">Live Preview</Text>
						{loading && <Spinner />}
					</Flex>
					
					<Flex gap="2">
						<ToggleControl
							label="Auto-refresh"
							checked={autoRefresh}
							onChange={setAutoRefresh}
							__nextHasNoMarginBottom
						/>
						
						<Button
							variant="tertiary"
							size="small"
							onClick={handleRefresh}
							disabled={loading}
						>
							Refresh
						</Button>
						
						{onSendTest && previewData && !previewData.hasErrors && (
							<Button
								variant="secondary"
								size="small"
								icon={send}
								onClick={handleSendTest}
								disabled={sendingTest || loading}
							>
								{sendingTest ? 'Sending...' : 'Send Test'}
							</Button>
						)}
					</Flex>
				</Flex>
			</CardHeader>

			<CardBody>
				{/* Error state */}
				{error && (
					<Notice status="error" isDismissible={false}>
						{error}
					</Notice>
				)}

				{/* Validation errors */}
				{previewData?.hasErrors && (
					<Notice status="warning" isDismissible={false} className="preview-errors">
						<Text weight="600">Preview Issues:</Text>
						<ul>
							{previewData.errors.map((err, index) => (
								<li key={index}>{err}</li>
							))}
						</ul>
					</Notice>
				)}

				{/* Test result */}
				{testResult && (
					<Notice 
						status={testResult.success ? 'success' : 'error'} 
						onRemove={() => setTestResult(null)}
						isDismissible
					>
						{testResult.message}
					</Notice>
				)}

				{/* Preview content */}
				<div className="ecd-preview-content">
					{loading ? (
						<Flex align="center" justify="center" className="preview-loading">
							<Spinner />
							<Text>Generating preview...</Text>
						</Flex>
					) : (
						renderPreviewData()
					)}
				</div>
			</CardBody>
		</Card>
	);
};