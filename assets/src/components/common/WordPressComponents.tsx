/**
 * WordPress Components Integration
 * 
 * Styled WordPress components with EchoDash-specific customizations.
 */

import React from 'react';
import {
	Button as WPButton,
	Card as WPCard,
	CardBody as WPCardBody,
	CardHeader as WPCardHeader,
	Flex as WPFlex,
	TextControl as WPTextControl,
	SelectControl as WPSelectControl,
	Notice as WPNotice,
	Modal as WPModal,
	Spinner as WPSpinner,
	Icon as WPIcon,
	SearchControl as WPSearchControl,
	ToggleControl as WPToggleControl,
	ButtonProps,
	CardProps,
	TextControlProps,
	SelectControlProps,
	NoticeProps,
	ModalProps,
	IconProps,
	SearchControlProps,
	ToggleControlProps
} from '@wordpress/components';
import { clsx } from 'clsx';

/**
 * Enhanced Button with EchoDash styling
 */
export const EchoDashButton: React.FC<ButtonProps & { 
	className?: string;
	loading?: boolean;
}> = ({ 
	className, 
	loading, 
	disabled,
	children,
	...props 
}) => {
	return (
		<WPButton
			{...props}
			className={clsx('ecd-button', className, {
				'is-loading': loading
			})}
			disabled={disabled || loading}
			isBusy={loading}
		>
			{children}
		</WPButton>
	);
};

/**
 * Enhanced Card with EchoDash styling
 */
export const EchoDashCard: React.FC<CardProps & { 
	className?: string;
	children: React.ReactNode;
}> = ({ 
	className, 
	children,
	...props 
}) => {
	return (
		<WPCard
			{...props}
			className={clsx('ecd-card', className)}
		>
			{children}
		</WPCard>
	);
};

/**
 * Enhanced Card Header
 */
export const EchoDashCardHeader: React.FC<{ 
	className?: string;
	children: React.ReactNode;
}> = ({ 
	className, 
	children 
}) => {
	return (
		<WPCardHeader className={clsx('ecd-card-header', className)}>
			{children}
		</WPCardHeader>
	);
};

/**
 * Enhanced Card Body
 */
export const EchoDashCardBody: React.FC<{ 
	className?: string;
	children: React.ReactNode;
}> = ({ 
	className, 
	children 
}) => {
	return (
		<WPCardBody className={clsx('ecd-card-body', className)}>
			{children}
		</WPCardBody>
	);
};

/**
 * Enhanced TextControl with validation styling
 */
export const EchoDashTextControl: React.FC<TextControlProps & {
	error?: string;
	required?: boolean;
}> = ({ 
	error, 
	required, 
	label,
	className,
	...props 
}) => {
	const enhancedLabel = required && label ? `${label} *` : label;
	
	return (
		<div className={clsx('ecd-text-control-wrapper', {
			'has-error': !!error
		})}>
			<WPTextControl
				{...props}
				label={enhancedLabel}
				className={clsx('ecd-text-control', className, {
					'is-error': !!error
				})}
			/>
			{error && (
				<div className="ecd-field-error" role="alert">
					{error}
				</div>
			)}
		</div>
	);
};

/**
 * Enhanced SelectControl with validation styling
 */
export const EchoDashSelectControl: React.FC<SelectControlProps & {
	error?: string;
	required?: boolean;
}> = ({ 
	error, 
	required, 
	label,
	className,
	...props 
}) => {
	const enhancedLabel = required && label ? `${label} *` : label;
	
	return (
		<div className={clsx('ecd-select-control-wrapper', {
			'has-error': !!error
		})}>
			<WPSelectControl
				{...props}
				label={enhancedLabel}
				className={clsx('ecd-select-control', className, {
					'is-error': !!error
				})}
			/>
			{error && (
				<div className="ecd-field-error" role="alert">
					{error}
				</div>
			)}
		</div>
	);
};

/**
 * Enhanced Notice with EchoDash styling
 */
export const EchoDashNotice: React.FC<NoticeProps & {
	className?: string;
}> = ({ 
	className,
	...props 
}) => {
	return (
		<WPNotice
			{...props}
			className={clsx('ecd-notice', className)}
		/>
	);
};

/**
 * Enhanced Modal with EchoDash styling
 */
export const EchoDashModal: React.FC<ModalProps & {
	className?: string;
}> = ({ 
	className,
	...props 
}) => {
	return (
		<WPModal
			{...props}
			className={clsx('ecd-modal', className)}
		/>
	);
};

/**
 * Enhanced SearchControl
 */
export const EchoDashSearchControl: React.FC<SearchControlProps & {
	className?: string;
}> = ({ 
	className,
	...props 
}) => {
	return (
		<WPSearchControl
			{...props}
			className={clsx('ecd-search-control', className)}
		/>
	);
};

/**
 * Enhanced ToggleControl
 */
export const EchoDashToggleControl: React.FC<ToggleControlProps & {
	className?: string;
}> = ({ 
	className,
	...props 
}) => {
	return (
		<WPToggleControl
			{...props}
			className={clsx('ecd-toggle-control', className)}
		/>
	);
};

/**
 * Loading Spinner with EchoDash styling
 */
export const EchoDashSpinner: React.FC<{
	size?: number;
	className?: string;
}> = ({ 
	size = 20,
	className
}) => {
	return (
		<WPSpinner 
			className={clsx('ecd-spinner', className)}
			style={{ width: size, height: size }}
		/>
	);
};

/**
 * Enhanced Icon with consistent sizing
 */
export const EchoDashIcon: React.FC<IconProps & {
	className?: string;
}> = ({ 
	className,
	size = 20,
	...props 
}) => {
	return (
		<WPIcon
			{...props}
			size={size}
			className={clsx('ecd-icon', className)}
		/>
	);
};

/**
 * Enhanced Flex container
 */
export const EchoDashFlex: React.FC<{
	children: React.ReactNode;
	direction?: 'row' | 'column';
	justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
	align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
	gap?: number | string;
	wrap?: boolean;
	className?: string;
}> = ({ 
	children,
	direction = 'row',
	justify = 'flex-start',
	align = 'stretch',
	gap = 0,
	wrap = false,
	className
}) => {
	return (
		<WPFlex
			direction={direction}
			justify={justify}
			align={align}
			gap={gap}
			wrap={wrap}
			className={clsx('ecd-flex', className)}
		>
			{children}
		</WPFlex>
	);
};

/**
 * Status Badge Component
 */
export const StatusBadge: React.FC<{
	status: 'active' | 'inactive' | 'enabled' | 'disabled' | 'success' | 'error' | 'warning';
	children: React.ReactNode;
	className?: string;
}> = ({ 
	status, 
	children, 
	className 
}) => {
	return (
		<span 
			className={clsx('ecd-status-badge', `is-${status}`, className)}
			role="status"
			aria-label={`Status: ${status}`}
		>
			{children}
		</span>
	);
};

/**
 * Loading State Component
 */
export const LoadingState: React.FC<{
	message?: string;
	className?: string;
}> = ({ 
	message = 'Loading...', 
	className 
}) => {
	return (
		<div className={clsx('ecd-loading-state', className)}>
			<EchoDashFlex 
				direction="column" 
				align="center" 
				justify="center"
				gap="3"
			>
				<EchoDashSpinner size={32} />
				<p className="ecd-loading-message">{message}</p>
			</EchoDashFlex>
		</div>
	);
};

/**
 * Empty State Component
 */
export const EmptyState: React.FC<{
	title: string;
	description?: string;
	icon?: string;
	action?: React.ReactNode;
	className?: string;
}> = ({ 
	title, 
	description, 
	icon = 'admin-plugins',
	action,
	className 
}) => {
	return (
		<div className={clsx('ecd-empty-state', className)}>
			<EchoDashFlex 
				direction="column" 
				align="center" 
				justify="center"
				gap="4"
			>
				<EchoDashIcon icon={icon} size={48} className="ecd-empty-state-icon" />
				<div className="ecd-empty-state-content">
					<h3 className="ecd-empty-state-title">{title}</h3>
					{description && (
						<p className="ecd-empty-state-description">{description}</p>
					)}
				</div>
				{action && (
					<div className="ecd-empty-state-action">
						{action}
					</div>
				)}
			</EchoDashFlex>
		</div>
	);
};

/**
 * Page Header Component
 */
export const PageHeader: React.FC<{
	title: string;
	subtitle?: string;
	actions?: React.ReactNode;
	className?: string;
}> = ({ 
	title, 
	subtitle, 
	actions,
	className 
}) => {
	return (
		<div className={clsx('ecd-page-header', className)}>
			<EchoDashFlex justify="space-between" align="flex-start">
				<div className="ecd-page-header-content">
					<h1 className="ecd-page-title">{title}</h1>
					{subtitle && (
						<p className="ecd-page-subtitle">{subtitle}</p>
					)}
				</div>
				{actions && (
					<div className="ecd-page-header-actions">
						{actions}
					</div>
				)}
			</EchoDashFlex>
		</div>
	);
};