/**
 * useSettings Hook
 * 
 * Custom hook for managing EchoDash settings via the REST API.
 */

import { useState, useCallback, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';

interface Settings {
	endpoint: string;
	debug_mode: boolean;
	version: string;
	settings: Record<string, any>;
	capabilities: {
		can_manage_options: boolean;
		can_edit_posts: boolean;
		is_admin: boolean;
	};
}

interface UseSettingsReturn {
	settings: Settings | null;
	loading: boolean;
	error: string | null;
	fetchSettings: () => Promise<void>;
	updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
	updateEndpoint: (endpoint: string) => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
	const [settings, setSettings] = useState<Settings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSettings = useCallback(async () => {
		setLoading(true);
		setError(null);
		
		try {
			const response = await apiFetch<Settings>({
				path: '/echodash/v1/settings',
				method: 'GET',
			});
			
			setSettings(response);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
			setError(errorMessage);
			console.error('Failed to fetch settings:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
		if (!settings) return;

		// Optimistic update
		setSettings(prev => prev ? { ...prev, ...newSettings } : null);
		setError(null);

		try {
			const response = await apiFetch<Settings>({
				path: '/echodash/v1/settings',
				method: 'POST',
				data: newSettings,
			});

			setSettings(response);
		} catch (err) {
			// Revert on error
			await fetchSettings();
			const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
			setError(errorMessage);
			throw err;
		}
	}, [settings, fetchSettings]);

	const updateEndpoint = useCallback(async (endpoint: string) => {
		await updateSettings({ endpoint });
	}, [updateSettings]);

	// Fetch settings on mount
	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	return {
		settings,
		loading,
		error,
		fetchSettings,
		updateSettings,
		updateEndpoint,
	};
};