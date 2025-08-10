/**
 * Integration List Component
 * 
 * Displays list of integrations matching the mockup design
 */

import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import './IntegrationList.css';
import { EchoDashLogo } from './EchoDashLogo';

interface Integration {
	slug: string;
	name: string;
	icon: string;
	iconBackgroundColor: string;
	triggerCount: number;
	enabled: boolean;
	description?: string;
}

interface IntegrationListProps {
	integrations: Integration[];
	settings: {
		endpoint?: string;
		isConnected?: boolean;
		connectUrl?: string;
	};
	onIntegrationClick: (slug: string) => void;
	onAddTrigger: (slug: string) => void;
}

export const IntegrationList: React.FC<IntegrationListProps> = ({
	integrations,
	settings,
	onIntegrationClick,
	onAddTrigger,
}) => {
	const [endpointUrl, setEndpointUrl] = useState(settings.endpoint || '');
	const [isSaving, setIsSaving] = useState(false);

	const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEndpointUrl(e.target.value);
	};

	const handleEndpointBlur = async () => {
		if (endpointUrl !== settings.endpoint) {
			setIsSaving(true);
			try {
				const response = await fetch(window.ecdReactData?.apiUrl + 'settings', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': window.ecdReactData?.nonce || '',
					},
					body: JSON.stringify({
						endpoint: endpointUrl
					}),
				});

				if (!response.ok) {
					throw new Error('Failed to save endpoint');
				}

				// Settings are already saved on the server
				// Local state (endpointUrl) already reflects the change
			} catch (error) {
				console.error('Error saving endpoint:', error);
				// Revert to original value on error
				setEndpointUrl(settings.endpoint || '');
				alert(__('Failed to save endpoint URL. Please try again.', 'echodash'));
			} finally {
				setIsSaving(false);
			}
		}
	};

	return (
		<>
			{/* Header with logo */}
			<div className="echodash-header">
				<a 
					href="https://echodash.com" 
					target="_blank" 
					rel="noopener noreferrer"
					className="echodash-header__logo-link"
				>
					<EchoDashLogo className="echodash-header__logo" />
				</a>
				<a 
					href="https://echodash.com/docs/echodash-plugin" 
					target="_blank" 
					rel="noopener noreferrer"
					className="echodash-button echodash-header__docs-link"
				>
					{__('Documentation', 'echodash')} →
				</a>
			</div>

			{/* Welcome Section */}
			<div className="echodash-card echodash-welcome">
				<div className="echodash-welcome__content">
					<h2 className="echodash-welcome__title">{__('Welcome to EchoDash', 'echodash')}</h2>
					<p className="echodash-welcome__description">
						{__('EchoDash is a service for tracking real-time events on your WordPress site. It\'s free and easy to use.', 'echodash')}
					</p>
					{!settings.isConnected ? (
						<>
							<p className="echodash-welcome__instructions">
								{__('To get started, create an endpoint in your EchoDash account by clicking the button below.', 'echodash')}
							</p>
							
							<div className="echodash-welcome__connect-action">
								<a 
									href={settings.connectUrl || '#'} 
									className="echodash-button echodash-button-primary echodash-connect-button"
								>
									{__('Connect to EchoDash', 'echodash')} &rarr;
								</a>
							</div>
						</>
					) : (
						<>
							<p className="echodash-welcome__instructions">
								{__('Your endpoint URL is configured below. You can update it anytime if needed.', 'echodash')}
							</p>
							
							<div className="echodash-welcome__field-group">
								<label htmlFor="endpoint-url" className="echodash-welcome__label">
									{__('URL', 'echodash')}
								</label>
								<input 
									type="text" 
									id="endpoint-url"
									className="regular-text echodash-welcome__input"
									placeholder={__('https://example.com/', 'echodash')}
									value={endpointUrl}
									onChange={handleEndpointChange}
									onBlur={handleEndpointBlur}
									disabled={isSaving}
								/>
								{isSaving && <span className="echodash-saving-indicator">{__('Saving...', 'echodash')}</span>}
							</div>
						</>
					)}
				</div>

				{/* Video placeholder */}
				<div className="echodash-video-placeholder">
					<div className="echodash-video-placeholder__play-button">
						<span className="dashicons dashicons-controls-play echodash-video-placeholder__play-icon"></span>
					</div>
				</div>
			</div>

			{/* Integrations Section */}
			<div className="echodash-card echodash-integrations">
				<h2 className="echodash-integrations__title">{__('Integrations', 'echodash')}</h2>
				
				<div className="echodash-integrations__list">
					{integrations.map((integration) => (
						<div
							key={integration.slug}
							className="echodash-integration-item"
						>
							{/* Icon */}
							<div 
								className="echodash-integration-item__icon"
								style={{ backgroundColor: integration.iconBackgroundColor }}
							>
							<img 
								src={integration.icon}
								alt={`${integration.name} logo`}
								className="echodash-integration-item__icon-image"
							/>
							</div>

							{/* Name and trigger count */}
							<div className="echodash-integration-item__info">
								<h3 className="echodash-integration-item__name">
									{integration.name}
								</h3>
								<span className="echodash-integration-item__trigger-count">
									{integration.triggerCount} {integration.triggerCount === 1 ? __('Trigger', 'echodash') : __('Triggers', 'echodash')}
								</span>
							</div>

							{/* Actions */}
							<div className="echodash-integration-item__actions">
								<button 
									className="echodash-button"
									onClick={() => onIntegrationClick(integration.slug)}
								>
									{__('Manage', 'echodash')}
								</button>
								<button 
									className="echodash-button"
									onClick={() => onAddTrigger(integration.slug)}
								>
									+ {__('Add Trigger', 'echodash')}
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
};