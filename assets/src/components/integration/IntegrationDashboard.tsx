/**
 * Integration Dashboard Component
 * 
 * Main dashboard showing all available integrations with improved UX.
 */

import React from 'react';
import { IntegrationGrid } from './IntegrationGrid';

interface IntegrationDashboardProps {
	onIntegrationSelect?: (slug: string) => void;
}

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({ 
	onIntegrationSelect 
}) => {
	const handleIntegrationSelect = (slug: string) => {
		// Call the parent handler if provided
		if (onIntegrationSelect) {
			onIntegrationSelect(slug);
		} else {
			// Fallback for when no handler is provided
			console.log(`Selected integration: ${slug}`);
		}
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