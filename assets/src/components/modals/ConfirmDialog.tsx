/**
 * Confirmation Dialog Component
 * 
 * Reusable confirmation dialog with customizable actions and styling.
 */

import React, { useCallback, useEffect } from 'react';
import {
	Modal,
	Button,
	Flex,
	Text,
	__experimentalSpacer as Spacer
} from '@wordpress/components';
import { Icon, warning } from '@wordpress/icons';
import clsx from 'clsx';

import { useAccessibility } from '../../hooks/useAccessibility';
import { useFocusManagement } from '../../hooks/useAccessibility';

export interface ConfirmDialogProps {
	/** Whether dialog is open */
	isOpen: boolean;
	
	/** Dialog title */
	title: string;
	
	/** Dialog message */
	message: string;
	
	/** Type of confirmation (affects styling and icon) */
	type?: 'danger' | 'warning' | 'info';
	
	/** Confirm button text */
	confirmText?: string;
	
	/** Cancel button text */
	cancelText?: string;
	
	/** Loading state for confirm action */
	loading?: boolean;
	
	/** Whether dialog can be dismissed */
	dismissible?: boolean;
	
	/** Confirm callback */
	onConfirm: () => void | Promise<void>;
	
	/** Cancel/close callback */
	onCancel: () => void;
	
	/** CSS class name */
	className?: string;
	
	/** Additional details to show */
	details?: string;
	
	/** Custom icon */
	icon?: React.ComponentType;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
	isOpen,
	title,
	message,
	type = 'warning',
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	loading = false,
	dismissible = true,
	onConfirm,
	onCancel,
	className,
	details,
	icon: CustomIcon
}) => {
	const { announceToScreenReader } = useAccessibility();
	const { saveFocus, restoreFocus } = useFocusManagement();

	// Handle confirm action
	const handleConfirm = useCallback(async () => {
		try {
			await onConfirm();
			announceToScreenReader('Action confirmed', 'polite');
		} catch (error) {
			console.error('Confirm action failed:', error);
			announceToScreenReader('Action failed', 'assertive');
		}
	}, [onConfirm, announceToScreenReader]);

	// Handle cancel action
	const handleCancel = useCallback(() => {
		onCancel();
		announceToScreenReader('Action cancelled', 'polite');
		restoreFocus();
	}, [onCancel, announceToScreenReader, restoreFocus]);

	// Handle escape key
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (e.key === 'Escape' && dismissible && !loading) {
			handleCancel();
		}
	}, [dismissible, loading, handleCancel]);

	// Set up event listeners and focus management
	useEffect(() => {
		if (isOpen) {
			saveFocus();
			document.addEventListener('keydown', handleKeyDown);
			
			// Announce dialog opening
			announceToScreenReader(`Confirmation dialog: ${title}`, 'assertive');
			
			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [isOpen, title, handleKeyDown, saveFocus, announceToScreenReader]);

	// Get icon based on type
	const getIcon = () => {
		if (CustomIcon) {
			return CustomIcon;
		}
		
		switch (type) {
			case 'danger':
				return warning;
			case 'warning':
				return warning;
			case 'info':
			default:
				return warning;
		}
	};

	// Get button variant based on type
	const getConfirmVariant = () => {
		switch (type) {
			case 'danger':
				return 'primary'; // Will be styled as destructive
			case 'warning':
				return 'primary';
			case 'info':
			default:
				return 'primary';
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Modal
			title=""
			onRequestClose={dismissible && !loading ? handleCancel : undefined}
			className={clsx(
				'ecd-confirm-dialog',
				`ecd-confirm-dialog--${type}`,
				className
			)}
			isDismissible={dismissible && !loading}
			shouldCloseOnClickOutside={dismissible && !loading}
			shouldCloseOnEsc={dismissible && !loading}
		>
			<div className="ecd-confirm-content">
				{/* Header with icon */}
				<Flex align="center" gap="3" className="confirm-header">
					<div className={clsx('confirm-icon', `confirm-icon--${type}`)}>
						<Icon icon={getIcon()} size={24} />
					</div>
					
					<Text size="18" weight="600" className="confirm-title">
						{title}
					</Text>
				</Flex>

				<Spacer marginY="4" />

				{/* Message */}
				<div className="confirm-message">
					<Text size="14" className="message-text">
						{message}
					</Text>
					
					{details && (
						<>
							<Spacer marginY="2" />
							<Text size="13" variant="muted" className="message-details">
								{details}
							</Text>
						</>
					)}
				</div>

				<Spacer marginY="5" />

				{/* Actions */}
				<Flex justify="flex-end" gap="3" className="confirm-actions">
					<Button
						variant="tertiary"
						onClick={handleCancel}
						disabled={loading}
						className="cancel-button"
					>
						{cancelText}
					</Button>
					
					<Button
						variant={getConfirmVariant()}
						onClick={handleConfirm}
						disabled={loading}
						className={clsx('confirm-button', {
							'is-destructive': type === 'danger',
							'is-loading': loading
						})}
					>
						{loading ? 'Processing...' : confirmText}
					</Button>
				</Flex>
			</div>
		</Modal>
	);
};

// Hook for using confirmation dialogs
export const useConfirmDialog = () => {
	const [dialogState, setDialogState] = React.useState<{
		isOpen: boolean;
		props: Partial<ConfirmDialogProps>;
	}>({
		isOpen: false,
		props: {}
	});

	const showConfirm = useCallback((props: Omit<ConfirmDialogProps, 'isOpen' | 'onCancel'>) => {
		return new Promise<boolean>((resolve) => {
			setDialogState({
				isOpen: true,
				props: {
					...props,
					onConfirm: async () => {
						await props.onConfirm();
						setDialogState(prev => ({ ...prev, isOpen: false }));
						resolve(true);
					}
				}
			});
		});
	}, []);

	const hideConfirm = useCallback(() => {
		setDialogState(prev => ({ ...prev, isOpen: false }));
	}, []);

	const ConfirmDialogComponent = useCallback(() => {
		if (!dialogState.isOpen) {
			return null;
		}

		return (
			<ConfirmDialog
				{...dialogState.props as ConfirmDialogProps}
				isOpen={dialogState.isOpen}
				onCancel={hideConfirm}
			/>
		);
	}, [dialogState, hideConfirm]);

	return {
		showConfirm,
		hideConfirm,
		ConfirmDialog: ConfirmDialogComponent
	};
};