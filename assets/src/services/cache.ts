/**
 * API Cache Service
 * 
 * Provides intelligent caching for API requests with TTL, invalidation, and storage management.
 */

interface CacheEntry<T> {
	data: T;
	expiry: number;
	timestamp: number;
	key: string;
	size: number; // Approximate size in bytes
}

interface CacheOptions {
	ttl?: number; // Time to live in milliseconds
	maxSize?: number; // Max cache size in bytes
	maxEntries?: number; // Max number of entries
	prefix?: string; // Cache key prefix
}

interface CacheStats {
	hits: number;
	misses: number;
	size: number;
	entries: number;
	hitRate: number;
}

export class APICache {
	private cache = new Map<string, CacheEntry<any>>();
	private stats: CacheStats = {
		hits: 0,
		misses: 0,
		size: 0,
		entries: 0,
		hitRate: 0,
	};

	private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
	private readonly maxSize = 10 * 1024 * 1024; // 10MB
	private readonly maxEntries = 1000;
	private readonly prefix: string;

	constructor(options: CacheOptions = {}) {
		this.defaultTTL = options.ttl || this.defaultTTL;
		this.maxSize = options.maxSize || this.maxSize;
		this.maxEntries = options.maxEntries || this.maxEntries;
		this.prefix = options.prefix || 'ecd_cache_';

		// Load from localStorage if available
		this.loadFromStorage();

		// Cleanup expired entries on initialization
		this.cleanup();

		// Set up periodic cleanup
		setInterval(() => this.cleanup(), this.defaultTTL);

		// Save to storage before page unload
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => this.saveToStorage());
		}
	}

	/**
	 * Get data from cache
	 */
	get<T>(key: string): T | null {
		const fullKey = this.prefix + key;
		const entry = this.cache.get(fullKey);

		if (!entry) {
			this.stats.misses++;
			this.updateHitRate();
			return null;
		}

		// Check if expired
		if (Date.now() > entry.expiry) {
			this.delete(key);
			this.stats.misses++;
			this.updateHitRate();
			return null;
		}

		this.stats.hits++;
		this.updateHitRate();
		return entry.data;
	}

	/**
	 * Set data in cache
	 */
	set<T>(key: string, data: T, ttl?: number): boolean {
		const fullKey = this.prefix + key;
		const expiry = Date.now() + (ttl || this.defaultTTL);
		const size = this.estimateSize(data);

		// Check if we need to make space
		if (this.stats.size + size > this.maxSize || this.stats.entries >= this.maxEntries) {
			this.evictOldest();
		}

		const entry: CacheEntry<T> = {
			data,
			expiry,
			timestamp: Date.now(),
			key: fullKey,
			size,
		};

		// Remove existing entry if it exists
		if (this.cache.has(fullKey)) {
			const oldEntry = this.cache.get(fullKey)!;
			this.stats.size -= oldEntry.size;
		} else {
			this.stats.entries++;
		}

		this.cache.set(fullKey, entry);
		this.stats.size += size;

		return true;
	}

	/**
	 * Delete data from cache
	 */
	delete(key: string): boolean {
		const fullKey = this.prefix + key;
		const entry = this.cache.get(fullKey);

		if (entry) {
			this.cache.delete(fullKey);
			this.stats.size -= entry.size;
			this.stats.entries--;
			return true;
		}

		return false;
	}

	/**
	 * Check if key exists in cache and is not expired
	 */
	has(key: string): boolean {
		const fullKey = this.prefix + key;
		const entry = this.cache.get(fullKey);

		if (!entry) {
			return false;
		}

		if (Date.now() > entry.expiry) {
			this.delete(key);
			return false;
		}

		return true;
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.cache.clear();
		this.stats = {
			hits: 0,
			misses: 0,
			size: 0,
			entries: 0,
			hitRate: 0,
		};
	}

	/**
	 * Clear entries matching a pattern
	 */
	clearPattern(pattern: string | RegExp): number {
		const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
		let cleared = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (regex.test(key)) {
				this.cache.delete(key);
				this.stats.size -= entry.size;
				this.stats.entries--;
				cleared++;
			}
		}

		return cleared;
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		return { ...this.stats };
	}

	/**
	 * Get all cache keys
	 */
	keys(): string[] {
		return Array.from(this.cache.keys()).map(key => key.replace(this.prefix, ''));
	}

	/**
	 * Invalidate cache entries for specific patterns
	 */
	invalidate(patterns: string[]): void {
		patterns.forEach(pattern => {
			this.clearPattern(pattern);
		});
	}

	/**
	 * Cleanup expired entries
	 */
	private cleanup(): void {
		const now = Date.now();

		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiry) {
				this.cache.delete(key);
				this.stats.size -= entry.size;
				this.stats.entries--;
			}
		}
	}

	/**
	 * Evict oldest entries to make space
	 */
	private evictOldest(): void {
		const entries = Array.from(this.cache.entries());
		entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

		// Remove 20% of oldest entries
		const toRemove = Math.ceil(entries.length * 0.2);

		for (let i = 0; i < toRemove && entries.length > 0; i++) {
			const [key, entry] = entries[i];
			this.cache.delete(key);
			this.stats.size -= entry.size;
			this.stats.entries--;
		}
	}

	/**
	 * Estimate the size of data in bytes
	 */
	private estimateSize(data: any): number {
		try {
			const jsonString = JSON.stringify(data);
			return new Blob([jsonString]).size;
		} catch {
			// Fallback estimation
			return JSON.stringify(data).length * 2;
		}
	}

	/**
	 * Update hit rate calculation
	 */
	private updateHitRate(): void {
		const total = this.stats.hits + this.stats.misses;
		this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
	}

	/**
	 * Save cache to localStorage
	 */
	private saveToStorage(): void {
		if (typeof localStorage === 'undefined') return;

		try {
			const cacheData = {
				entries: Array.from(this.cache.entries()),
				stats: this.stats,
				timestamp: Date.now(),
			};

			localStorage.setItem(this.prefix + 'storage', JSON.stringify(cacheData));
		} catch (error) {
			console.warn('Failed to save cache to storage:', error);
		}
	}

	/**
	 * Load cache from localStorage
	 */
	private loadFromStorage(): void {
		if (typeof localStorage === 'undefined') return;

		try {
			const stored = localStorage.getItem(this.prefix + 'storage');
			if (!stored) return;

			const cacheData = JSON.parse(stored);
			const now = Date.now();

			// Only load if not too old (1 hour)
			if (now - cacheData.timestamp > 60 * 60 * 1000) {
				localStorage.removeItem(this.prefix + 'storage');
				return;
			}

			// Restore entries that are not expired
			for (const [key, entry] of cacheData.entries) {
				if (now < entry.expiry) {
					this.cache.set(key, entry);
				}
			}

			// Update stats
			this.updateStatsFromCache();
		} catch (error) {
			console.warn('Failed to load cache from storage:', error);
			// Clear corrupted storage
			try {
				localStorage.removeItem(this.prefix + 'storage');
			} catch {}
		}
	}

	/**
	 * Update stats based on current cache state
	 */
	private updateStatsFromCache(): void {
		this.stats.entries = this.cache.size;
		this.stats.size = Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
	}
}

/**
 * Cache invalidation patterns for different data types
 */
export const CachePatterns = {
	SETTINGS: /settings/,
	INTEGRATIONS: /integrations/,
	TRIGGERS: /triggers/,
	PREVIEW: /preview/,
	ALL: /.*/,
} as const;

/**
 * Global cache instance
 */
export const apiCache = new APICache({
	ttl: 5 * 60 * 1000, // 5 minutes
	maxSize: 5 * 1024 * 1024, // 5MB
	maxEntries: 500,
	prefix: 'ecd_api_',
});

/**
 * Cache decorator for API functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	options: {
		keyGenerator?: (...args: Parameters<T>) => string;
		ttl?: number;
	} = {}
): T {
	const { keyGenerator, ttl } = options;

	return (async (...args: Parameters<T>) => {
		const key = keyGenerator ? keyGenerator(...args) : `${fn.name}_${JSON.stringify(args)}`;
		
		// Try to get from cache first
		const cached = apiCache.get(key);
		if (cached !== null) {
			return cached;
		}

		// Execute function and cache result
		try {
			const result = await fn(...args);
			apiCache.set(key, result, ttl);
			return result;
		} catch (error) {
			// Don't cache errors
			throw error;
		}
	}) as T;
}

/**
 * Cache management utilities
 */
export const CacheManager = {
	/**
	 * Invalidate settings cache
	 */
	invalidateSettings(): void {
		apiCache.invalidate(['settings']);
	},

	/**
	 * Invalidate integrations cache
	 */
	invalidateIntegrations(): void {
		apiCache.invalidate(['integrations']);
	},

	/**
	 * Invalidate triggers cache for specific integration
	 */
	invalidateTriggers(integrationSlug?: string): void {
		if (integrationSlug) {
			apiCache.invalidate([`integrations/${integrationSlug}/triggers`]);
		} else {
			apiCache.invalidate(['triggers']);
		}
	},

	/**
	 * Invalidate all cache
	 */
	invalidateAll(): void {
		apiCache.clear();
	},

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		return apiCache.getStats();
	},
};