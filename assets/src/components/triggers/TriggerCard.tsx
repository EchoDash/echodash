/**
 * Trigger Card Component
 * 
 * Displays individual trigger information with actions.
 */

import React, { useState, useCallback } from 'react';
import {
	Card,
	CardBody,
	Button,
	Flex,
	Text,
	Dropdown,
	MenuGroup,
	MenuItem,
	Badge,
	__experimentalSpacer as Spacer
} from '@wordpress/components';
import { Icon, moreVertical, edit, trash, visibility, visibilityOff } from '@wordpress/icons';
import clsx from 'clsx';

import { useAccessibility } from '../../hooks/useAccessibility';

export interface Trigger {
	id: string;
	name: string;
	description?: string;
	enabled: boolean;
	mappingCount: number;
	lastModified?: string;
	hasErrors?: boolean;
	errorCount?: number;
	integration?: string;
	[key: string]: any;
}

export interface TriggerCardProps {
	/** Trigger data */
	trigger: Trigger;
	
	/** Whether card is being dragged */
	isDragging?: boolean;
	
	/** Drag handle props */
	dragHandleProps?: any;
	
	/** Edit trigger callback */
	onEdit?: (trigger: Trigger) => void;
	
	/** Delete trigger callback */
	onDelete?: (trigger: Trigger) => void;
	
	/** Toggle enabled state callback */
	onToggleEnabled?: (trigger: Trigger) => void;
	
	/** View trigger details callback */
	onView?: (trigger: Trigger) => void;
	
	/** Loading state */
	loading?: boolean;
	
	/** Disabled state */
	disabled?: boolean;
	
	/** CSS class name */
	className?: string;
	
	/** Show actions menu */
	showActions?: boolean;
	
	/** Compact view */
	compact?: boolean;
}

export const TriggerCard: React.FC<TriggerCardProps> = ({
	trigger,
	isDragging = false,
	dragHandleProps,
	onEdit,
	onDelete,
	onToggleEnabled,
	onView,
	loading = false,
	disabled = false,
	className,
	showActions = true,
	compact = false
}) => {
	const { announceToScreenReader } = useAccessibility();
	const [actionsOpen, setActionsOpen] = useState(false);

	// Handle edit action
	const handleEdit = useCallback(() => {
		onEdit?.(trigger);
		setActionsOpen(false);
		announceToScreenReader(`Editing trigger: ${trigger.name}`, 'polite');
	}, [trigger, onEdit, announceToScreenReader]);

	// Handle delete action
	const handleDelete = useCallback(() => {
		if (confirm(`Are you sure you want to delete the trigger "${trigger.name}"?`)) {
			onDelete?.(trigger);
			announceToScreenReader(`Deleted trigger: ${trigger.name}`, 'polite');
		}
		setActionsOpen(false);
	}, [trigger, onDelete, announceToScreenReader]);

	// Handle toggle enabled
	const handleToggleEnabled = useCallback(() => {
		onToggleEnabled?.(trigger);
		setActionsOpen(false);
		const status = trigger.enabled ? 'disabled' : 'enabled';
		announceToScreenReader(`Trigger ${trigger.name} ${status}`, 'polite');
	}, [trigger, onToggleEnabled, announceToScreenReader]);

	// Handle view action
	const handleView = useCallback(() => {
		onView?.(trigger);
		setActionsOpen(false);
		announceToScreenReader(`Viewing trigger: ${trigger.name}`, 'polite');
	}, [trigger, onView, announceToScreenReader]);

	// Format last modified date
	const formatLastModified = (dateString?: string) => {
		if (!dateString) return 'Never';
		
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 1) return 'Today';
		if (diffDays === 2) return 'Yesterday';
		if (diffDays <= 7) return `${diffDays} days ago`;
		
		return date.toLocaleDateString();
	};

	return (
		<Card
			className={clsx(
				'ecd-trigger-card',
				className,
				{
					'is-dragging': isDragging,
					'is-disabled': disabled || loading,
					'is-enabled': trigger.enabled,
					'has-errors': trigger.hasErrors,
					'is-compact': compact
				}
			)}
			isElevated={!isDragging}
			{...dragHandleProps}
		>
			<CardBody>
				<Flex justify="space-between" align="flex-start" gap="3">
					{/* Main content */}
					<Flex direction="column" gap="2" className="trigger-main-content">
						{/* Title and status */}
						<Flex align="center" gap="2" wrap>
							<Text 
								weight="600" 
								size={compact ? "14" : "16"}
								className="trigger-name"
							>
								{trigger.name}
							</Text>
							
							{/* Status badges */}
							<Flex gap="1">
								{!trigger.enabled && (
									<Badge className="status-badge status-disabled">
										Disabled
									</Badge>
								)}
								
								{trigger.hasErrors && (
									<Badge className="status-badge status-error">
										{trigger.errorCount || 1} Error{(trigger.errorCount || 1) > 1 ? 's' : ''}
									</Badge>
								)}
								
								{trigger.enabled && !trigger.hasErrors && (
									<Badge className="status-badge status-active">
										Active
									</Badge>
								)}
							</Flex>
						</Flex>

						{/* Description */}
						{trigger.description && !compact && (
							<Text variant="muted" size="13" className="trigger-description">
								{trigger.description}
							</Text>
						)}

						{/* Metadata */}
						<Flex align="center" gap="4" wrap className="trigger-metadata">
							<Text variant="muted" size="12">
								{trigger.mappingCount} propert{trigger.mappingCount === 1 ? 'y' : 'ies'}
							</Text>
							
							{!compact && (
								<Text variant="muted" size="12">
									Modified: {formatLastModified(trigger.lastModified)}
								</Text>
							)}
							
							{trigger.integration && !compact && (
								<Text variant="muted" size="12">
									Integration: {trigger.integration}
								</Text>
							)}
						</Flex>
					</Flex>

					{/* Actions */}
					{showActions && (
						<Flex gap="1" className="trigger-actions">
							{/* Enable/Disable toggle */}
							<Button
								variant="tertiary"
								size="small"
								icon={trigger.enabled ? visibility : visibilityOff}
								onClick={handleToggleEnabled}
								disabled={disabled || loading}
								label={trigger.enabled ? 'Disable trigger' : 'Enable trigger'}
								className={clsx('toggle-button', {
									'is-enabled': trigger.enabled
								})}
							/>

							{/* Quick edit */}
							{onEdit && (
								<Button
									variant="tertiary"
									size="small"
									icon={edit}
									onClick={handleEdit}
									disabled={disabled || loading}
									label="Edit trigger"
								/>
							)}

							{/* More actions */}
							<Dropdown
								className="trigger-actions-dropdown"
								contentClassName="trigger-actions-menu"
								position="bottom left"
								renderToggle={({ isOpen, onToggle }) => (
									<Button
										variant="tertiary"
										size="small"
										icon={moreVertical}
										onClick={onToggle}
										aria-expanded={isOpen}
										disabled={disabled || loading}
										label="More actions"
									/>
								)}
								renderContent={({ onClose }) => (
									<MenuGroup>
										{onView && (
											<MenuItem 
												icon={visibility}
												onClick={() => {
													handleView();
													onClose();
												}}
											>
												View Details
											</MenuItem>
										)}
										
										{onEdit && (
											<MenuItem 
												icon={edit}
												onClick={() => {
													handleEdit();
													onClose();
												}}
											>
												Edit Trigger
											</MenuItem>
										)}
										
										<MenuItem 
											icon={trigger.enabled ? visibilityOff : visibility}
											onClick={() => {
												handleToggleEnabled();
												onClose();
											}}
										>
											{trigger.enabled ? 'Disable' : 'Enable'} Trigger
										</MenuItem>
										
										{onDelete && (
											<MenuItem 
												icon={trash}
												onClick={() => {
													handleDelete();
													onClose();
												}}
												className="delete-item"
											>
												Delete Trigger
											</MenuItem>
										)}
									</MenuGroup>
								)}
							/>
						</Flex>
					)}
				</Flex>

				{/* Error details */}
				{trigger.hasErrors && !compact && (
					<>
						<Spacer marginY="2" />
						<div className="trigger-errors">
							<Text size="12" className="error-summary">
								⚠️ This trigger has validation errors that need to be resolved.
							</Text>
						</div>
					</>
				)}
			</CardBody>
		</Card>
	);
};