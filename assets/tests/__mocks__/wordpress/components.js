/**
 * WordPress Components Mock
 * 
 * Mock implementation of @wordpress/components for testing.
 */

import React from 'react';

// Mock all WordPress components as simple divs with appropriate props
const createMockComponent = (name) => {
	const MockComponent = React.forwardRef(({ children, className, ...props }, ref) => {
		return React.createElement(
			'div',
			{
				ref,
				'data-testid': `wp-${name.toLowerCase()}`,
				className: `components-${name.toLowerCase()} ${className || ''}`.trim(),
				...props,
			},
			children
		);
	});
	
	MockComponent.displayName = `Mock${name}`;
	return MockComponent;
};

// Mock specific components with custom behavior
const Button = React.forwardRef(({ children, variant, isPressed, isPrimary, isSecondary, isTertiary, ...props }, ref) => {
	const classes = [
		'components-button',
		variant && `is-${variant}`,
		isPrimary && 'is-primary',
		isSecondary && 'is-secondary', 
		isTertiary && 'is-tertiary',
		isPressed && 'is-pressed',
	].filter(Boolean).join(' ');
	
	return React.createElement(
		'button',
		{
			ref,
			'data-testid': 'wp-button',
			className: classes,
			type: 'button',
			...props,
		},
		children
	);
});

const TextControl = React.forwardRef(({ label, value, onChange, ...props }, ref) => {
	return React.createElement(
		'div',
		{ className: 'components-base-control' },
		label && React.createElement('label', { className: 'components-base-control__label' }, label),
		React.createElement('input', {
			ref,
			'data-testid': 'wp-text-control',
			className: 'components-text-control__input',
			type: 'text',
			value: value || '',
			onChange: (e) => onChange && onChange(e.target.value),
			...props,
		})
	);
});

const SelectControl = React.forwardRef(({ label, value, options = [], onChange, ...props }, ref) => {
	return React.createElement(
		'div',
		{ className: 'components-base-control' },
		label && React.createElement('label', { className: 'components-base-control__label' }, label),
		React.createElement(
			'select',
			{
				ref,
				'data-testid': 'wp-select-control',
				className: 'components-select-control__input',
				value: value || '',
				onChange: (e) => onChange && onChange(e.target.value),
				...props,
			},
			options.map(option => 
				React.createElement(
					'option',
					{ key: option.value, value: option.value },
					option.label
				)
			)
		)
	);
});

const CheckboxControl = React.forwardRef(({ label, checked, onChange, ...props }, ref) => {
	return React.createElement(
		'div',
		{ className: 'components-base-control' },
		React.createElement('input', {
			ref,
			'data-testid': 'wp-checkbox-control',
			className: 'components-checkbox-control__input',
			type: 'checkbox',
			checked: checked || false,
			onChange: (e) => onChange && onChange(e.target.checked),
			...props,
		}),
		label && React.createElement('label', { className: 'components-checkbox-control__label' }, label)
	);
});

const Spinner = () => React.createElement('div', { 
	'data-testid': 'wp-spinner',
	className: 'components-spinner' 
});

// Export all components
module.exports = {
	Button,
	Card: createMockComponent('Card'),
	CardBody: createMockComponent('CardBody'),
	CardHeader: createMockComponent('CardHeader'),
	CardFooter: createMockComponent('CardFooter'),
	Panel: createMockComponent('Panel'),
	PanelBody: createMockComponent('PanelBody'),
	PanelHeader: createMockComponent('PanelHeader'),
	Flex: createMockComponent('Flex'),
	FlexItem: createMockComponent('FlexItem'),
	FlexBlock: createMockComponent('FlexBlock'),
	Text: createMockComponent('Text'),
	Heading: createMockComponent('Heading'),
	TextControl,
	SelectControl,
	CheckboxControl,
	TextareaControl: createMockComponent('TextareaControl'),
	ToggleControl: createMockComponent('ToggleControl'),
	RadioControl: createMockComponent('RadioControl'),
	RangeControl: createMockComponent('RangeControl'),
	Modal: createMockComponent('Modal'),
	Notice: createMockComponent('Notice'),
	Spinner,
	Icon: createMockComponent('Icon'),
	Dashicon: createMockComponent('Dashicon'),
	Tooltip: createMockComponent('Tooltip'),
	Popover: createMockComponent('Popover'),
	Dropdown: createMockComponent('Dropdown'),
	MenuGroup: createMockComponent('MenuGroup'),
	MenuItem: createMockComponent('MenuItem'),
	NavigableMenu: createMockComponent('NavigableMenu'),
	TabPanel: createMockComponent('TabPanel'),
	__experimentalSpacer: createMockComponent('Spacer'),
};