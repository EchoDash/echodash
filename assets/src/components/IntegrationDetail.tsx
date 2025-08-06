/**
 * Integration Detail Component
 * 
 * Shows individual integration with triggers matching mockup
 */

import React from 'react';
import './IntegrationDetail.css';
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

interface Trigger {
	id: string;
	name: string;
	description?: string;
	enabled?: boolean;
}

interface IntegrationDetailProps {
	integration: Integration;
	triggers: Trigger[];
	onBack: () => void;
	onAddTrigger: () => void;
}

export const IntegrationDetail: React.FC<IntegrationDetailProps> = ({
	integration,
	triggers,
	onBack,
	onAddTrigger,
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
					className="echodash-button echodash-header__docs-link"
				>
					Documentation →
				</a>
			</div>

			{/* Breadcrumb navigation */}
			<div className="echodash-breadcrumb">
				<button 
					onClick={onBack}
					className="button-link echodash-breadcrumb__link"
				>
					Integrations
				</button>
				<span className="echodash-breadcrumb__separator">/</span>
				<span>{integration.name}</span>
			</div>

			{/* Integration header */}
			<div className="echodash-card echodash-integration-header">
				<div className="echodash-integration-header__content">
					{/* Icon */}
					<div 
						className="echodash-integration-header__icon echodash-integration-item__icon"
						style={{ backgroundColor: integration.iconBackgroundColor }}
					>
					<img 
						src={integration.icon}
						alt={`${integration.name} logo`}
						className="echodash-integration-header__icon-image echodash-integration-item__icon-image"
					/>
					</div>

					<div className="echodash-integration-header__info">
						<h1 className="echodash-integration-header__title">{integration.name}</h1>
						<p className="echodash-integration-header__description">
							{integration.description || 'Configure triggers for this integration'}
						</p>
					</div>

					<button 
						className="echodash-button echodash-integration-header__add-trigger"
						onClick={onAddTrigger}
					>
						+ Add Trigger
					</button>
				</div>
			</div>

			{/* Triggers section */}
			<div className="echodash-card echodash-triggers">
				<h2 className="echodash-triggers__title">Triggers</h2>
				
				{triggers.length === 0 ? (
					<div className="echodash-triggers__empty-state">
						<div 
							className="echodash-triggers__empty-icon echodash-integration-item__icon"
							style={{ backgroundColor: integration.iconBackgroundColor }}
						>
						<img 
							src={integration.icon}
							alt={`${integration.name} logo`}
							className="echodash-triggers__empty-icon-image echodash-integration-item__icon-image"
						/>
						</div>
						<h3 className="echodash-triggers__empty-title">Add your first {integration.name} trigger</h3>
						<p className="echodash-triggers__empty-description">
							Accumsan augue sapien lorem blandit leo. In fringilla aliquam mattis phasellus.<br />
							Feugiat feugiat risus cursus tempor tortor.
						</p>
						<button 
							className="echodash-button echodash-button-primary"
							onClick={onAddTrigger}
						>
							+ Add Trigger
						</button>
					</div>
				) : (
					<div className="echodash-triggers__list">
						{triggers.map((trigger, index) => (
							<div
								key={trigger.id || index}
								className="echodash-trigger-item"
							>
								{/* Drag handle */}
								<span 
									className="dashicons dashicons-menu echodash-trigger-item__handle" 
								></span>

								{/* Trigger info */}
								<div className="echodash-trigger-item__info">
									<div className="echodash-trigger-item__type">Form Submitted</div>
									<div className="echodash-trigger-item__name">{trigger.name}</div>
								</div>

								{/* Actions */}
								<div className="echodash-trigger-item__actions">
									<button className="echodash-button">Send Test</button>
									<button className="echodash-button">Edit</button>
									<button className="echodash-button">
										<span className="dashicons dashicons-trash"></span>
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	);
};