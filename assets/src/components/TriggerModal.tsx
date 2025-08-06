/**
 * Trigger Modal Component
 * 
 * Modal for adding/editing triggers matching the mockup design
 */

import React, { useState, useRef, useEffect } from 'react';
import { MergeTagSelector } from './MergeTagSelector';
import './TriggerModal.css';

interface MergeTagOption {
	meta: string;
	preview: string | number;
	placeholder: string;
}

interface MergeTagGroup {
	name: string;
	type: string;
	options: MergeTagOption[];
}

interface Integration {
	slug: string;
	name: string;
	availableTriggers?: Array<{
		id: string;
		name: string;
		description?: string;
		defaultEvent?: any;
		options?: MergeTagGroup[];
	}>;
}

interface TriggerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: any) => void;
	integration: Integration;
}

interface KeyValuePair {
	key: string;
	value: string;
}

export const TriggerModal: React.FC<TriggerModalProps> = ({
	isOpen,
	onClose,
	onSave,
	integration,
}) => {
	const availableTriggers = integration.availableTriggers || [
		{ id: 'form_submitted', name: 'Form Submitted', description: 'Triggered each time a form is submitted.' }
	];

	// Auto-select first trigger and initialize state based on it
	const firstTrigger = availableTriggers[0];
	const [selectedTrigger, setSelectedTrigger] = useState(firstTrigger?.id || '');
	const [eventName, setEventName] = useState(firstTrigger?.defaultEvent?.name || firstTrigger?.name || '');
	
	// Initialize key-value pairs from defaultEvent.mappings or use fallback
	const getInitialKeyValuePairs = () => {
		if (firstTrigger?.defaultEvent?.mappings && typeof firstTrigger.defaultEvent.mappings === 'object') {
			// Convert mappings object to key-value pairs
			const pairs = Object.entries(firstTrigger.defaultEvent.mappings).map(([key, value]) => ({
				key,
				value: String(value)
			}));
			// Add empty row at the end
			pairs.push({ key: '', value: '' });
			return pairs;
		}
		// Fallback to default pairs
		return [
			{ key: 'user_name', value: '{user_name}' },
			{ key: 'user_id', value: '{user_id}' },
			{ key: '', value: '' }
		];
	};

	const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>(getInitialKeyValuePairs());
	const [sendTest, setSendTest] = useState(false);
	const [openDropdownIndex, setOpenDropdownIndex] = useState<{type: 'name' | 'value', index: number} | null>(null);
	
	// Refs for merge tag buttons
	const nameButtonRef = useRef<HTMLButtonElement>(null);
	const valueButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

	// Initialize refs array when keyValuePairs change
	useEffect(() => {
		valueButtonRefs.current = valueButtonRefs.current.slice(0, keyValuePairs.length);
	}, [keyValuePairs.length]);

	if (!isOpen) return null;

	const handleTriggerChange = (triggerId: string) => {
		setSelectedTrigger(triggerId);
		const trigger = availableTriggers.find(t => t.id === triggerId);
		if (trigger) {
			setEventName(trigger.defaultEvent?.name || trigger.name);
			
			// Update key-value pairs based on the selected trigger's defaultEvent.mappings
			if (trigger.defaultEvent?.mappings && typeof trigger.defaultEvent.mappings === 'object') {
				const pairs = Object.entries(trigger.defaultEvent.mappings).map(([key, value]) => ({
					key,
					value: String(value)
				}));
				pairs.push({ key: '', value: '' });
				setKeyValuePairs(pairs);
			}
		}
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
		if (keyValuePairs.length > 1) {
			const newPairs = keyValuePairs.filter((_, i) => i !== index);
			setKeyValuePairs(newPairs);
		}
	};

	const handleMergeTagSelect = (mergeTag: string) => {
		if (openDropdownIndex?.type === 'name') {
			setEventName(prev => prev + mergeTag);
		} else if (openDropdownIndex?.type === 'value') {
			const index = openDropdownIndex.index;
			updateKeyValuePair(index, 'value', keyValuePairs[index].value + mergeTag);
		}
		setOpenDropdownIndex(null);
	};

	// Get current trigger options for merge tag selector
	const getCurrentTriggerOptions = () => {
		const trigger = availableTriggers.find(t => t.id === selectedTrigger);
		return trigger?.options || [];
	};

	const handleSave = () => {
		const data = {
			trigger: selectedTrigger,
			name: eventName,
			mappings: keyValuePairs.filter(pair => pair.key && pair.value),
			sendTest
		};
		onSave(data);
	};

	return (
		<div className="echodash-modal-overlay">
			<div className="echodash-modal">
				{/* Header */}
				<div className="echodash-modal__header">
					<div className="echodash-modal__header-content">
						<div className="echodash-modal__header-icon">
							<span 
								className={`dashicons dashicons-${integration.slug === 'gravity-forms' ? 'feedback' : 'admin-plugins'} echodash-modal__header-icon-dashicon`} 
							></span>
						</div>
						<div className="echodash-modal__header-text">
							<h2 className="echodash-modal__title">Add Trigger</h2>
							<p className="echodash-modal__subtitle">
								Create a trigger for {integration.name}
							</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="echodash-modal__close"
					>
						<span className="dashicons dashicons-no-alt"></span>
					</button>
				</div>

				{/* Content */}
				<div className="echodash-modal__content">
					{/* Trigger Type */}
					<div className="echodash-form-group">
						<label className="echodash-form-group__label">
							Trigger
						</label>
						<select 
							value={selectedTrigger}
							onChange={(e) => handleTriggerChange(e.target.value)}
							className="echodash-form-group__select"
						>
							{availableTriggers.map(trigger => (
								<option key={trigger.id} value={trigger.id}>
									{trigger.name}
								</option>
							))}
						</select>
						{selectedTrigger && (
							<div className="echodash-info-box">
								<span 
									className="dashicons dashicons-info echodash-info-box__icon" 
								></span>
								<span className="echodash-info-box__text">
									{availableTriggers.find(t => t.id === selectedTrigger)?.description || 'No description available.'}
								</span>
							</div>
						)}
					</div>

					{/* Payload */}
					<div className="echodash-payload">
						<h3 className="echodash-payload__title">Payload</h3>
						<p className="echodash-payload__description">
							Configure the data to send when this trigger fires.
						</p>

						{/* Event Name */}
						<div className="echodash-event-name">
							<label className="echodash-event-name__label">
								Name:
							</label>
							<input 
								type="text"
								value={eventName}
								onChange={(e) => setEventName(e.target.value)}
								placeholder="Contact Form Submitted"
								className="echodash-event-name__input"
							/>
							<button 
								ref={nameButtonRef}
								type="button"
								onClick={() => setOpenDropdownIndex({ type: 'name', index: -1 })}
								className="echodash-merge-tag-button"
							>
								{'{...}'}
							</button>
						</div>

						{/* Key-Value Pairs */}
						{keyValuePairs.map((pair, index) => (
							<div key={index} className="echodash-key-value-pair">
								<div className="echodash-key-value-pair__field">
									<label className="echodash-key-value-pair__label">
										Key:
									</label>
									<input 
										type="text"
										value={pair.key}
										onChange={(e) => updateKeyValuePair(index, 'key', e.target.value)}
										className="echodash-key-value-pair__input"
									/>
								</div>
								<div className="echodash-key-value-pair__field">
									<label className="echodash-key-value-pair__label">
										Value:
									</label>
									<input 
										type="text"
										value={pair.value}
										onChange={(e) => updateKeyValuePair(index, 'value', e.target.value)}
										className="echodash-key-value-pair__input"
									/>
								</div>
								<div className="echodash-key-value-pair__actions">
									<button 
										type="button"
										onClick={addKeyValuePair}
										className="echodash-key-value-pair__action-button"
									>
										<span className="dashicons dashicons-plus-alt"></span>
									</button>
									{keyValuePairs.length > 1 && (
										<button 
											type="button"
											onClick={() => removeKeyValuePair(index)}
											className="echodash-key-value-pair__action-button"
										>
											<span className="dashicons dashicons-minus"></span>
										</button>
									)}
								</div>
								<button 
									ref={(el) => {
										if (valueButtonRefs.current) {
											valueButtonRefs.current[index] = el;
										}
									}}
									type="button"
									onClick={() => setOpenDropdownIndex({ type: 'value', index })}
									className="echodash-key-value-pair__merge-button"
								>
									{'{...}'}
								</button>
							</div>
						))}
					</div>

					{/* Send Test */}
					<div className="echodash-send-test">
						<label className="echodash-send-test__label">
							<input 
								type="checkbox"
								checked={sendTest}
								onChange={(e) => setSendTest(e.target.checked)}
								className="echodash-send-test__checkbox"
							/>
							<span className="dashicons dashicons-admin-tools echodash-send-test__icon"></span>
							Send Test
						</label>
					</div>
				</div>

				{/* Merge Tag Selector */}
				{openDropdownIndex && (
					<MergeTagSelector
						options={getCurrentTriggerOptions()}
						onSelect={handleMergeTagSelect}
						isOpen={true}
						onClose={() => setOpenDropdownIndex(null)}
						buttonRef={
							openDropdownIndex.type === 'name' 
								? nameButtonRef 
								: { current: valueButtonRefs.current[openDropdownIndex.index] }
						}
					/>
				)}

				{/* Footer */}
				<div className="echodash-modal__footer">
					<button 
						onClick={onClose}
						className="button button-secondary"
					>
						Cancel
					</button>
					<button 
						onClick={handleSave}
						className="button button-primary"
						disabled={!selectedTrigger}
					>
						Add Trigger
					</button>
				</div>
			</div>
		</div>
	);
};