/**
 * Form Group Component
 * 
 * Groups related form fields together with optional title and description.
 */

import React from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	VStack,
	HStack,
	Text,
	Flex
} from '@wordpress/components';
import clsx from 'clsx';

import { FormGroupProps } from '../../types/form';
import { FormFieldRenderer } from './FormFieldRenderer';

export const FormGroup: React.FC<FormGroupProps> = ({
	title,
	description,
	fields,
	formData,
	onFieldChange,
	errors,
	touched,
	layout = 'vertical'
}) => {
	if (fields.length === 0) {
		return null;
	}

	const renderFields = () => {
		if (layout === 'grid') {
			// Grid layout - responsive grid based on field width
			return (
				<div className="ecd-form-grid">
					{fields.map(field => (
						<div
							key={field.name}
							className={clsx(
								'ecd-form-grid-item',
								{
									[`ecd-form-grid-item--width-${field.width}`]: field.width
								}
							)}
							style={{
								gridColumn: field.width ? `span ${field.width}` : undefined
							}}
						>
							<FormFieldRenderer
								field={field}
								value={formData[field.name]}
								onChange={(value) => onFieldChange(field.name, value)}
								errors={errors[field.name]}
								touched={touched[field.name]}
								formData={formData}
							/>
						</div>
					))}
				</div>
			);
		}

		if (layout === 'horizontal') {
			// Horizontal layout - fields side by side
			return (
				<HStack spacing="4" alignment="top" wrap>
					{fields.map(field => (
						<div
							key={field.name}
							className="ecd-form-horizontal-item"
							style={{ flex: field.width ? `0 0 ${(field.width / 12) * 100}%` : '1' }}
						>
							<FormFieldRenderer
								field={field}
								value={formData[field.name]}
								onChange={(value) => onFieldChange(field.name, value)}
								errors={errors[field.name]}
								touched={touched[field.name]}
								formData={formData}
							/>
						</div>
					))}
				</HStack>
			);
		}

		// Default vertical layout
		return (
			<VStack spacing="4">
				{fields.map(field => (
					<FormFieldRenderer
						key={field.name}
						field={field}
						value={formData[field.name]}
						onChange={(value) => onFieldChange(field.name, value)}
						errors={errors[field.name]}
						touched={touched[field.name]}
						formData={formData}
					/>
				))}
			</VStack>
		);
	};

	return (
		<Card 
			className={clsx('ecd-form-group', `ecd-form-group--${layout}`)}
			isElevated={false}
		>
			{(title || description) && (
				<CardHeader className="ecd-form-group-header">
					{title && (
						<Text size="16" weight="600" className="ecd-form-group-title">
							{title}
						</Text>
					)}
					{description && (
						<Text variant="muted" className="ecd-form-group-description">
							{description}
						</Text>
					)}
				</CardHeader>
			)}
			
			<CardBody className="ecd-form-group-body">
				{renderFields()}
			</CardBody>
		</Card>
	);
};