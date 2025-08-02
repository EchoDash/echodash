/**
 * useAPI Hook
 * 
 * Generic API hook with caching, error handling, and loading states.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { apiCache } from '../services/cache';

interface UseAPIOptions {
	cache?: boolean;
	cacheTime?: number; // in milliseconds
	autoFetch?: boolean;
	retryCount?: number;
	retryDelay?: number; // in milliseconds
}

interface UseAPIReturn<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	fetch: (forceRefresh?: boolean) => Promise<void>;
	mutate: (newData: T) => void;
	clearCache: () => void;
}

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

export function useAPI<T>(
	path: string,
	options: UseAPIOptions = {}
): UseAPIReturn<T> {
	const {
		cache = true,
		cacheTime = DEFAULT_CACHE_TIME,
		autoFetch = true,
		retryCount = DEFAULT_RETRY_COUNT,
		retryDelay = DEFAULT_RETRY_DELAY,
	} = options;

	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(autoFetch);
	const [error, setError] = useState<string | null>(null);
	
	const abortControllerRef = useRef<AbortController | null>(null);
	const mountedRef = useRef(true);

	const clearCache = useCallback(() => {
		if (cache) {
			apiCache.delete(path);
		}
	}, [cache, path]);

	const getCachedData = useCallback((): T | null => {
		if (!cache) return null;
		return apiCache.get<T>(path);
	}, [cache, path]);

	const setCachedData = useCallback((newData: T) => {
		if (cache) {
			apiCache.set(path, newData, cacheTime);
		}
	}, [cache, cacheTime, path]);

	const fetchWithRetry = useCallback(async (
		attemptNumber = 0
	): Promise<T> => {
		try {
			const response = await apiFetch<T>({
				path,
				method: 'GET',
				signal: abortControllerRef.current?.signal,
			});

			return response;
		} catch (err) {
			if (attemptNumber < retryCount - 1) {
				// Wait before retrying
				await new Promise(resolve => setTimeout(resolve, retryDelay));
				return fetchWithRetry(attemptNumber + 1);
			}
			throw err;
		}
	}, [path, retryCount, retryDelay]);

	const fetch = useCallback(async (forceRefresh = false) => {
		// Check cache first
		if (!forceRefresh) {
			const cachedData = getCachedData();
			if (cachedData !== null) {
				setData(cachedData);
				setLoading(false);
				return;
			}
		}

		// Abort any ongoing request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new abort controller
		abortControllerRef.current = new AbortController();

		setLoading(true);
		setError(null);

		try {
			const response = await fetchWithRetry();

			if (mountedRef.current) {
				setData(response);
				setCachedData(response);
			}
		} catch (err) {
			if (mountedRef.current) {
				// Don't set error if request was aborted
				if (err instanceof Error && err.name !== 'AbortError') {
					const errorMessage = err.message || 'Failed to fetch data';
					setError(errorMessage);
					console.error(`API error for ${path}:`, err);
				}
			}
		} finally {
			if (mountedRef.current) {
				setLoading(false);
			}
		}
	}, [getCachedData, setCachedData, fetchWithRetry]);

	const mutate = useCallback((newData: T) => {
		setData(newData);
		setCachedData(newData);
	}, [setCachedData]);

	// Auto-fetch on mount if enabled
	useEffect(() => {
		if (autoFetch) {
			fetch();
		}

		return () => {
			mountedRef.current = false;
			// Abort any ongoing request when unmounting
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [autoFetch, fetch]);

	return {
		data,
		loading,
		error,
		fetch,
		mutate,
		clearCache,
	};
}

/**
 * useMutation Hook
 * 
 * For POST, PUT, DELETE operations with optimistic updates.
 */
interface UseMutationOptions<T, V> {
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
}

interface UseMutationReturn<T, V> {
	mutate: (variables: V) => Promise<T | undefined>;
	loading: boolean;
	error: string | null;
	data: T | null;
	reset: () => void;
}

export function useMutation<T = any, V = any>(
	mutationFn: (variables: V) => Promise<T>,
	options: UseMutationOptions<T, V> = {}
): UseMutationReturn<T, V> {
	const { onSuccess, onError } = options;

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<T | null>(null);

	const mutate = useCallback(async (variables: V): Promise<T | undefined> => {
		setLoading(true);
		setError(null);

		try {
			const result = await mutationFn(variables);
			setData(result);
			
			if (onSuccess) {
				onSuccess(result);
			}
			
			return result;
		} catch (err) {
			const errorObj = err instanceof Error ? err : new Error('Mutation failed');
			const errorMessage = errorObj.message;
			
			setError(errorMessage);
			
			if (onError) {
				onError(errorObj);
			}
			
			console.error('Mutation error:', err);
			return undefined;
		} finally {
			setLoading(false);
		}
	}, [mutationFn, onSuccess, onError]);

	const reset = useCallback(() => {
		setLoading(false);
		setError(null);
		setData(null);
	}, []);

	return {
		mutate,
		loading,
		error,
		data,
		reset,
	};
}