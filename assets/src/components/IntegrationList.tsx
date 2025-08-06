/**
 * Integration List Component
 * 
 * Displays list of integrations matching the mockup design
 */

import React from 'react';
import './IntegrationList.css';
import { EchoDashLogo } from './EchoDashLogo';

interface Integration {
	slug: string;
	name: string;
	icon: string;
	triggerCount: number;
	enabled: boolean;
	description?: string;
}

interface IntegrationListProps {
	integrations: Integration[];
	settings: {
		endpoint?: string;
		isConnected?: boolean;
	};
	onIntegrationClick: (slug: string) => void;
}

export const IntegrationList: React.FC<IntegrationListProps> = ({
	integrations,
	settings,
	onIntegrationClick,
}) => {
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
					href="https://docs.echodash.com" 
					target="_blank" 
					rel="noopener noreferrer"
					className="button button-link echodash-header__docs-link"
				>
					Documentation →
				</a>
			</div>

			{/* Welcome Section */}
			<div className="echodash-welcome">
				<div className="echodash-welcome__content">
					<h2 className="echodash-welcome__title">Welcome to EchoDash</h2>
					<p className="echodash-welcome__description">
						EchoDash is a service for tracking real-time events on your WordPress site. It's free and easy to use.
					</p>
					<p className="echodash-welcome__instructions">
						To get started, <a href="#" className="echodash-welcome__instructions-link">create an endpoint in your EchoDash account</a>, and copy the URL into the field below.
					</p>
					
					<div className="echodash-welcome__field-group">
						<label htmlFor="endpoint-url" className="echodash-welcome__label">
							URL
						</label>
						<input 
							type="text" 
							id="endpoint-url"
							className="regular-text echodash-welcome__input"
							placeholder="https://example.com/"
							value={settings.endpoint || ''}
						/>
					</div>
				</div>

				{/* Video placeholder */}
				<div className="echodash-video-placeholder">
					<div className="echodash-video-placeholder__play-button">
						<span className="dashicons dashicons-controls-play echodash-video-placeholder__play-icon"></span>
					</div>
				</div>
			</div>

			{/* Integrations Section */}
			<div className="echodash-integrations">
				<h2 className="echodash-integrations__title">Integrations</h2>
				
				<div className="echodash-integrations__list">
					{integrations.map((integration) => (
						<div
							key={integration.slug}
							className="echodash-integration-item"
						>
							{/* Icon */}
							<div className={`echodash-integration-item__icon ${integration.slug === 'wordpress' ? 'echodash-integration-item__icon--wordpress' : 'echodash-integration-item__icon--default'}`}>
								<span 
									className={`dashicons dashicons-${integration.icon} echodash-integration-item__icon-dashicon`} 
								></span>
							</div>

							{/* Name and trigger count */}
							<div className="echodash-integration-item__info">
								<h3 className="echodash-integration-item__name">
									{integration.name}
								</h3>
								<span className="echodash-integration-item__trigger-count">
									{integration.triggerCount} {integration.triggerCount === 1 ? 'Trigger' : 'Triggers'}
								</span>
							</div>

							{/* Actions */}
							<div className="echodash-integration-item__actions">
								<button 
									className="button button-secondary"
									onClick={() => onIntegrationClick(integration.slug)}
								>
									Manage
								</button>
								<button className="button button-primary">
									+ Add Trigger
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
};