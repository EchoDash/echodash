/**
 * IntegrationCard Component
 * 
 * Individual integration card component displaying integration info and actions.
 */

import React from 'react';
import { Card, CardBody, CardHeader, Flex, Button } from '@wordpress/components';
import { Icon } from '@wordpress/components';
import { Integration } from '../../types/integration';
import { clsx } from 'clsx';

interface IntegrationCardProps {
	integration: Integration;
	onSelect: (slug: string) => void;
	className?: string;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
	integration,
	onSelect,
	className
}) => {
	const handleConfigure = () => {
		onSelect(integration.slug);
	};

	const renderIcon = () => {
		if (integration.icon) {
			// If icon is a URL, render as image
			if (integration.icon.startsWith('http') || integration.icon.startsWith('/')) {
				return (
					<img
						src={integration.icon}
						alt={integration.name}
						width={24}
						height={24}
						className="integration-icon-img"
					/>
				);
			}
			// If icon is a dashicon name, render as Icon component
			return <Icon icon={integration.icon} size={24} />;
		}
		// Default fallback icon
		return <Icon icon="admin-plugins" size={24} />;
	};

	return (
		<Card 
			className={clsx('ecd-integration-card', className)}
			isElevated
			role="article"
			aria-labelledby={`integration-${integration.slug}-name`}
			aria-describedby={`integration-${integration.slug}-description`}
		>
			<CardHeader>
				<Flex align="center" gap={3}>
					<div 
						className="ecd-integration-icon"
						role="img"
						aria-label={`${integration.name} integration icon`}
					>
						{renderIcon()}
					</div>
					<div className="ecd-integration-info">
						<h3 
							id={`integration-${integration.slug}-name`}
							className="ecd-integration-name"
						>
							{integration.name}
						</h3>
						{integration.description && (
							<p 
								id={`integration-${integration.slug}-description`}
								className="ecd-integration-description"
							>
								{integration.description}
							</p>
						)}
					</div>
				</Flex>
			</CardHeader>
			
			<CardBody>
				<Flex justify="space-between" align="center" className="ecd-integration-footer">
					<div className="ecd-integration-stats" role="status">
						<span 
							className="ecd-trigger-count"
							aria-label={`${integration.triggerCount} triggers configured`}
						>
							{integration.triggerCount} {integration.triggerCount === 1 ? 'trigger' : 'triggers'} configured
						</span>
						<span 
							className={clsx(
								'ecd-integration-status',
								integration.enabled ? 'is-enabled' : 'is-disabled'
							)}
							role="status"
							aria-label={`Integration status: ${integration.enabled ? 'Active' : 'Inactive'}`}
						>
							{integration.enabled ? 'Active' : 'Inactive'}
						</span>
					</div>
					<Button 
						variant="secondary"
						onClick={handleConfigure}
						className="ecd-configure-button"
						aria-label={`Configure ${integration.name} integration`}
						aria-describedby={`integration-${integration.slug}-description`}
					>
						Configure
					</Button>
				</Flex>
			</CardBody>
		</Card>
	);
};