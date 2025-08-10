/**
 * Integration Detail Component
 * 
 * Shows individual integration with triggers matching mockup
 */

import React, { useState } from 'react';
import { __, _n } from '@wordpress/i18n';
import './IntegrationDetail.css';
import { EchoDashLogo } from './EchoDashLogo';

interface Integration {
	slug: string;
	name: string;
	icon: string;
	iconBackgroundColor: string;
	triggerCount: number;
	enabled: boolean;
	availableTriggers?: Array<{
		id: string;
		name: string;
		description?: string;
		defaultEvent?: any;
	}>;
	singleItemTriggers?: Array<{
		trigger: string;
		name: string;
		description?: string;
		items: Array<{
			post_id: number;
			post_title: string;
			edit_url: string;
			event_name: string;
			mappings: any;
		}>;
	}>;
}

interface Trigger {
	id: string;
	name: string;
	trigger?: string;
	description?: string;
	enabled?: boolean;
	event_name?: string;
	mappings?: Array<{
		key: string;
		value: string;
	}>;
}

interface IntegrationDetailProps {
	integration: Integration;
	triggers: Trigger[];
	onBack: () => void;
	onAddTrigger: () => void;
	onEditTrigger: (trigger: Trigger) => void;
	onDeleteTrigger: (trigger: Trigger) => void;
	onSendTest: (trigger: Trigger) => void;
}

export const IntegrationDetail: React.FC<IntegrationDetailProps> = ({
	integration,
	triggers,
	onBack,
	onAddTrigger,
	onEditTrigger,
	onDeleteTrigger,
	onSendTest,
}) => {
	const [sendingTest, setSendingTest] = useState<string | null>(null);
	const [sentTest, setSentTest] = useState<string | null>(null);

	const handleSendTest = async (trigger: Trigger) => {
		setSendingTest(trigger.id);
		setSentTest(null); // Clear any previous sent state
		try {
			await onSendTest(trigger);
			// Show "Sent!" state for 3 seconds
			setSentTest(trigger.id);
			setTimeout(() => setSentTest(null), 3000);
		} catch (error) {
			// onSendTest handles error display, just clear loading state
		} finally {
			setSendingTest(null);
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

			{/* Breadcrumb navigation */}
			<div className="echodash-breadcrumb">
				<button 
					onClick={onBack}
					className="button-link echodash-breadcrumb__link"
				>
					{__('Integrations', 'echodash')}
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
							{integration.description || __('Configure triggers for this integration', 'echodash')}
						</p>
					</div>

					<button 
						className="echodash-button echodash-integration-header__add-trigger"
						onClick={onAddTrigger}
					>
						+ {__('Add Trigger', 'echodash')}
					</button>
				</div>
			</div>

			{/* Triggers section */}
			<div className="echodash-card echodash-triggers">
				<h2 className="echodash-triggers__title">{__('Global Triggers', 'echodash')}</h2>
				
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
						<h3 className="echodash-triggers__empty-title">{__('Add your first %s trigger', 'echodash').replace('%s', integration.name)}</h3>
						<p className="echodash-triggers__empty-description">
							Global triggers fire for all events of the selected type across your site.
						</p>
						<button 
							className="echodash-button echodash-button-primary"
							onClick={onAddTrigger}
						>
							+ {__('Add Trigger', 'echodash')}
						</button>
					</div>
				) : (
					<div className="echodash-triggers__list">
						{triggers.map((trigger, index) => (
							<div
								key={trigger.id || index}
								className="echodash-trigger-item echodash-integration-item"
							>
								{/* Drag handle */}
								<span 
									className="dashicons dashicons-menu echodash-trigger-item__handle" 
								></span>

								{/* Trigger info */}
								<div className="echodash-trigger-item__info">
									<div className="echodash-trigger-item__type">{trigger.name}</div>
									<div className="echodash-trigger-item__name">
										{trigger.description || trigger.trigger || __('Trigger', 'echodash')}
									</div>
								</div>

								{/* Actions */}
								<div className="echodash-trigger-item__actions">
									<button 
										className="echodash-button"
										onClick={() => handleSendTest(trigger)}
										disabled={sendingTest === trigger.id}
									>
										{sendingTest === trigger.id ? (
											<>
												<span className="dashicons dashicons-bell ecd-ring"></span>
												Sending...
											</>
										) : sentTest === trigger.id ? (
											<>
												<span className="dashicons dashicons-bell"></span>
												Sent!
											</>
										) : (
											<>
												<span className="dashicons dashicons-bell"></span>
												Send Test
											</>
										)}
									</button>
									<button 
										className="echodash-button"
										onClick={() => onEditTrigger(trigger)}
									>
										Edit
									</button>
									<button 
										className="echodash-button"
										onClick={() => {
											if (window.confirm(__('Are you sure you want to delete the "%s" trigger? This action cannot be undone.', 'echodash').replace('%s', trigger.name || __('Untitled', 'echodash')))) {
												onDeleteTrigger(trigger);
											}
										}}
										title="Delete trigger"
									>
										<span className="dashicons dashicons-trash"></span>
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Single-item triggers section */}
			{integration.singleItemTriggers && integration.singleItemTriggers.length > 0 && (
				<div className="echodash-card echodash-single-triggers">
					<h2 className="echodash-triggers__title">Single-Item Events</h2>
					<p className="echodash-single-triggers__description">
						These events are configured on individual posts, forms, products, or courses.
					</p>
					
					{integration.singleItemTriggers.map((triggerGroup, groupIndex) => (
						<div key={`${triggerGroup.trigger}-${groupIndex}`} className="echodash-single-trigger-group">
							<h3 className="echodash-single-trigger-group__title">
								{triggerGroup.name}
							</h3>
							<p className="echodash-single-trigger-group__description">
								{triggerGroup.description}
							</p>
							
							<div className="echodash-single-triggers__list">
								{triggerGroup.items.map((item, itemIndex) => (
									<div 
										key={`${item.post_id}-${itemIndex}`}
										className="echodash-single-trigger-item echodash-integration-item"
									>
										<div className="echodash-single-trigger-item__info">
											<div className="echodash-single-trigger-item__title">
												{item.event_name || __('Untitled Event', 'echodash')}
											</div>
											<div className="echodash-single-trigger-item__post">
												{__('Configured on:', 'echodash')} <strong>{item.post_title}</strong>
											</div>
										</div>
										
										<div className="echodash-single-trigger-item__actions">
											<a 
												href={item.edit_url}
												className="echodash-button"
												target="_blank"
												rel="noopener noreferrer"
											>
												{__('Edit Item', 'echodash')} →
											</a>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
};