/**
 * Integration Dashboard Component
 * 
 * Main dashboard showing all available integrations.
 */

import React from 'react';
import { Card, CardBody, CardHeader, Flex } from '@wordpress/components';
import { useAppContext } from '../providers/AppProvider';

export const IntegrationDashboard: React.FC = () => {
	const { state } = useAppContext();
	const { integrations, loading } = state;

	if (loading.integrations) {
		return (
			<div className="echodash-loading">
				<p>Loading integrations...</p>
			</div>
		);
	}

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

			<div className="echodash-integration-grid">
				{integrations.length === 0 ? (
					<Card>
						<CardBody>
							<p>No integrations available.</p>
						</CardBody>
					</Card>
				) : (
					integrations.map(integration => (
						<Card key={integration.slug} className="echodash-integration-card">
							<CardHeader>
								<Flex align="center" gap={3}>
									<div className="integration-icon">
										{integration.icon && (
											<img
												src={integration.icon}
												alt={integration.name}
												width={24}
												height={24}
											/>
										)}
									</div>
									<strong className="integration-name">
										{integration.name}
									</strong>
								</Flex>
							</CardHeader>
							<CardBody>
								<Flex justify="space-between" align="center">
									<span className="trigger-count">
										{integration.triggerCount} triggers configured
									</span>
									<span className={`status ${integration.enabled ? 'active' : 'inactive'}`}>
										{integration.enabled ? 'Active' : 'Inactive'}
									</span>
								</Flex>
							</CardBody>
						</Card>
					))
				)}
			</div>
		</div>
	);
};