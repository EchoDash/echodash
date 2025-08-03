/**
 * Integration Detail Component
 * 
 * Shows individual integration with triggers matching mockup
 */

import React from 'react';

interface Integration {
	slug: string;
	name: string;
	icon: string;
	triggerCount: number;
	enabled: boolean;
	description?: string;
}

interface Trigger {
	id: string;
	name: string;
	description?: string;
	enabled?: boolean;
}

interface IntegrationDetailProps {
	integration: Integration;
	triggers: Trigger[];
	onBack: () => void;
	onAddTrigger: () => void;
}

export const IntegrationDetail: React.FC<IntegrationDetailProps> = ({
	integration,
	triggers,
	onBack,
	onAddTrigger,
}) => {
	return (
		<>
			{/* Header with logo */}
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
				<span className="dashicons dashicons-rss" style={{ fontSize: '36px', marginRight: '10px' }}></span>
				<h1 style={{ margin: 0 }}>EchoDash</h1>
				<a 
					href="https://docs.echodash.com" 
					target="_blank" 
					rel="noopener noreferrer"
					style={{ marginLeft: 'auto' }}
					className="button button-link"
				>
					Documentation →
				</a>
			</div>

			{/* Breadcrumb navigation */}
			<div style={{ marginBottom: '20px' }}>
				<button 
					onClick={onBack}
					className="button button-link"
					style={{ padding: 0 }}
				>
					Integrations
				</button>
				<span style={{ margin: '0 8px', color: '#646970' }}>/</span>
				<span>{integration.name}</span>
			</div>

			{/* Integration header */}
			<div style={{ 
				backgroundColor: 'white', 
				border: '1px solid #c3c4c7', 
				borderRadius: '8px', 
				padding: '30px',
				marginBottom: '30px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
					{/* Icon */}
					<div style={{ 
						width: '48px', 
						height: '48px',
						backgroundColor: integration.slug === 'wordpress' ? '#2271b1' : '#FF6900',
						borderRadius: '8px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginRight: '16px'
					}}>
						<span 
							className={`dashicons dashicons-${integration.icon}`} 
							style={{ fontSize: '28px', color: 'white' }}
						></span>
					</div>

					<div>
						<h1 style={{ margin: 0, fontSize: '24px' }}>{integration.name}</h1>
						<p style={{ margin: 0, color: '#646970' }}>
							{integration.description || 'Configure triggers for this integration'}
						</p>
					</div>

					<button 
						className="button button-primary"
						onClick={onAddTrigger}
						style={{ marginLeft: 'auto' }}
					>
						+ Add Trigger
					</button>
				</div>
			</div>

			{/* Triggers section */}
			<div style={{ 
				backgroundColor: 'white', 
				border: '1px solid #c3c4c7', 
				borderRadius: '8px', 
				padding: '20px'
			}}>
				<h2 style={{ marginTop: 0, marginBottom: '20px' }}>Triggers</h2>
				
				{triggers.length === 0 ? (
					<div style={{ 
						textAlign: 'center',
						padding: '60px 20px',
						color: '#646970'
					}}>
						<div style={{ 
							width: '48px', 
							height: '48px',
							backgroundColor: '#FF6900',
							borderRadius: '8px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							margin: '0 auto 20px'
						}}>
							<span 
								className={`dashicons dashicons-${integration.icon}`} 
								style={{ fontSize: '28px', color: 'white' }}
							></span>
						</div>
						<h3 style={{ marginBottom: '10px' }}>Add your first {integration.name} trigger</h3>
						<p style={{ marginBottom: '20px' }}>
							Accumsan augue sapien lorem blandit leo. In fringilla aliquam mattis phasellus.<br />
							Feugiat feugiat risus cursus tempor tortor.
						</p>
						<button 
							className="button button-primary"
							onClick={onAddTrigger}
						>
							+ Add Trigger
						</button>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						{triggers.map((trigger, index) => (
							<div
								key={trigger.id || index}
								style={{
									display: 'flex',
									alignItems: 'center',
									padding: '16px',
									backgroundColor: '#f6f7f7',
									borderRadius: '4px'
								}}
							>
								{/* Drag handle */}
								<span 
									className="dashicons dashicons-menu" 
									style={{ color: '#646970', marginRight: '12px', cursor: 'grab' }}
								></span>

								{/* Trigger info */}
								<div style={{ flex: 1 }}>
									<div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Form Submitted</div>
									<div style={{ color: '#646970', fontSize: '14px' }}>{trigger.name}</div>
								</div>

								{/* Actions */}
								<div style={{ display: 'flex', gap: '10px' }}>
									<button className="button button-secondary">Send Test</button>
									<button className="button button-secondary">Edit</button>
									<button className="button button-link-delete">
										<span className="dashicons dashicons-trash"></span>
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	);
};