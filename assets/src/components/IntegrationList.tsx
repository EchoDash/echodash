/**
 * Integration List Component
 * 
 * Displays list of integrations matching the mockup design
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

interface IntegrationListProps {
	integrations: Integration[];
	settings: {
		endpoint?: string;
		isConnected?: boolean;
	};
	onIntegrationClick: (slug: string) => void;
}

export const IntegrationList: React.FC<IntegrationListProps> = ({
	integrations,
	settings,
	onIntegrationClick,
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

			{/* Welcome Section */}
			<div style={{ 
				backgroundColor: 'white', 
				border: '1px solid #c3c4c7', 
				borderRadius: '8px', 
				padding: '30px',
				marginBottom: '30px',
				display: 'flex',
				gap: '30px'
			}}>
				<div style={{ flex: 1 }}>
					<h2 style={{ marginTop: 0 }}>Welcome to EchoDash</h2>
					<p style={{ color: '#646970', marginBottom: '20px' }}>
						EchoDash is a service for tracking real-time events on your WordPress site. It's free and easy to use.
					</p>
					<p style={{ marginBottom: '8px' }}>
						To get started, <a href="#" style={{ color: '#2271b1' }}>create an endpoint in your EchoDash account</a>, and copy the URL into the field below.
					</p>
					
					<div style={{ marginTop: '20px' }}>
						<label htmlFor="endpoint-url" style={{ display: 'block', marginBottom: '8px' }}>
							<strong>URL</strong>
						</label>
						<input 
							type="text" 
							id="endpoint-url"
							className="regular-text"
							placeholder="https://example.com/"
							value={settings.endpoint || ''}
							style={{ width: '100%' }}
						/>
					</div>
				</div>

				{/* Video placeholder */}
				<div style={{ 
					width: '400px', 
					height: '225px', 
					backgroundColor: '#f0f0f1',
					borderRadius: '8px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative'
				}}>
					<div style={{
						width: '60px',
						height: '60px',
						backgroundColor: 'rgba(255,255,255,0.9)',
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer'
					}}>
						<span className="dashicons dashicons-controls-play" style={{ fontSize: '30px', marginLeft: '3px' }}></span>
					</div>
				</div>
			</div>

			{/* Integrations Section */}
			<div style={{ 
				backgroundColor: 'white', 
				border: '1px solid #c3c4c7', 
				borderRadius: '8px', 
				padding: '20px'
			}}>
				<h2 style={{ marginTop: 0, marginBottom: '20px' }}>Integrations</h2>
				
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
					{integrations.map((integration) => (
						<div
							key={integration.slug}
							style={{
								display: 'flex',
								alignItems: 'center',
								padding: '16px',
								backgroundColor: '#f6f7f7',
								borderRadius: '4px',
								marginBottom: '8px'
							}}
						>
							{/* Icon */}
							<div style={{ 
								width: '40px', 
								height: '40px',
								backgroundColor: integration.slug === 'wordpress' ? '#2271b1' : '#FF6900',
								borderRadius: '8px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: '16px'
							}}>
								<span 
									className={`dashicons dashicons-${integration.icon}`} 
									style={{ fontSize: '24px', color: 'white' }}
								></span>
							</div>

							{/* Name and trigger count */}
							<div style={{ flex: 1 }}>
								<h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'normal' }}>
									{integration.name}
								</h3>
								<span style={{ color: '#646970', fontSize: '13px' }}>
									{integration.triggerCount} {integration.triggerCount === 1 ? 'Trigger' : 'Triggers'}
								</span>
							</div>

							{/* Actions */}
							<div style={{ display: 'flex', gap: '10px' }}>
								<button 
									className="button button-secondary"
									onClick={() => onIntegrationClick(integration.slug)}
								>
									Manage
								</button>
								<button className="button button-primary">
									+ Add Trigger
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
};