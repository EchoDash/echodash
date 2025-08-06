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
					className="button button-link echodash-header__docs-link"
				>
					Documentation →
				</a>
			</div>

			{/* Breadcrumb navigation */}
			<div className="echodash-breadcrumb">
				<button 
					onClick={onBack}
					className="button button-link echodash-breadcrumb__link"
				>
					Integrations
				</button>
				<span className="echodash-breadcrumb__separator">/</span>
				<span>{integration.name}</span>
			</div>

			{/* Integration header */}
			<div className="echodash-integration-header">
				<div className="echodash-integration-header__content">
					{/* Icon */}
					<div className={`echodash-integration-header__icon ${integration.slug === 'wordpress' ? 'echodash-integration-header__icon--wordpress' : 'echodash-integration-header__icon--default'}`}>
						<span 
							className={`dashicons dashicons-${integration.icon} echodash-integration-header__icon-dashicon`} 
						></span>
					</div>

					<div className="echodash-integration-header__info">
						<h1 className="echodash-integration-header__title">{integration.name}</h1>
						<p className="echodash-integration-header__description">
							{integration.description || 'Configure triggers for this integration'}
						</p>
					</div>

					<button 
						className="button button-primary echodash-integration-header__add-trigger"
						onClick={onAddTrigger}
					>
						+ Add Trigger
					</button>
				</div>
			</div>

			{/* Triggers section */}
			<div className="echodash-triggers">
				<h2 className="echodash-triggers__title">Triggers</h2>
				
				{triggers.length === 0 ? (
					<div className="echodash-triggers__empty-state">
						<div className="echodash-triggers__empty-icon">
							<span 
								className={`dashicons dashicons-${integration.icon} echodash-triggers__empty-icon-dashicon`} 
							></span>
						</div>
						<h3 className="echodash-triggers__empty-title">Add your first {integration.name} trigger</h3>
						<p className="echodash-triggers__empty-description">
							Accumsan augue sapien lorem blandit leo. In fringilla aliquam mattis phasellus.<br />
							Feugiat feugiat risus cursus tempor tortor.
						</p>
						<button 
							className="button button-primary"
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
									<button className="button button-secondary">Send Test</button>
									<button className="button button-secondary">Edit</button>
									<button className="button button-link-delete">
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