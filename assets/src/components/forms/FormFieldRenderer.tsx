/**
 * Form Field Renderer Component
 * 
 * Renders different field types based on field configuration.
 */

import React from 'react';
import {
	TextControl,
	TextareaControl,
	SelectControl,
	CheckboxControl,
	RadioControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	BaseControl,
	Flex,
	Text
} from '@wordpress/components';
import clsx from 'clsx';

import { FormFieldProps } from '../../types/form';
import { EventMapper } from './EventMapper';

export const FormFieldRenderer: React.FC<FormFieldProps> = ({
	field,
	value,
	onChange,
	errors = [],
	touched = false,
	disabled = false,
	formData = {}
}) => {
	const hasError = errors.length > 0 && touched;
	const fieldId = `field-${field.name}`;
	
	const commonProps = {
		id: fieldId,
		disabled,
		className: clsx(
			'ecd-form-field',
			`ecd-form-field--${field.type}`,
			field.className,
			{
				'has-error': hasError,
				'is-required': field.required
			}
		)
	};

	const renderField = () => {
		switch (field.type) {
			case 'text':
				return (
					<TextControl
						{...commonProps}
						label={field.label}
						value={value || ''}
						onChange={onChange}
						placeholder={field.placeholder}
						help={field.description}
						required={field.required}
						{...field.props}
					/>
				);

			case 'textarea':
				return (
					<TextareaControl
						{...commonProps}
						label={field.label}
						value={value || ''}
						onChange={onChange}
						placeholder={field.placeholder}
						help={field.description}
						required={field.required}
						rows={field.props?.rows || 4}
						{...field.props}
					/>
				);

			case 'select':
				return (
					<SelectControl
						{...commonProps}
						label={field.label}
						value={value || ''}
						onChange={onChange}
						options={[
							{ label: field.placeholder || 'Select an option...', value: '' },
							...(field.options || [])
						]}
						help={field.description}
						required={field.required}
						{...field.props}
					/>
				);

			case 'multiselect':
				return (
					<BaseControl
						{...commonProps}
						label={field.label}
						help={field.description}
					>
						<select
							multiple
							value={Array.isArray(value) ? value : []}
							onChange={(e) => {
								const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
								onChange(selectedValues);
							}}
							className="components-select-control__input"
							disabled={disabled}
						>
							{field.options?.map(option => (
								<option 
									key={option.value} 
									value={option.value}
									disabled={option.disabled}
								>
									{option.label}
								</option>
							))}
						</select>
					</BaseControl>
				);

			case 'checkbox':
				return (
					<CheckboxControl
						{...commonProps}
						label={field.label}
						checked={!!value}
						onChange={onChange}
						help={field.description}
						required={field.required}
						{...field.props}
					/>
				);

			case 'toggle':
				return (
					<ToggleControl
						{...commonProps}
						label={field.label}
						checked={!!value}
						onChange={onChange}
						help={field.description}
						{...field.props}
					/>
				);

			case 'radio':
				return (
					<RadioControl
						{...commonProps}
						label={field.label}
						selected={value}
						onChange={onChange}
						options={field.options || []}
						help={field.description}
						{...field.props}
					/>
				);

			case 'number':
				return (
					<NumberControl
						{...commonProps}
						label={field.label}
						value={value}
						onChange={onChange}
						placeholder={field.placeholder}
						help={field.description}
						required={field.required}
						min={field.props?.min}
						max={field.props?.max}
						step={field.props?.step}
						{...field.props}
					/>
				);

			case 'email':
				return (
					<TextControl
						{...commonProps}
						type="email"
						label={field.label}
						value={value || ''}
						onChange={onChange}
						placeholder={field.placeholder}
						help={field.description}
						required={field.required}
						{...field.props}
					/>
				);

			case 'url':
				return (
					<TextControl
						{...commonProps}
						type="url"
						label={field.label}
						value={value || ''}
						onChange={onChange}
						placeholder={field.placeholder}
						help={field.description}
						required={field.required}
						{...field.props}
					/>
				);

			case 'mapping':
				return (
					<EventMapper
						mappings={value || []}
						onChange={onChange}
						availableFields={field.availableFields || []}
						label={field.label}
						description={field.description}
						required={field.required}
						disabled={disabled}
						className={field.className}
					/>
				);

			case 'conditional':
				// Render based on condition evaluation
				if (!field.conditions || field.conditions.length === 0) {
					return null;
				}
				
				// This would typically be handled at the form level
				// but we can provide a fallback here
				return (
					<div className="ecd-conditional-field">
						<Text>{field.label}</Text>
						<Text variant="muted">Conditional field - conditions not met</Text>
					</div>
				);

			default:
				console.warn(`Unknown field type: ${field.type}`);
				return (
					<TextControl
						{...commonProps}
						label={field.label}
						value={value || ''}
						onChange={onChange}
						placeholder={field.placeholder}
						help={field.description}
						required={field.required}
					/>
				);
		}
	};

	return (
		<div 
			className={clsx(
				'ecd-form-field-wrapper',
				`ecd-form-field-wrapper--${field.type}`,
				{
					[`ecd-form-field-wrapper--width-${field.width}`]: field.width
				}
			)}
		>
			{renderField()}
			
			{/* Field errors */}
			{hasError && (
				<div className="ecd-field-errors" role="alert">
					{errors.map((error, index) => (
						<Text 
							key={index}
							variant="muted" 
							className="ecd-field-error"
							size="12"
						>
							{error}
						</Text>
					))}
				</div>
			)}
		</div>
	);
};