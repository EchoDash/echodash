/**
 * Integration Dashboard Component
 * 
 * Main dashboard showing all available integrations with improved UX.
 */

import React from 'react';
import { IntegrationGrid } from './IntegrationGrid';

export const IntegrationDashboard: React.FC = () => {
	const handleIntegrationSelect = (slug: string) => {
		// Navigation logic would go here
		// For now, we'll just log the selection
		console.log(`Selected integration: ${slug}`);
	};

	return (
		<div className="echodash-dashboard">
			<div className="echodash-dashboard__header">
				<h1 className="echodash-title">
					EchoDash Integrations
				</h1>
				<p className="echodash-subtitle">
					Configure event tracking for your WordPress plugins
				</p>
			</div>

			<IntegrationGrid onIntegrationSelect={handleIntegrationSelect} />
		</div>
	);
};