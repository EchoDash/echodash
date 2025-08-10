// Mock for @wordpress/components package

import React from 'react';

// Mock common WordPress components
export const Button = ({ children, onClick, disabled, className, ...props }) => (
	<button onClick={onClick} disabled={disabled} className={className} {...props}>
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

export const Modal = ({ isOpen, onRequestClose, title, children, className, ...props }) => {
	if (!isOpen) return null;
	
	return (
		<div className={`components-modal__overlay ${className || ''}`} {...props}>
			<div className="components-modal__content">
				{title && <div className="components-modal__header">{title}</div>}
				<div className="components-modal__body">{children}</div>
				<button onClick={onRequestClose} className="components-modal__close">
					×
				</button>
			</div>
		</div>
	);
};

export const TextControl = ({ label, value, onChange, placeholder, disabled, className, ...props }) => (
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

export const SelectControl = ({ label, value, onChange, options, disabled, className, ...props }) => (
	<div className={`components-select-control ${className || ''}`} {...props}>
		{label && <label>{label}</label>}
		<select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
			{options.map(option => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	</div>
);