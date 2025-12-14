/**
 * Cache utility for storing data in LocalStorage with timestamp-based expiration
 */
export class Cache {
  constructor(expiresIn = 3600000) { // Default 1 hour in milliseconds
    this.expiresIn = expiresIn;
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if not found/expired
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      const entry = JSON.parse(item);
      
      if (!this.isValid(entry)) {
        // Clear stale entry
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Cache get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} [customExpiresIn] - Optional custom expiration time in milliseconds
   * @returns {boolean} - Success status
   */
  set(key, data, customExpiresIn) {
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        expiresIn: customExpiresIn !== undefined ? customExpiresIn : this.expiresIn
      };

      localStorage.setItem(key, JSON.stringify(entry));
      return true;
    } catch (error) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('LocalStorage quota exceeded, clearing old entries');
        this.clearStaleEntries();
        
        // Try again after clearing
        try {
          const entry = {
            data,
            timestamp: Date.now(),
            expiresIn: customExpiresIn !== undefined ? customExpiresIn : this.expiresIn
          };
          localStorage.setItem(key, JSON.stringify(entry));
          return true;
        } catch (retryError) {
          console.error('Cache set failed after clearing:', retryError);
          return false;
        }
      }
      
      console.error(`Cache set error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Check if a cache entry is valid (not expired)
   * @param {Object} entry - Cache entry object
   * @returns {boolean} - True if valid, false if expired
   */
  isValid(entry) {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    if (!entry.timestamp || !entry.expiresIn) {
      return false;
    }

    const currentTime = Date.now();
    const age = currentTime - entry.timestamp;
    
    return age < entry.expiresIn;
  }

  /**
   * Remove a specific cache entry
   * @param {string} key - Cache key to remove
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Cache remove error for key "${key}":`, error);
    }
  }

  /**
   * Clear all stale entries from LocalStorage
   * This helps manage quota by removing expired data
   */
  clearStaleEntries() {
    try {
      const keysToRemove = [];
      const cacheKeys = [];
      
      // Iterate through all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const item = localStorage.getItem(key);
          if (!item) continue;

          const entry = JSON.parse(item);
          
          // Check if this looks like a cache entry
          if (entry && entry.timestamp && entry.expiresIn) {
            cacheKeys.push({ key, entry, size: item.length });
            
            if (!this.isValid(entry)) {
              keysToRemove.push(key);
            }
          }
        } catch (parseError) {
          // Skip items that aren't valid JSON or cache entries
          continue;
        }
      }

      // Remove all stale entries
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // If we still need more space, remove oldest entries
      if (keysToRemove.length === 0 && cacheKeys.length > 0) {
        // Sort by timestamp (oldest first)
        cacheKeys.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
        
        // Remove oldest 25% of cache entries
        const toRemove = Math.ceil(cacheKeys.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
          localStorage.removeItem(cacheKeys[i].key);
          keysToRemove.push(cacheKeys[i].key);
        }
      }
      
      console.log(`Cleared ${keysToRemove.length} cache entries (${keysToRemove.length - (keysToRemove.length - cacheKeys.length)} stale, ${keysToRemove.length - cacheKeys.length} oldest)`);
    } catch (error) {
      console.error('Error clearing stale entries:', error);
    }
  }

  /**
   * Get cache usage statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    try {
      let totalSize = 0;
      let cacheEntries = 0;
      let expiredEntries = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        totalSize += item.length;
        
        try {
          const entry = JSON.parse(item);
          if (entry && entry.timestamp && entry.expiresIn) {
            cacheEntries++;
            if (!this.isValid(entry)) {
              expiredEntries++;
            }
          }
        } catch (parseError) {
          // Not a cache entry
        }
      }
      
      return {
        totalSize,
        cacheEntries,
        expiredEntries,
        estimatedQuotaUsage: (totalSize / (5 * 1024 * 1024)) * 100 // Assume 5MB quota
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalSize: 0, cacheEntries: 0, expiredEntries: 0, estimatedQuotaUsage: 0 };
    }
  }

  /**
   * Clear all cache entries (use with caution)
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export default Cache;
