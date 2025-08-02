/**
 * Preview Display Component
 * 
 * Displays formatted preview data with syntax highlighting and copy functionality.
 */

import React, { useState, useCallback } from 'react';
import {
	Button,
	Flex,
	Text,
	Notice,
	__experimentalSpacer as Spacer
} from '@wordpress/components';
import { Icon, copy, check } from '@wordpress/icons';
import clsx from 'clsx';

import { useAccessibility } from '../../hooks/useAccessibility';

export interface PreviewDisplayProps {
	/** Data to display */
	data: Record<string, any>;
	
	/** Display format */
	format?: 'table' | 'json' | 'list';
	
	/** Show copy button */
	showCopy?: boolean;
	
	/** CSS class name */
	className?: string;
	
	/** Custom title */
	title?: string;
}

export const PreviewDisplay: React.FC<PreviewDisplayProps> = ({
	data,
	format = 'list',
	showCopy = true,
	className,
	title = 'Event Data'
}) => {
	const { announceToScreenReader } = useAccessibility();
	const [copied, setCopied] = useState(false);

	// Handle copy to clipboard
	const handleCopy = useCallback(async () => {
		try {
			const jsonString = JSON.stringify(data, null, 2);
			await navigator.clipboard.writeText(jsonString);
			setCopied(true);
			announceToScreenReader('Data copied to clipboard', 'polite');
			
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
			announceToScreenReader('Failed to copy data', 'assertive');
		}
	}, [data, announceToScreenReader]);

	// Render data as table
	const renderTable = () => (
		<div className="ecd-preview-table">
			<table className="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th scope="col" className="property-name">Property</th>
						<th scope="col" className="property-value">Value</th>
						<th scope="col" className="property-type">Type</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(data).map(([key, value]) => (
						<tr key={key}>
							<td className="property-name">
								<strong>{key}</strong>
							</td>
							<td className="property-value">
								<code>{formatValue(value)}</code>
							</td>
							<td className="property-type">
								<span className={`type-badge type-${getValueType(value)}`}>
									{getValueType(value)}
								</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);

	// Render data as JSON
	const renderJson = () => (
		<div className="ecd-preview-json">
			<pre className="json-display">
				<code>{JSON.stringify(data, null, 2)}</code>
			</pre>
		</div>
	);

	// Render data as list
	const renderList = () => (
		<div className="ecd-preview-list">
			{Object.keys(data).length === 0 ? (
				<div className="empty-state">
					<Text variant="muted">No data to preview</Text>
				</div>
			) : (
				<div className="property-list">
					{Object.entries(data).map(([key, value]) => (
						<div key={key} className="property-item">
							<div className="property-header">
								<Text weight="600" size="13" className="property-key">
									{key}
								</Text>
								<span className={`type-badge type-${getValueType(value)}`}>
									{getValueType(value)}
								</span>
							</div>
							<div className="property-content">
								<code className="property-value">{formatValue(value)}</code>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);

	// Render based on format
	const renderContent = () => {
		switch (format) {
			case 'table':
				return renderTable();
			case 'json':
				return renderJson();
			case 'list':
			default:
				return renderList();
		}
	};

	return (
		<div className={clsx('ecd-preview-display', `ecd-preview-display--${format}`, className)}>
			<Flex justify="space-between" align="center" className="preview-header">
				<Text weight="600" size="14">{title}</Text>
				{showCopy && Object.keys(data).length > 0 && (
					<Button
						variant="tertiary"
						size="small"
						icon={copied ? check : copy}
						onClick={handleCopy}
						className={clsx('copy-button', { 'is-copied': copied })}
					>
						{copied ? 'Copied!' : 'Copy JSON'}
					</Button>
				)}
			</Flex>

			<Spacer marginY="3" />

			<div className="preview-content" role="region" aria-label={title}>
				{renderContent()}
			</div>

			{Object.keys(data).length === 0 && (
				<Notice status="info" isDismissible={false} className="empty-notice">
					Configure event mappings to see preview data here.
				</Notice>
			)}
		</div>
	);
};

/**
 * Format a value for display
 */
function formatValue(value: any): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return value;
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return `[${value.join(', ')}]`;
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

/**
 * Get the type of a value for display
 */
function getValueType(value: any): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (Array.isArray(value)) return 'array';
	if (typeof value === 'object') return 'object';
	if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date';
	if (typeof value === 'string' && value.match(/^[\w.-]+@[\w.-]+\.\w+$/)) return 'email';
	if (typeof value === 'string' && value.match(/^https?:\/\//)) return 'url';
	return typeof value;
}