/**
 * Simple Memory Cache
 * Implements TTL-based caching for frequently accessed data
 */

import { logger } from './logger.js';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) { // 1 minute default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiry });
    
    logger.debug('Cache set', { key, ttl: ttl || this.defaultTTL });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    logger.debug('Cache delete', { key });
    return this.cache.delete(key);
  }

  clear(): void {
    logger.debug('Cache cleared');
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { cleaned, remaining: this.cache.size });
    }
  }
}

// Cache configurations for different data types
export const CACHE_CONFIGS = {
  PRICE: 5000,      // 5 seconds for prices
  TICKER: 10000,    // 10 seconds for tickers  
  ORDERBOOK: 2000,  // 2 seconds for order book
  CANDLES: 60000,   // 1 minute for candles
  BALANCE: 30000,   // 30 seconds for balance
  POSITIONS: 15000, // 15 seconds for positions
} as const;

/**
 * Cache Manager for coordinated cache management
 */
export class CacheManager {
  private caches: MemoryCache<any>[] = [];
  private cleanupTimer: NodeJS.Timeout | null = null;
  private cleanupInterval: number;

  constructor(cleanupInterval: number = 60000) {
    this.cleanupInterval = cleanupInterval;
  }

  addCache(cache: MemoryCache<any>): void {
    this.caches.push(cache);
  }

  startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      logger.debug('Running cache cleanup', { cacheCount: this.caches.length });
      this.caches.forEach(cache => cache.cleanup());
    }, this.cleanupInterval);

    logger.debug('Cache cleanup started', { interval: this.cleanupInterval });
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.debug('Cache cleanup stopped');
    }
  }

  cleanupAll(): void {
    this.caches.forEach(cache => cache.cleanup());
  }

  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
  }
}

// Global cache instances with explicit types
export const priceCache = new MemoryCache<string>(CACHE_CONFIGS.PRICE);
export const tickerCache = new MemoryCache<any>(CACHE_CONFIGS.TICKER);
export const orderbookCache = new MemoryCache<any>(CACHE_CONFIGS.ORDERBOOK);
export const candlesCache = new MemoryCache<any>(CACHE_CONFIGS.CANDLES);
export const balanceCache = new MemoryCache<any>(CACHE_CONFIGS.BALANCE);
export const positionsCache = new MemoryCache<any>(CACHE_CONFIGS.POSITIONS);

// Global cache manager
export const cacheManager = new CacheManager();

// Register all caches with the manager
cacheManager.addCache(priceCache);
cacheManager.addCache(tickerCache);
cacheManager.addCache(orderbookCache);
cacheManager.addCache(candlesCache);
cacheManager.addCache(balanceCache);
cacheManager.addCache(positionsCache);

// Start periodic cleanup
cacheManager.startCleanup();