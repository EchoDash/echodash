/**
 * Simple App Component
 * 
 * A simplified version to test the React setup
 */

import React from 'react';
import { IntegrationGrid } from './components/integration/IntegrationGrid';

// Get global data from PHP
declare global {
	interface Window {
		ecdReactData: {
			settings: {
				endpoint?: string;
				isConnected?: boolean;
			};
			integrations: Array<{
				slug: string;
				name: string;
				icon: string;
				triggerCount: number;
				enabled: boolean;
			}>;
			triggers: Record<string, any[]>;
			nonce: string;
			apiUrl: string;
			i18n: Record<string, string>;
		};
	}
}

export const SimpleApp: React.FC = () => {
	// Get data passed from PHP
	const data = window.ecdReactData || {
		settings: {},
		integrations: [],
		triggers: {},
		nonce: '',
		apiUrl: '',
		i18n: {}
	};

	const { integrations = [], settings = {} } = data;

	return (
		<div className="wrap">
			<h1>EchoDash</h1>
			
			{!settings.endpoint && (
				<div className="notice notice-info">
					<p>Please configure your EchoDash endpoint URL in the settings.</p>
				</div>
			)}

			<div style={{ 
				backgroundColor: 'white', 
				border: '1px solid #c3c4c7', 
				borderRadius: '8px', 
				padding: '24px',
				marginTop: '20px'
			}}>
				<h2 style={{ marginTop: 0 }}>Available Integrations</h2>
				
				{integrations.length === 0 ? (
					<p>No integrations found.</p>
				) : (
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
						gap: '16px',
						marginTop: '20px'
					}}>
						{integrations.map((integration) => (
							<div
								key={integration.slug}
								style={{
									backgroundColor: '#f6f7f7',
									border: '1px solid #dcdcde',
									borderRadius: '8px',
									padding: '20px',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
									position: 'relative'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.borderColor = '#2271b1';
									e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.borderColor = '#dcdcde';
									e.currentTarget.style.boxShadow = 'none';
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
									<span 
										className={`dashicons dashicons-${integration.icon}`} 
										style={{ fontSize: '32px', color: '#2271b1', marginRight: '12px' }}
									></span>
									<div>
										<h3 style={{ margin: 0, fontSize: '16px' }}>{integration.name}</h3>
										<p style={{ margin: 0, color: '#646970', fontSize: '13px' }}>
											{integration.triggerCount} {integration.triggerCount === 1 ? 'Trigger' : 'Triggers'}
										</p>
									</div>
								</div>
								
								<div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
									<button className="button button-secondary">
										Configure
									</button>
									{integration.triggerCount > 0 && (
										<button className="button button-primary">
											View Triggers
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};