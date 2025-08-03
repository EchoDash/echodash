/**
 * Simple Trigger Modal Component
 * 
 * A simplified modal for testing trigger creation
 */

import React, { useState, useEffect } from 'react';
import {
	Modal,
	Button,
	Flex,
	Notice,
	SelectControl,
	TextControl,
	ToggleControl
} from '@wordpress/components';

interface SimpleTriggerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: any) => void;
	availableTriggers: any[];
}

interface KeyValuePair {
	key: string;
	value: string;
}

export const SimpleTriggerModal: React.FC<SimpleTriggerModalProps> = ({
	isOpen,
	onClose,
	onSave,
	availableTriggers = []
}) => {
	const [triggerType, setTriggerType] = useState('');
	const [enabled, setEnabled] = useState(true);
	const [error, setError] = useState('');
	const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([
		{ key: '', value: '' }
	]);

	// Update key-value pairs when trigger type changes
	useEffect(() => {
		console.log('useEffect triggered, triggerType:', triggerType);
		console.log('Available triggers:', availableTriggers);
		
		if (triggerType) {
			const selectedTrigger = availableTriggers.find(t => t.id === triggerType);
			console.log('Selected trigger:', selectedTrigger);
			
			if (selectedTrigger?.defaultEvent) {
				
				// Set default mappings
				if (selectedTrigger.defaultEvent.mappings) {
					const pairs = Object.entries(selectedTrigger.defaultEvent.mappings).map(([key, value]) => ({
						key,
						value: value as string
					}));
					console.log('Setting key-value pairs:', pairs);
					setKeyValuePairs(pairs.length > 0 ? pairs : [{ key: '', value: '' }]);
				}
			}
		}
	}, [triggerType, availableTriggers]);

	const handleSave = () => {
		// Validation
		if (!triggerType) {
			setError('Please select a trigger type');
			return;
		}

		// Create trigger data with mappings
		const mappings = keyValuePairs
			.filter(pair => pair.key && pair.value)
			.reduce((acc, pair) => {
				acc[pair.key] = pair.value;
				return acc;
			}, {} as Record<string, string>);

		// Save the trigger
		onSave({
			id: triggerType,
			trigger_type: triggerType,
			enabled,
			mappings
		});

		// Reset form
		setTriggerType('');
		setEnabled(true);
		setError('');
		setKeyValuePairs([{ key: '', value: '' }]);
	};

	const updateKeyValuePair = (index: number, field: 'key' | 'value', value: string) => {
		const newPairs = [...keyValuePairs];
		newPairs[index][field] = value;
		setKeyValuePairs(newPairs);
	};

	const addKeyValuePair = () => {
		setKeyValuePairs([...keyValuePairs, { key: '', value: '' }]);
	};

	const removeKeyValuePair = (index: number) => {
		const newPairs = keyValuePairs.filter((_, i) => i !== index);
		setKeyValuePairs(newPairs.length > 0 ? newPairs : [{ key: '', value: '' }]);
	};

	if (!isOpen) return null;

	return (
		<Modal
			title="Add New Trigger"
			onRequestClose={onClose}
			className="echodash-trigger-modal"
			shouldCloseOnClickOutside={false}
		>
			<div className="modal-content">
				{error && (
					<Notice status="error" isDismissible={false}>
						{error}
					</Notice>
				)}

				<SelectControl
					label="Trigger Type"
					value={triggerType}
					options={[
						{ label: 'Select a trigger type...', value: '' },
						...availableTriggers.map(trigger => ({
							label: trigger.name,
							value: trigger.id
						}))
					]}
					onChange={(value) => {
						setTriggerType(value);
						console.log('Selected trigger:', value);
					}}
					help="Select the type of trigger to create"
				/>

				<ToggleControl
					label="Enabled"
					checked={enabled}
					onChange={setEnabled}
					help="Enable or disable this trigger"
				/>

				{/* Key-Value Pairs Section */}
				<div style={{ marginTop: '20px' }}>
					<h3 style={{ marginBottom: '10px' }}>Payload</h3>
					<p style={{ marginBottom: '10px', color: '#666' }}>
						Configure the data to send when this trigger fires.
					</p>
					
					{keyValuePairs.map((pair, index) => (
						<Flex key={index} gap={2} style={{ marginBottom: '10px' }}>
							<TextControl
								label={index === 0 ? "Key" : ""}
								value={pair.key}
								onChange={(value) => updateKeyValuePair(index, 'key', value)}
								placeholder="Key"
								style={{ flex: 1 }}
							/>
							<TextControl
								label={index === 0 ? "Value" : ""}
								value={pair.value}
								onChange={(value) => updateKeyValuePair(index, 'value', value)}
								placeholder="Value"
								style={{ flex: 1 }}
							/>
							<div style={{ marginTop: index === 0 ? '25px' : '0' }}>
								<Button
									icon="plus"
									label="Add"
									onClick={addKeyValuePair}
									isSmall
								/>
								{keyValuePairs.length > 1 && (
									<Button
										icon="minus"
										label="Remove"
										onClick={() => removeKeyValuePair(index)}
										isSmall
										isDestructive
										style={{ marginLeft: '5px' }}
									/>
								)}
							</div>
						</Flex>
					))}
				</div>

				<div style={{ marginTop: '20px' }} />

				<Flex justify="flex-end" gap={3}>
					<Button variant="tertiary" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleSave}>
						Save Trigger
					</Button>
				</Flex>
			</div>
		</Modal>
	);
};