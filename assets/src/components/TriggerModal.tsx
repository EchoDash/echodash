/**
 * Trigger Modal Component
 * 
 * Modal for adding/editing triggers matching the mockup design
 */

import React, { useState } from 'react';

interface Integration {
	slug: string;
	name: string;
	availableTriggers?: Array<{
		id: string;
		name: string;
		description?: string;
		defaultEvent?: any;
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
	const [selectedTrigger, setSelectedTrigger] = useState('');
	const [eventName, setEventName] = useState('');
	const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([
		{ key: 'user_name', value: '{user_name}' },
		{ key: 'user_id', value: '{user_id}' },
		{ key: '', value: '' }
	]);
	const [sendTest, setSendTest] = useState(false);

	if (!isOpen) return null;

	const availableTriggers = integration.availableTriggers || [
		{ id: 'form_submitted', name: 'Form Submitted', description: 'Triggered each time a form is submitted.' }
	];

	const handleTriggerChange = (triggerId: string) => {
		setSelectedTrigger(triggerId);
		const trigger = availableTriggers.find(t => t.id === triggerId);
		if (trigger) {
			setEventName(trigger.name);
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
		<div style={{
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0,0,0,0.7)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 1000
		}}>
			<div style={{
				backgroundColor: 'white',
				borderRadius: '8px',
				width: '500px',
				maxHeight: '90vh',
				overflow: 'auto'
			}}>
				{/* Header */}
				<div style={{
					padding: '20px 24px',
					borderBottom: '1px solid #ddd',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<div style={{ 
							width: '32px', 
							height: '32px',
							backgroundColor: '#FF6900',
							borderRadius: '6px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: '12px'
						}}>
							<span 
								className={`dashicons dashicons-${integration.slug === 'gravity-forms' ? 'feedback' : 'admin-plugins'}`} 
								style={{ fontSize: '18px', color: 'white' }}
							></span>
						</div>
						<div>
							<h2 style={{ margin: 0, fontSize: '18px' }}>Add Trigger</h2>
							<p style={{ margin: 0, color: '#646970', fontSize: '14px' }}>
								Create a trigger for {integration.name}
							</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '4px'
						}}
					>
						<span className="dashicons dashicons-no-alt"></span>
					</button>
				</div>

				{/* Content */}
				<div style={{ padding: '24px' }}>
					{/* Trigger Type */}
					<div style={{ marginBottom: '20px' }}>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
							Trigger
						</label>
						<select 
							value={selectedTrigger}
							onChange={(e) => handleTriggerChange(e.target.value)}
							style={{ width: '100%', padding: '8px' }}
						>
							<option value="">Select a trigger type...</option>
							{availableTriggers.map(trigger => (
								<option key={trigger.id} value={trigger.id}>
									{trigger.name}
								</option>
							))}
						</select>
						{selectedTrigger && (
							<div style={{
								backgroundColor: '#e7f3ff',
								padding: '12px',
								borderRadius: '4px',
								marginTop: '8px',
								display: 'flex',
								alignItems: 'flex-start'
							}}>
								<span 
									className="dashicons dashicons-info" 
									style={{ color: '#0073aa', marginRight: '8px', marginTop: '2px' }}
								></span>
								<span style={{ fontSize: '14px' }}>
									Triggered each time a form is submitted.
								</span>
							</div>
						)}
					</div>

					{/* Payload */}
					<div style={{ marginBottom: '20px' }}>
						<h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Payload</h3>
						<p style={{ color: '#646970', fontSize: '14px', marginBottom: '16px' }}>
							Configure the data to send when this trigger fires.
						</p>

						{/* Event Name */}
						<div style={{ marginBottom: '16px' }}>
							<label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
								Name:
							</label>
							<input 
								type="text"
								value={eventName}
								onChange={(e) => setEventName(e.target.value)}
								placeholder="Contact Form Submitted"
								style={{ width: '100%', padding: '8px' }}
							/>
							<button 
								type="button"
								style={{
									background: 'none',
									border: 'none',
									color: '#646970',
									cursor: 'pointer',
									fontSize: '12px',
									padding: '4px 0'
								}}
							>
								{'{...}'}
							</button>
						</div>

						{/* Key-Value Pairs */}
						{keyValuePairs.map((pair, index) => (
							<div key={index} style={{ 
								display: 'flex', 
								gap: '8px', 
								marginBottom: '8px',
								alignItems: 'center'
							}}>
								<div style={{ flex: 1 }}>
									<label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>
										Key:
									</label>
									<input 
										type="text"
										value={pair.key}
										onChange={(e) => updateKeyValuePair(index, 'key', e.target.value)}
										style={{ width: '100%', padding: '6px' }}
									/>
								</div>
								<div style={{ flex: 1 }}>
									<label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>
										Value:
									</label>
									<input 
										type="text"
										value={pair.value}
										onChange={(e) => updateKeyValuePair(index, 'value', e.target.value)}
										style={{ width: '100%', padding: '6px' }}
									/>
								</div>
								<div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', paddingBottom: '2px' }}>
									<button 
										type="button"
										onClick={addKeyValuePair}
										style={{
											background: 'none',
											border: 'none',
											color: '#646970',
											cursor: 'pointer',
											padding: '4px'
										}}
									>
										<span className="dashicons dashicons-plus-alt"></span>
									</button>
									{keyValuePairs.length > 1 && (
										<button 
											type="button"
											onClick={() => removeKeyValuePair(index)}
											style={{
												background: 'none',
												border: 'none',
												color: '#646970',
												cursor: 'pointer',
												padding: '4px'
											}}
										>
											<span className="dashicons dashicons-minus"></span>
										</button>
									)}
								</div>
								<button 
									type="button"
									style={{
										background: 'none',
										border: 'none',
										color: '#646970',
										cursor: 'pointer',
										fontSize: '12px',
										alignSelf: 'flex-end',
										paddingBottom: '6px'
									}}
								>
									{'{...}'}
								</button>
							</div>
						))}
					</div>

					{/* Send Test */}
					<div style={{ marginBottom: '20px' }}>
						<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
							<input 
								type="checkbox"
								checked={sendTest}
								onChange={(e) => setSendTest(e.target.checked)}
								style={{ marginRight: '8px' }}
							/>
							<span className="dashicons dashicons-admin-tools" style={{ marginRight: '6px' }}></span>
							Send Test
						</label>
					</div>
				</div>

				{/* Footer */}
				<div style={{
					padding: '16px 24px',
					borderTop: '1px solid #ddd',
					display: 'flex',
					justifyContent: 'flex-end',
					gap: '10px'
				}}>
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