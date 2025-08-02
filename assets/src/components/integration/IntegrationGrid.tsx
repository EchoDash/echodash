/**
 * IntegrationGrid Component
 * 
 * Grid layout component for displaying integration cards with search functionality.
 */

import React, { useState, useMemo } from 'react';
import { SearchControl, Flex, SelectControl, Notice } from '@wordpress/components';
import { IntegrationCard } from './IntegrationCard';
import { Integration } from '../../types/integration';
import { useAppContext } from '../providers/AppProvider';
import { useAccessibility } from '../../hooks/useAccessibility';

interface IntegrationGridProps {
	onIntegrationSelect?: (slug: string) => void;
	className?: string;
}

interface IntegrationGridSkeletonProps {
	count?: number;
}

const IntegrationGridSkeleton: React.FC<IntegrationGridSkeletonProps> = ({ count = 6 }) => {
	return (
		<div className="ecd-integration-grid">
			{Array.from({ length: count }).map((_, index) => (
				<div key={index} className="ecd-integration-card skeleton">
					<div className="skeleton-header">
						<div className="skeleton-icon"></div>
						<div className="skeleton-text skeleton-text-large"></div>
					</div>
					<div className="skeleton-body">
						<div className="skeleton-text"></div>
						<div className="skeleton-text skeleton-text-small"></div>
					</div>
				</div>
			))}
		</div>
	);
};

export const IntegrationGrid: React.FC<IntegrationGridProps> = ({
	onIntegrationSelect,
	className
}) => {
	const { state, setCurrentIntegration } = useAppContext();
	const { integrations, loading, errors } = state;
	const { announceToScreenReader } = useAccessibility();
	
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [sortBy, setSortBy] = useState('name');

	// Filter and search integrations
	const filteredIntegrations = useMemo(() => {
		let filtered = [...integrations];

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(integration =>
				integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(integration.description && integration.description.toLowerCase().includes(searchTerm.toLowerCase()))
			);
		}

		// Apply status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(integration => {
				switch (statusFilter) {
					case 'active':
						return integration.enabled;
					case 'inactive':
						return !integration.enabled;
					case 'configured':
						return integration.triggerCount > 0;
					case 'unconfigured':
						return integration.triggerCount === 0;
					default:
						return true;
				}
			});
		}

		// Apply sorting
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return a.name.localeCompare(b.name);
				case 'triggers':
					return b.triggerCount - a.triggerCount;
				case 'status':
					if (a.enabled === b.enabled) {
						return a.name.localeCompare(b.name);
					}
					return a.enabled ? -1 : 1;
				default:
					return 0;
			}
		});

		return filtered;
	}, [integrations, searchTerm, statusFilter, sortBy]);

	const handleIntegrationSelect = (slug: string) => {
		const integration = integrations.find(i => i.slug === slug);
		setCurrentIntegration(slug);
		if (onIntegrationSelect) {
			onIntegrationSelect(slug);
		}
		
		// Announce selection to screen readers
		if (integration) {
			announceToScreenReader(`Selected ${integration.name} integration for configuration`);
		}
	};

	const handleSearchChange = (newSearchTerm: string) => {
		setSearchTerm(newSearchTerm);
		
		// Announce search results to screen readers
		setTimeout(() => {
			const resultCount = filteredIntegrations.length;
			if (newSearchTerm) {
				announceToScreenReader(
					`Search results updated. ${resultCount} integration${resultCount !== 1 ? 's' : ''} found for "${newSearchTerm}"`
				);
			}
		}, 100);
	};

	const handleFilterChange = (newFilter: string) => {
		setStatusFilter(newFilter);
		
		// Announce filter change to screen readers
		setTimeout(() => {
			const resultCount = filteredIntegrations.length;
			announceToScreenReader(
				`Filter applied. ${resultCount} integration${resultCount !== 1 ? 's' : ''} showing`
			);
		}, 100);
	};

	// Show loading state
	if (loading.integrations) {
		return <IntegrationGridSkeleton />;
	}

	// Show error state
	if (errors.integrations) {
		return (
			<div className="ecd-integration-grid-error">
				<Notice status="error" isDismissible={false}>
					<strong>Error loading integrations:</strong> {errors.integrations}
				</Notice>
			</div>
		);
	}

	return (
		<div className={`ecd-integration-grid-container ${className || ''}`} role="main">
			{/* Search and Filter Controls */}
			<div className="ecd-integration-controls" role="search" aria-label="Integration search and filters">
				<Flex justify="space-between" align="flex-end" gap={4}>
					<div className="ecd-search-controls">
						<SearchControl
							placeholder="Search integrations..."
							value={searchTerm}
							onChange={handleSearchChange}
							className="ecd-integration-search"
							help={filteredIntegrations.length !== integrations.length ? 
								`Showing ${filteredIntegrations.length} of ${integrations.length} integrations` : 
								undefined
							}
							aria-label="Search integrations by name or description"
						/>
					</div>
					
					<Flex gap={3} className="ecd-filter-controls">
						<SelectControl
							label="Filter by status"
							value={statusFilter}
							options={[
								{ value: 'all', label: 'All integrations' },
								{ value: 'active', label: 'Active only' },
								{ value: 'inactive', label: 'Inactive only' },
								{ value: 'configured', label: 'With triggers' },
								{ value: 'unconfigured', label: 'No triggers' }
							]}
							onChange={handleFilterChange}
							className="ecd-status-filter"
							aria-label="Filter integrations by status"
						/>
						
						<SelectControl
							label="Sort by"
							value={sortBy}
							options={[
								{ value: 'name', label: 'Name' },
								{ value: 'triggers', label: 'Trigger count' },
								{ value: 'status', label: 'Status' }
							]}
							onChange={setSortBy}
							className="ecd-sort-control"
							aria-label="Sort integrations by"
						/>
					</Flex>
				</Flex>
			</div>

			{/* Integration Grid */}
			<div 
				className="ecd-integration-grid"
				role="grid"
				aria-label={`${filteredIntegrations.length} integration${filteredIntegrations.length !== 1 ? 's' : ''} available`}
				aria-rowcount={Math.ceil(filteredIntegrations.length / 3)}
			>
				{filteredIntegrations.length === 0 ? (
					<div className="ecd-empty-state" role="status" aria-live="polite">
						{searchTerm || statusFilter !== 'all' ? (
							<div className="ecd-no-results">
								<h3>No integrations found</h3>
								<p>
									{searchTerm ? 
										`No integrations match "${searchTerm}"` : 
										'No integrations match the selected filters'
									}
								</p>
								{(searchTerm || statusFilter !== 'all') && (
									<button 
										type="button"
										className="button button-secondary"
										onClick={() => {
											setSearchTerm('');
											setStatusFilter('all');
											announceToScreenReader('Filters cleared. Showing all integrations.');
										}}
									>
										Clear filters
									</button>
								)}
							</div>
						) : (
							<div className="ecd-no-integrations">
								<h3>No integrations available</h3>
								<p>No WordPress plugins with EchoDash integrations were detected.</p>
							</div>
						)}
					</div>
				) : (
					filteredIntegrations.map((integration, index) => (
						<IntegrationCard
							key={integration.slug}
							integration={integration}
							onSelect={handleIntegrationSelect}
						/>
					))
				)}
			</div>

			{/* Results Summary */}
			{filteredIntegrations.length > 0 && (
				<div className="ecd-integration-summary" role="status" aria-live="polite">
					<p className="ecd-results-text">
						Showing {filteredIntegrations.length} integration{filteredIntegrations.length !== 1 ? 's' : ''}
						{filteredIntegrations.length !== integrations.length && 
							` of ${integrations.total || integrations.length} total`
						}
					</p>
				</div>
			)}
		</div>
	);
};