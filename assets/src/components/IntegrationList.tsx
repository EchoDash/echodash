/**
 * Integration List Component
 *
 * Displays list of integrations matching the mockup design
 */

import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import './IntegrationList.css';
import { EchoDashLogo } from './EchoDashLogo';
import type { Integration, EchoDashSettings } from '../types';

interface IntegrationListProps {
	integrations: Integration[];
	settings: EchoDashSettings;
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
	const [lastSavedEndpoint, setLastSavedEndpoint] = useState(
		settings.endpoint || ''
	);
	const [isSaving, setIsSaving] = useState(false);

	const handleEndpointChange = (
		e: React.ChangeEvent<HTMLInputElement>
	): void => {
		setEndpointUrl(e.target.value);
	};

	const handleEndpointBlur = async (): Promise<void> => {
		if (endpointUrl !== lastSavedEndpoint) {
			// Check if API URL is available
			if (!window.ecdReactData?.apiUrl) {
				alert(
					__(
						'Configuration error: API URL not available. Please refresh the page and try again.',
						'echodash'
					)
				);
				return;
			}

			setIsSaving(true);
			try {
				const response = await fetch(
					window.ecdReactData.apiUrl + 'settings',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-WP-Nonce': window.ecdReactData?.nonce || '',
						},
						body: JSON.stringify({
							endpoint: endpointUrl,
						}),
					}
				);

				if (!response.ok) {
					throw new Error('Failed to save endpoint');
				}

				// Update the last saved endpoint to prevent repeated saves
				setLastSavedEndpoint(endpointUrl);
			} catch {
				// Revert to last saved value on error
				setEndpointUrl(lastSavedEndpoint);
				alert(
					__(
						'Failed to save endpoint URL. Please try again.',
						'echodash'
					)
				);
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
					href="https://echodash.com/?utm_source=echodash-plugin&utm_medium=plugin&utm_campaign=echodash-plugin"
					target="_blank"
					rel="noopener"
					className="echodash-header__logo-link"
				>
					<EchoDashLogo className="echodash-header__logo" />
				</a>
				<a
					href="https://echodash.com/docs/echodash-plugin/?utm_source=echodash-plugin&utm_medium=plugin&utm_campaign=echodash-plugin"
					target="_blank"
					rel="noopener"
					className="echodash-button echodash-header__docs-link"
				>
					{__('Documentation', 'echodash')} →
				</a>
			</div>

			{/* Welcome Section */}
			<div className="echodash-card echodash-welcome">
				<div className="echodash-welcome__content">
					<h2 className="echodash-welcome__title">
						{__('Welcome to EchoDash', 'echodash')}
					</h2>
					<p className="echodash-welcome__description">
						{__(
							"EchoDash is a service for tracking real-time events on your WordPress site. It's free and easy to use.",
							'echodash'
						)}
					</p>
					{!settings.isConnected ? (
						<>
							<p className="echodash-welcome__instructions">
								{__(
									'To get started, create an endpoint in your EchoDash account by clicking the button below.',
									'echodash'
								)}
							</p>

							<div className="echodash-welcome__connect-action">
								<a
									href={settings.connectUrl || '#'}
									className="echodash-button echodash-button-primary echodash-connect-button"
								>
									{__('Connect to EchoDash', 'echodash')}{' '}
									&rarr;
								</a>
							</div>
						</>
					) : (
						<>
							<p className="echodash-welcome__instructions">
								{__(
									'Your endpoint URL is configured below. You can update it anytime if needed.',
									'echodash'
								)}
							</p>

							<div className="echodash-welcome__field-group echodash-input-wrapper echodash-input-wrapper--endpoint-url">
								<input
									type="text"
									id="endpoint-url"
									className="echodash-input-base echodash-welcome__input"
									placeholder={__(
										'https://echodash.com/endpoints/xyz/receive',
										'echodash'
									)}
									value={endpointUrl}
									onChange={handleEndpointChange}
									onBlur={handleEndpointBlur}
									disabled={isSaving}
								/>
								{isSaving && (
									<span className="echodash-saving-indicator">
										{__('Saving...', 'echodash')}
									</span>
								)}
							</div>

							<a
								href="https://echodash.com/events/?utm_source=echodash-plugin&utm_medium=plugin&utm_campaign=echodash-plugin"
								target="_blank"
								rel="noopener"
								className="echodash-button echodash-button-primary"
							>
								{__('View events', 'echodash')} →
							</a>

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
				<h2 className="echodash-integrations__title">
					{__('Integrations', 'echodash')}
				</h2>

				<div className="echodash-integrations__list">
					{integrations.map(integration => (
						<div
							key={integration.slug}
							className="echodash-integration-item"
						>
							{/* Icon */}
							<div
								className="echodash-integration-item__icon"
								style={{
									backgroundColor:
										integration.iconBackgroundColor,
								}}
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
									{integration.triggerCount}{' '}
									{integration.triggerCount === 1
										? __('Trigger', 'echodash')
										: __('Triggers', 'echodash')}
								</span>
							</div>

							{/* Actions */}
							<div className="echodash-integration-item__actions">
								<button
									className="echodash-button"
									onClick={() =>
										onIntegrationClick(integration.slug)
									}
								>
									{__('Manage', 'echodash')}
								</button>
								<button
									className="echodash-button"
									onClick={() =>
										onAddTrigger(integration.slug)
									}
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
