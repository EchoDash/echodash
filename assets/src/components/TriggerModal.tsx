/**
 * Trigger Modal Component
 *
 * Modal for adding/editing triggers matching the mockup design
 */

import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { MergeTagSelector } from './MergeTagSelector';
import './TriggerModal.css';
import type {
	Integration,
	KeyValuePair,
	Trigger,
	TriggerMapping,
	MergeTagGroup,
} from '../types';

// Interface for the data passed to onSave
interface TriggerSaveData {
	trigger: string;
	name: string;
	mappings: TriggerMapping[];
	sendTest?: boolean;
}

interface TriggerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: TriggerSaveData) => void;
	onSendTest?: (data: Trigger) => void;
	integration: Integration;
	editingTrigger?: Trigger;
	savingTrigger?: boolean;
}

export const TriggerModal: React.FC<TriggerModalProps> = ({
	isOpen,
	onClose,
	onSave,
	onSendTest,
	integration,
	editingTrigger,
	savingTrigger = false,
}) => {
	const availableTriggers = integration.availableTriggers || [
		{
			id: 'form_submitted',
			name: 'Form Submitted',
			description: 'Triggered each time a form is submitted.',
		},
	];

	// Initialize state based on whether we're editing or creating
	const getInitialTrigger = (): string => {
		if (editingTrigger) {
			return editingTrigger.trigger || editingTrigger.id || '';
		}
		return availableTriggers[0]?.id || '';
	};

	const getInitialEventName = (): string => {
		if (editingTrigger) {
			return editingTrigger.name || editingTrigger.event_name || '';
		}
		const firstTrigger = availableTriggers[0];
		return firstTrigger?.defaultEvent?.name || firstTrigger?.name || '';
	};

	// Initialize key-value pairs from editing data or default event mappings
	const getInitialKeyValuePairs = (): KeyValuePair[] => {
		if (
			editingTrigger?.mappings &&
			Array.isArray(editingTrigger.mappings)
		) {
			// Use existing mappings from editing trigger
			const pairs = editingTrigger.mappings.map(
				(mapping: TriggerMapping) => ({
					key: mapping.key || '',
					value: mapping.value || '',
				})
			);
			// Add empty row at the end if not already present
			if (
				pairs.length === 0 ||
				pairs[pairs.length - 1].key !== '' ||
				pairs[pairs.length - 1].value !== ''
			) {
				pairs.push({ key: '', value: '' });
			}
			return pairs;
		} else if (!editingTrigger) {
			// For new triggers, use default event mappings if available
			const firstTrigger = availableTriggers[0];
			if (
				firstTrigger?.defaultEvent?.mappings &&
				typeof firstTrigger.defaultEvent.mappings === 'object'
			) {
				const pairs = Object.entries(
					firstTrigger.defaultEvent.mappings
				).map(([key, value]) => ({
					key,
					value: String(value),
				}));
				pairs.push({ key: '', value: '' });
				return pairs;
			}
		}
		// Fallback to default pairs
		return [
			{ key: 'user_name', value: '{user_name}' },
			{ key: 'user_id', value: '{user_id}' },
			{ key: '', value: '' },
		];
	};

	const [selectedTrigger, setSelectedTrigger] = useState(getInitialTrigger());
	const [eventName, setEventName] = useState(getInitialEventName());
	const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>(
		getInitialKeyValuePairs()
	);
	const [openDropdownIndex, setOpenDropdownIndex] = useState<{
		type: 'name' | 'value';
		index: number;
	} | null>(null);
	const [sendingTest, setSendingTest] = useState(false);
	const [sentTest, setSentTest] = useState(false);

	// Refs for merge tag buttons
	const nameButtonRef = useRef<HTMLButtonElement>(null);
	const valueButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

	// Initialize refs array when keyValuePairs change
	useEffect(() => {
		valueButtonRefs.current = valueButtonRefs.current.slice(
			0,
			keyValuePairs.length
		);
	}, [keyValuePairs.length]);

	if (!isOpen) return null;

	const handleTriggerChange = (triggerId: string): void => {
		setSelectedTrigger(triggerId);
		const trigger = availableTriggers.find(t => t.id === triggerId);
		if (trigger) {
			setEventName(trigger.defaultEvent?.name || trigger.name);

			// Update key-value pairs based on the selected trigger's defaultEvent.mappings
			if (
				trigger.defaultEvent?.mappings &&
				typeof trigger.defaultEvent.mappings === 'object'
			) {
				const pairs = Object.entries(trigger.defaultEvent.mappings).map(
					([key, value]) => ({
						key,
						value: String(value),
					})
				);
				pairs.push({ key: '', value: '' });
				setKeyValuePairs(pairs);
			}
		}
	};

	const updateKeyValuePair = (
		index: number,
		field: 'key' | 'value',
		value: string
	): void => {
		const newPairs = [...keyValuePairs];
		newPairs[index][field] = value;
		setKeyValuePairs(newPairs);
	};

	const addKeyValuePair = (): void => {
		setKeyValuePairs([...keyValuePairs, { key: '', value: '' }]);
	};

	const removeKeyValuePair = (index: number): void => {
		if (keyValuePairs.length > 1) {
			const newPairs = keyValuePairs.filter((_, i) => i !== index);
			setKeyValuePairs(newPairs);
		}
	};

	const handleMergeTagSelect = (mergeTag: string): void => {
		if (openDropdownIndex?.type === 'name') {
			setEventName((prev: string) => prev + mergeTag);
		} else if (openDropdownIndex?.type === 'value') {
			const index = openDropdownIndex.index;
			updateKeyValuePair(
				index,
				'value',
				keyValuePairs[index].value + mergeTag
			);
		}
		setOpenDropdownIndex(null);
	};

	// Get current trigger options for merge tag selector
	const getCurrentTriggerOptions = (): MergeTagGroup[] => {
		const trigger = availableTriggers.find(t => t.id === selectedTrigger);
		return trigger?.options || [];
	};

	const handleSave = (): void => {
		const data = {
			trigger: selectedTrigger,
			name: eventName,
			mappings: keyValuePairs.filter(pair => pair.key && pair.value),
		};
		onSave(data);
	};

	const handleSendTest = async (): Promise<void> => {
		if (!onSendTest) return;

		setSendingTest(true);
		setSentTest(false); // Clear any previous sent state
		try {
			const data = {
				trigger: selectedTrigger,
				name: eventName,
				mappings: keyValuePairs.filter(pair => pair.key && pair.value),
			};
			await onSendTest(data as Trigger);
			// Show "Sent!" state for 3 seconds
			setSentTest(true);
			setTimeout(() => setSentTest(false), 3000);
		} catch {
			// Error handling is done in App.tsx, just reset loading state
			// Error handling is done in App.tsx
		} finally {
			setSendingTest(false);
		}
	};

	return (
		<div className="echodash-modal-overlay">
			<div className="echodash-modal">
				{/* Header */}
				<div className="echodash-modal__header">
					<div className="echodash-modal__header-content">
						<div
							className="echodash-modal__header-icon echodash-integration-item__icon"
							style={{
								backgroundColor:
									integration.iconBackgroundColor ||
									'#ff6900',
							}}
						>
							{integration.icon ? (
								<img
									src={integration.icon}
									alt={`${integration.name} logo`}
									className="echodash-modal__header-icon-image"
								/>
							) : (
								<span
									className={`dashicons dashicons-${
										integration.slug === 'gravity-forms'
											? 'feedback'
											: 'admin-plugins'
									} echodash-modal__header-icon-dashicon`}
								></span>
							)}
						</div>
						<div className="echodash-modal__header-text">
							<h2 className="echodash-modal__title">
								{editingTrigger
									? 'Edit Trigger'
									: 'Add Trigger'}
							</h2>
							<p className="echodash-modal__subtitle">
								{editingTrigger
									? __(
											'Edit trigger for %s',
											'echodash'
									  ).replace('%s', integration.name)
									: __(
											'Create a trigger for %s',
											'echodash'
									  ).replace('%s', integration.name)}
							</p>
						</div>
					</div>
					<button onClick={onClose} className="echodash-modal__close">
						<span className="dashicons dashicons-no-alt"></span>
					</button>
				</div>

				{/* Content */}
				<div className="echodash-modal__content">
					{/* Trigger Type */}
					<div className="echodash-form-group">
						<label className="echodash-form-group__label">
							{__('Trigger', 'echodash')}
						</label>
						<select
							value={selectedTrigger}
							onChange={e => handleTriggerChange(e.target.value)}
							className="echodash-form-group__select"
							disabled={!!editingTrigger || savingTrigger}
						>
							{availableTriggers.map(trigger => (
								<option key={trigger.id} value={trigger.id}>
									{trigger.name}
								</option>
							))}
						</select>
						{selectedTrigger && (
							<div className="echodash-info-box">
								<span className="dashicons dashicons-info-outline echodash-info-box__icon"></span>
								<span className="echodash-info-box__text">
									{availableTriggers.find(
										t => t.id === selectedTrigger
									)?.description ||
										'No description available.'}
								</span>
							</div>
						)}
					</div>

					<hr />

					{/* Payload */}
					<div className="echodash-payload">
						<h3 className="echodash-payload__title">Payload</h3>

						{/* Event Name */}
						<div className="echodash-event-name">
							<div className="echodash-input-wrapper echodash-input-wrapper--name">
								<input
									type="text"
									value={eventName}
									onChange={e => setEventName(e.target.value)}
									className="echodash-event-name__input"
									disabled={savingTrigger}
								/>
								<button
									ref={nameButtonRef}
									type="button"
									onClick={() =>
										setOpenDropdownIndex({
											type: 'name',
											index: -1,
										})
									}
									className="echodash-merge-tag-button echodash-merge-tag-button--inline"
									disabled={savingTrigger}
								></button>
							</div>
						</div>

						{/* Key-Value Pairs */}
						{keyValuePairs.map((pair, index) => (
							<div
								key={index}
								className="echodash-key-value-pair"
							>
								<div className="echodash-key-value-pair__field echodash-key-value-pair__field--key">
									<div className="echodash-input-wrapper echodash-input-wrapper--key">
										<input
											type="text"
											value={pair.key}
											onChange={e =>
												updateKeyValuePair(
													index,
													'key',
													e.target.value
												)
											}
											className="echodash-key-value-pair__input"
											disabled={savingTrigger}
										/>
									</div>
								</div>
								<div className="echodash-key-value-pair__field echodash-key-value-pair__field--value">
									<div className="echodash-input-wrapper echodash-input-wrapper--value">
										<input
											type="text"
											value={pair.value}
											onChange={e =>
												updateKeyValuePair(
													index,
													'value',
													e.target.value
												)
											}
											className="echodash-key-value-pair__input"
											disabled={savingTrigger}
										/>
										<button
											ref={el => {
												if (valueButtonRefs.current) {
													valueButtonRefs.current[
														index
													] = el;
												}
											}}
											type="button"
											onClick={() =>
												setOpenDropdownIndex({
													type: 'value',
													index,
												})
											}
											className="echodash-merge-tag-button echodash-merge-tag-button--inline"
											disabled={savingTrigger}
										></button>
									</div>
								</div>
								<div className="echodash-key-value-pair__actions">
									<button
										type="button"
										onClick={addKeyValuePair}
										className="echodash-key-value-pair__action-button"
										disabled={savingTrigger}
									>
										<span className="dashicons dashicons-plus-alt2"></span>
									</button>
									{keyValuePairs.length > 1 && (
										<button
											type="button"
											onClick={() =>
												removeKeyValuePair(index)
											}
											className="echodash-key-value-pair__action-button"
											disabled={savingTrigger}
										>
											<span className="dashicons dashicons-minus"></span>
										</button>
									)}
								</div>
							</div>
						))}
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
								: {
										current:
											valueButtonRefs.current[
												openDropdownIndex.index
											],
								  }
						}
					/>
				)}

				{/* Footer */}
				<div className="echodash-modal__footer">
					<button
						type="button"
						className="echodash-button echodash-send-test-button"
						onClick={handleSendTest}
						disabled={
							sendingTest ||
							!onSendTest ||
							!selectedTrigger ||
							savingTrigger
						}
					>
						{sendingTest ? (
							<>
								<span className="dashicons dashicons-bell ecd-ring"></span>
								Sending...
							</>
						) : sentTest ? (
							<>
								<span className="dashicons dashicons-bell"></span>
								Sent!
							</>
						) : (
							<>
								<span className="dashicons dashicons-bell"></span>
								Send Test
							</>
						)}
					</button>
					<div className="echodash-modal__footer-actions">
						<button
							onClick={onClose}
							className="echodash-button"
							disabled={savingTrigger}
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="echodash-button echodash-button-primary"
							disabled={!selectedTrigger || savingTrigger}
						>
							{savingTrigger ? (
								<>
									<span className="dashicons dashicons-update-alt ecd-spinner"></span>
									Saving...
								</>
							) : editingTrigger ? (
								'Update Trigger'
							) : (
								'Add Trigger'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
