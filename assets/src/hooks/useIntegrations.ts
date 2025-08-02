/**
 * useIntegrations Hook
 * 
 * Custom hook for managing integrations data via the REST API.
 */

import { useState, useCallback, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Integration, Trigger } from '../types';

interface IntegrationsResponse {
	integrations: Integration[];
	total: number;
}

interface UseIntegrationsReturn {
	integrations: Integration[];
	loading: boolean;
	error: string | null;
	fetchIntegrations: () => Promise<void>;
	getIntegration: (slug: string) => Promise<Integration | null>;
	updateIntegration: (slug: string, data: Partial<Integration>) => Promise<void>;
	getTriggers: (slug: string) => Promise<Trigger[]>;
	createTrigger: (slug: string, trigger: Partial<Trigger>) => Promise<void>;
	updateTrigger: (slug: string, triggerId: string, data: Partial<Trigger>) => Promise<void>;
	deleteTrigger: (slug: string, triggerId: string) => Promise<void>;
}

export const useIntegrations = (): UseIntegrationsReturn => {
	const [integrations, setIntegrations] = useState<Integration[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchIntegrations = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await apiFetch<IntegrationsResponse>({
				path: '/echodash/v1/integrations',
				method: 'GET',
			});

			setIntegrations(response.integrations);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to fetch integrations';
			setError(errorMessage);
			console.error('Failed to fetch integrations:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	const getIntegration = useCallback(async (slug: string): Promise<Integration | null> => {
		try {
			const response = await apiFetch<Integration>({
				path: `/echodash/v1/integrations/${slug}`,
				method: 'GET',
			});

			return response;
		} catch (err) {
			console.error(`Failed to fetch integration ${slug}:`, err);
			return null;
		}
	}, []);

	const updateIntegration = useCallback(async (slug: string, data: Partial<Integration>) => {
		try {
			const response = await apiFetch<Integration>({
				path: `/echodash/v1/integrations/${slug}`,
				method: 'PUT',
				data,
			});

			// Update local state
			setIntegrations(prev => prev.map(integration =>
				integration.slug === slug ? response : integration
			));
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update integration';
			setError(errorMessage);
			throw err;
		}
	}, []);

	const getTriggers = useCallback(async (slug: string): Promise<Trigger[]> => {
		try {
			const response = await apiFetch<{ triggers: Trigger[]; total: number }>({
				path: `/echodash/v1/integrations/${slug}/triggers`,
				method: 'GET',
			});

			return response.triggers;
		} catch (err) {
			console.error(`Failed to fetch triggers for ${slug}:`, err);
			return [];
		}
	}, []);

	const createTrigger = useCallback(async (slug: string, trigger: Partial<Trigger>) => {
		try {
			await apiFetch({
				path: `/echodash/v1/integrations/${slug}/triggers`,
				method: 'POST',
				data: trigger,
			});

			// Refresh integrations to get updated trigger count
			await fetchIntegrations();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to create trigger';
			setError(errorMessage);
			throw err;
		}
	}, [fetchIntegrations]);

	const updateTrigger = useCallback(async (
		slug: string,
		triggerId: string,
		data: Partial<Trigger>
	) => {
		try {
			await apiFetch({
				path: `/echodash/v1/integrations/${slug}/triggers/${triggerId}`,
				method: 'PUT',
				data,
			});

			// Refresh integrations to ensure consistency
			await fetchIntegrations();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update trigger';
			setError(errorMessage);
			throw err;
		}
	}, [fetchIntegrations]);

	const deleteTrigger = useCallback(async (slug: string, triggerId: string) => {
		try {
			await apiFetch({
				path: `/echodash/v1/integrations/${slug}/triggers/${triggerId}`,
				method: 'DELETE',
			});

			// Refresh integrations to get updated trigger count
			await fetchIntegrations();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete trigger';
			setError(errorMessage);
			throw err;
		}
	}, [fetchIntegrations]);

	// Fetch integrations on mount
	useEffect(() => {
		fetchIntegrations();
	}, [fetchIntegrations]);

	return {
		integrations,
		loading,
		error,
		fetchIntegrations,
		getIntegration,
		updateIntegration,
		getTriggers,
		createTrigger,
		updateTrigger,
		deleteTrigger,
	};
};