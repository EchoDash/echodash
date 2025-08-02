/**
 * Notification System Component
 * 
 * Provides toast notifications with different types and auto-dismiss functionality.
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import {
	Notice,
	Button,
	Flex,
	Text,
	__experimentalSpacer as Spacer
} from '@wordpress/components';
import { Icon, check, info, warning, closeSmall } from '@wordpress/icons';
import clsx from 'clsx';

import { useAccessibility } from '../../hooks/useAccessibility';

export interface Notification {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title?: string;
	message: string;
	duration?: number; // in milliseconds, 0 means no auto-dismiss
	dismissible?: boolean;
	actions?: NotificationAction[];
	persistent?: boolean;
}

export interface NotificationAction {
	label: string;
	onClick: () => void;
	variant?: 'primary' | 'secondary' | 'tertiary';
}

interface NotificationContextValue {
	notifications: Notification[];
	addNotification: (notification: Omit<Notification, 'id'>) => string;
	removeNotification: (id: string) => void;
	clearAllNotifications: () => void;
	showSuccess: (message: string, options?: Partial<Notification>) => string;
	showError: (message: string, options?: Partial<Notification>) => string;
	showWarning: (message: string, options?: Partial<Notification>) => string;
	showInfo: (message: string, options?: Partial<Notification>) => string;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = (): NotificationContextValue => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotifications must be used within a NotificationProvider');
	}
	return context;
};

export interface NotificationProviderProps {
	children: React.ReactNode;
	maxNotifications?: number;
	defaultDuration?: number;
	position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
	children,
	maxNotifications = 5,
	defaultDuration = 5000,
	position = 'top-right'
}) => {
	const { announceToScreenReader } = useAccessibility();
	const [notifications, setNotifications] = useState<Notification[]>([]);

	// Generate unique ID
	const generateId = useCallback(() => {
		return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}, []);

	// Add notification
	const addNotification = useCallback((notificationData: Omit<Notification, 'id'>): string => {
		const id = generateId();
		const notification: Notification = {
			id,
			duration: defaultDuration,
			dismissible: true,
			...notificationData
		};

		setNotifications(prev => {
			const newNotifications = [notification, ...prev];
			
			// Limit number of notifications
			if (newNotifications.length > maxNotifications) {
				return newNotifications.slice(0, maxNotifications);
			}
			
			return newNotifications;
		});

		// Announce to screen readers
		const urgency = notification.type === 'error' ? 'assertive' : 'polite';
		const typeLabel = notification.type === 'error' ? 'Error' : 
						 notification.type === 'warning' ? 'Warning' :
						 notification.type === 'success' ? 'Success' : 'Information';
		
		announceToScreenReader(
			`${typeLabel}: ${notification.title || notification.message}`,
			urgency
		);

		return id;
	}, [generateId, defaultDuration, maxNotifications, announceToScreenReader]);

	// Remove notification
	const removeNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id));
	}, []);

	// Clear all notifications
	const clearAllNotifications = useCallback(() => {
		setNotifications([]);
	}, []);

	// Convenience methods
	const showSuccess = useCallback((message: string, options?: Partial<Notification>) => {
		return addNotification({ ...options, message, type: 'success' });
	}, [addNotification]);

	const showError = useCallback((message: string, options?: Partial<Notification>) => {
		return addNotification({ ...options, message, type: 'error', duration: 0 }); // Errors don't auto-dismiss
	}, [addNotification]);

	const showWarning = useCallback((message: string, options?: Partial<Notification>) => {
		return addNotification({ ...options, message, type: 'warning' });
	}, [addNotification]);

	const showInfo = useCallback((message: string, options?: Partial<Notification>) => {
		return addNotification({ ...options, message, type: 'info' });
	}, [addNotification]);

	const contextValue: NotificationContextValue = {
		notifications,
		addNotification,
		removeNotification,
		clearAllNotifications,
		showSuccess,
		showError,
		showWarning,
		showInfo
	};

	return (
		<NotificationContext.Provider value={contextValue}>
			{children}
			<NotificationContainer position={position} />
		</NotificationContext.Provider>
	);
};

interface NotificationContainerProps {
	position: string;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ position }) => {
	const { notifications, removeNotification } = useNotifications();

	return (
		<div 
			className={clsx('ecd-notifications-container', `ecd-notifications--${position}`)}
			role="region"
			aria-label="Notifications"
			aria-live="polite"
		>
			{notifications.map(notification => (
				<NotificationItem
					key={notification.id}
					notification={notification}
					onRemove={() => removeNotification(notification.id)}
				/>
			))}
		</div>
	);
};

interface NotificationItemProps {
	notification: Notification;
	onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
	const [isVisible, setIsVisible] = useState(false);
	const [isExiting, setIsExiting] = useState(false);

	// Handle auto-dismiss
	useEffect(() => {
		if (notification.duration && notification.duration > 0) {
			const timer = setTimeout(() => {
				handleRemove();
			}, notification.duration);

			return () => clearTimeout(timer);
		}
	}, [notification.duration]);

	// Handle entrance animation
	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), 10);
		return () => clearTimeout(timer);
	}, []);

	// Handle remove with exit animation
	const handleRemove = useCallback(() => {
		setIsExiting(true);
		setTimeout(() => {
			onRemove();
		}, 300); // Match CSS transition duration
	}, [onRemove]);

	// Get icon for notification type
	const getIcon = () => {
		switch (notification.type) {
			case 'success':
				return check;
			case 'error':
				return closeSmall;
			case 'warning':
				return warning;
			case 'info':
			default:
				return info;
		}
	};

	return (
		<div
			className={clsx(
				'ecd-notification',
				`ecd-notification--${notification.type}`,
				{
					'is-visible': isVisible,
					'is-exiting': isExiting
				}
			)}
			role="alert"
			aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
		>
			<Notice
				status={notification.type}
				isDismissible={false}
				className="notification-notice"
			>
				<Flex gap="3" align="flex-start">
					{/* Icon */}
					<div className="notification-icon">
						<Icon icon={getIcon()} size={20} />
					</div>

					{/* Content */}
					<div className="notification-content">
						{notification.title && (
							<Text weight="600" className="notification-title">
								{notification.title}
							</Text>
						)}
						
						<Text className="notification-message">
							{notification.message}
						</Text>

						{/* Actions */}
						{notification.actions && notification.actions.length > 0 && (
							<>
								<Spacer marginY="2" />
								<Flex gap="2" className="notification-actions">
									{notification.actions.map((action, index) => (
										<Button
											key={index}
											variant={action.variant || 'tertiary'}
											size="small"
											onClick={() => {
												action.onClick();
												if (!notification.persistent) {
													handleRemove();
												}
											}}
										>
											{action.label}
										</Button>
									))}
								</Flex>
							</>
						)}
					</div>

					{/* Dismiss button */}
					{notification.dismissible && (
						<Button
							variant="tertiary"
							size="small"
							icon={closeSmall}
							onClick={handleRemove}
							className="notification-dismiss"
							label="Dismiss notification"
						/>
					)}
				</Flex>
			</Notice>
		</div>
	);
};

export { NotificationSystem } from './NotificationSystem';

// Export default convenience hook
export default useNotifications;