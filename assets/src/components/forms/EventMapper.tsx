/**
 * EventMapper Component
 * 
 * Component for mapping event properties to merge tags and static values.
 */

import React, { useState } from 'react';
import { 
	Button, 
	Flex, 
	TextControl, 
	SelectControl,
	Icon,
	Card,
	CardBody,
	CardHeader,
	Notice
} from '@wordpress/components';
import { EventMapping } from '../../types/integration';
import { clsx } from 'clsx';

interface EventMapperProps {
	/** Current mappings */
	mappings: EventMapping[];
	
	/** Called when mappings change */
	onChange: (mappings: EventMapping[]) => void;
	
	/** Available merge tag fields */
	availableFields: string[];
	
	/** Error message for the mappings */
	error?: string;
	
	/** Whether the component is disabled */
	disabled?: boolean;
}

interface MappingRowProps {
	/** The mapping object */
	mapping: EventMapping;
	
	/** Index in the mappings array */
	index: number;
	
	/** Available merge tag fields */
	availableFields: string[];
	
	/** Called when mapping changes */
	onChange: (index: number, mapping: EventMapping) => void;
	
	/** Called when mapping is removed */
	onRemove: (index: number) => void;
	
	/** Whether the row is disabled */
	disabled?: boolean;
	
	/** Whether this is the only row (can't be removed) */
	isOnlyRow?: boolean;
}

const MappingRow: React.FC<MappingRowProps> = ({
	mapping,
	index,
	availableFields,
	onChange,
	onRemove,
	disabled = false,
	isOnlyRow = false
}) => {
	const [isCustomValue, setIsCustomValue] = useState(() => {
		// Check if the value is a merge tag or custom value
		return !mapping.value.startsWith('{') || !mapping.value.endsWith('}');
	});

	const handleKeyChange = (key: string) => {
		onChange(index, { ...mapping, key });
	};

	const handleValueChange = (value: string) => {
		onChange(index, { ...mapping, value });
	};

	const handleTypeToggle = () => {
		const newIsCustomValue = !isCustomValue;
		setIsCustomValue(newIsCustomValue);
		
		// Clear value when switching types
		if (newIsCustomValue) {
			handleValueChange('');
		} else {
			handleValueChange(availableFields[0] ? `{${availableFields[0]}}` : '');
		}
	};

	const handleRemove = () => {
		onRemove(index);
	};

	const mergeTagOptions = availableFields.map(field => ({
		value: `{${field}}`,
		label: field.replace(/_/g, ' ').replace(/:/g, ' → ')
	}));

	return (
		<Card className="ecd-mapping-row" size="small">
			<CardBody>
				<Flex gap="3" align="flex-start" className="ecd-mapping-row-content">
					{/* Property Key */}
					<div className="ecd-mapping-key" style={{ minWidth: '200px' }}>
						<TextControl
							label="Property Key"
							value={mapping.key}
							onChange={handleKeyChange}
							placeholder="e.g., user_email, product_name"
							disabled={disabled}
							required
						/>
					</div>

					{/* Value Type Toggle */}
					<div className="ecd-mapping-type" style={{ minWidth: '120px' }}>
						<label className="components-base-control__label">Value Type</label>
						<Button
							variant={isCustomValue ? 'secondary' : 'primary'}
							onClick={handleTypeToggle}
							disabled={disabled}
							size="small"
						>
							{isCustomValue ? 'Custom' : 'Merge Tag'}
						</Button>
					</div>

					{/* Property Value */}
					<div className="ecd-mapping-value" style={{ minWidth: '250px' }}>
						{isCustomValue ? (
							<TextControl
								label="Custom Value"
								value={mapping.value}
								onChange={handleValueChange}
								placeholder="Enter a static value"
								disabled={disabled}
							/>
						) : (
							<SelectControl
								label="Merge Tag"
								value={mapping.value}
								options={[
									{ value: '', label: 'Select a field...' },
									...mergeTagOptions
								]}
								onChange={handleValueChange}
								disabled={disabled}
							/>
						)}
					</div>

					{/* Required Toggle */}
					<div className="ecd-mapping-required" style={{ minWidth: '80px' }}>
						<label className="components-base-control__label">Required</label>
						<Button
							variant={mapping.required ? 'primary' : 'secondary'}
							onClick={() => onChange(index, { ...mapping, required: !mapping.required })}
							disabled={disabled}
							size="small"
							className={clsx('ecd-required-toggle', {
								'is-required': mapping.required
							})}
						>
							{mapping.required ? 'Yes' : 'No'}
						</Button>
					</div>

					{/* Remove Button */}
					<div className="ecd-mapping-actions">
						<Button
							icon="trash"
							variant="tertiary"
							onClick={handleRemove}
							disabled={disabled || isOnlyRow}
							isDestructive
							size="small"
							label="Remove mapping"
						/>
					</div>
				</Flex>
			</CardBody>
		</Card>
	);
};

export const EventMapper: React.FC<EventMapperProps> = ({
	mappings,
	onChange,
	availableFields,
	error,
	disabled = false
}) => {
	const addMapping = () => {
		const newMapping: EventMapping = {
			key: '',
			value: '',
			required: false
		};
		onChange([...mappings, newMapping]);
	};

	const updateMapping = (index: number, mapping: EventMapping) => {
		const updatedMappings = [...mappings];
		updatedMappings[index] = mapping;
		onChange(updatedMappings);
	};

	const removeMapping = (index: number) => {
		if (mappings.length > 1) {
			const updatedMappings = mappings.filter((_, i) => i !== index);
			onChange(updatedMappings);
		}
	};

	// Ensure at least one mapping exists
	const effectiveMappings = mappings.length > 0 ? mappings : [{ key: '', value: '', required: false }];

	return (
		<div className="ecd-event-mapper">
			<CardHeader className="ecd-event-mapper-header">
				<Flex justify="space-between" align="center">
					<div>
						<h3>Event Properties</h3>
						<p className="description">
							Map event properties to merge tags or custom values that will be sent to EchoDash.
						</p>
					</div>
					<Button 
						variant="secondary" 
						icon="plus"
						onClick={addMapping}
						disabled={disabled}
					>
						Add Property
					</Button>
				</Flex>
			</CardHeader>

			<div className="ecd-event-mapper-content">
				{/* Available Fields Reference */}
				{availableFields.length > 0 && (
					<Card className="ecd-available-fields" size="small">
						<CardBody>
							<div className="ecd-available-fields-content">
								<strong>Available merge tags:</strong>
								<div className="ecd-merge-tags">
									{availableFields.slice(0, 10).map(field => (
										<code key={field} className="ecd-merge-tag">
											{`{${field}}`}
										</code>
									))}
									{availableFields.length > 10 && (
										<span className="ecd-more-fields">
											+{availableFields.length - 10} more
										</span>
									)}
								</div>
							</div>
						</CardBody>
					</Card>
				)}

				{/* Mapping Rows */}
				<div className="ecd-mappings-list">
					{effectiveMappings.map((mapping, index) => (
						<MappingRow
							key={index}
							mapping={mapping}
							index={index}
							availableFields={availableFields}
							onChange={updateMapping}
							onRemove={removeMapping}
							disabled={disabled}
							isOnlyRow={effectiveMappings.length === 1}
						/>
					))}
				</div>

				{/* Error Message */}
				{error && (
					<Notice status="error" isDismissible={false}>
						{error}
					</Notice>
				)}

				{/* Empty State */}
				{effectiveMappings.length === 0 && (
					<div className="ecd-empty-mappings">
						<p>No event properties configured.</p>
						<Button variant="primary" onClick={addMapping} disabled={disabled}>
							Add Your First Property
						</Button>
					</div>
				)}

				{/* Helper Text */}
				<div className="ecd-mapper-help">
					<p className="description">
						<Icon icon="info" size={16} /> 
						<strong>Tip:</strong> Use merge tags like <code>{'{user:email}'}</code> to dynamically insert data, 
						or enter custom values for static properties.
					</p>
				</div>
			</div>
		</div>
	);
};