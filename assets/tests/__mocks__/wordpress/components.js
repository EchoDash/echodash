// Mock for @wordpress/components package

import React from 'react';

// Mock common WordPress components
export const Button = ({
	children,
	onClick,
	disabled,
	className,
	...props
}) => (
	<button
		onClick={onClick}
		disabled={disabled}
		className={className}
		{...props}
	>
		{children}
	</button>
);

export const Card = ({ children, className, ...props }) => (
	<div className={`components-card ${className || ''}`} {...props}>
		{children}
	</div>
);

export const CardHeader = ({ children, className, ...props }) => (
	<div className={`components-card-header ${className || ''}`} {...props}>
		{children}
	</div>
);

export const CardBody = ({ children, className, ...props }) => (
	<div className={`components-card-body ${className || ''}`} {...props}>
		{children}
	</div>
);

export const Modal = ({
	isOpen,
	onRequestClose,
	title,
	children,
	className,
	...props
}) => {
	if (!isOpen) return null;

	return (
		<div
			className={`components-modal__overlay ${className || ''}`}
			{...props}
		>
			<div
				className="components-modal__content"
				role="dialog"
				aria-modal="true"
				tabIndex={-1}
			>
				{title && (
					<div className="components-modal__header">{title}</div>
				)}
				<div className="components-modal__body">{children}</div>
				<button
					onClick={onRequestClose}
					className="components-modal__close"
					aria-label="Close"
				>
					×
				</button>
			</div>
		</div>
	);
};

export const TextControl = ({
	label,
	value,
	onChange,
	placeholder,
	disabled,
	className,
	...props
}) => (
	<div className={`components-text-control ${className || ''}`} {...props}>
		{label && <label>{label}</label>}
		<input
			type="text"
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={placeholder}
			disabled={disabled}
		/>
	</div>
);

export const SelectControl = ({
	label,
	value,
	onChange,
	options = [],
	disabled,
	className,
	...props
}) => (
	<div className={`components-select-control ${className || ''}`} {...props}>
		{label && <label>{label}</label>}
		<select
			value={value}
			onChange={e => onChange(e.target.value)}
			disabled={disabled}
		>
			{options.map(option => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	</div>
);

export const TextareaControl = ({
	label,
	value,
	onChange,
	placeholder,
	disabled,
	className,
	rows = 3,
	...props
}) => (
	<div
		className={`components-textarea-control ${className || ''}`}
		{...props}
	>
		{label && <label>{label}</label>}
		<textarea
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={placeholder}
			disabled={disabled}
			rows={rows}
		/>
	</div>
);

export const CheckboxControl = ({
	label,
	checked,
	onChange,
	disabled,
	className,
	...props
}) => (
	<div
		className={`components-checkbox-control ${className || ''}`}
		{...props}
	>
		<input
			type="checkbox"
			checked={checked}
			onChange={e => onChange(e.target.checked)}
			disabled={disabled}
		/>
		{label && <label>{label}</label>}
	</div>
);

export const Panel = ({ children, className, ...props }) => (
	<div className={`components-panel ${className || ''}`} {...props}>
		{children}
	</div>
);

export const PanelBody = ({ title, children, className, ...props }) => (
	<div className={`components-panel-body ${className || ''}`} {...props}>
		{title && <div className="components-panel-body__title">{title}</div>}
		<div className="components-panel-body__content">{children}</div>
	</div>
);

export const PanelHeader = ({ children, className, ...props }) => (
	<div className={`components-panel-header ${className || ''}`} {...props}>
		{children}
	</div>
);

export const Notice = ({
	status = 'info',
	children,
	onRemove,
	isDismissible = true,
	className,
	...props
}) => (
	<div
		className={`components-notice is-${status} ${className || ''}`}
		{...props}
	>
		<div className="components-notice__content">{children}</div>
		{isDismissible && onRemove && (
			<button onClick={onRemove} className="components-notice__dismiss">
				×
			</button>
		)}
	</div>
);

export const Spinner = ({ className, ...props }) => (
	<div className={`components-spinner ${className || ''}`} {...props} />
);

export const Flex = ({
	children,
	className,
	justify,
	align,
	direction = 'row',
	...props
}) => (
	<div
		className={`components-flex ${className || ''}`}
		style={{
			display: 'flex',
			flexDirection: direction,
			justifyContent: justify,
			alignItems: align,
		}}
		{...props}
	>
		{children}
	</div>
);

export const FlexItem = ({ children, className, ...props }) => (
	<div className={`components-flex__item ${className || ''}`} {...props}>
		{children}
	</div>
);

export const FlexBlock = ({ children, className, ...props }) => (
	<div className={`components-flex__block ${className || ''}`} {...props}>
		{children}
	</div>
);
