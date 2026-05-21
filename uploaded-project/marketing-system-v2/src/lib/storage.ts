import LZString from 'lz-string';
import { get, set, del, keys, clear } from 'idb-keyval';

/**
 * Enterprise-grade persistence architecture using IndexedDB.
 * Bypasses 5MB LocalStorage limits and prevents main-thread blocking.
 */
export const StorageManager = {
  async save(key: string, data: any): Promise<void> {
    try {
      // We still compress for storage efficiency, though IndexedDB has more space
      const jsonString = JSON.stringify(data);
      const compressed = LZString.compressToUTF16(jsonString);
      await set(key, compressed);
    } catch (e) {
      console.error(`IndexedDB save failed for ${key}:`, e);
      // Fallback to uncompressed if needed, but set() is async and robust
      await set(key, data);
    }
  },

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const stored = await get(key);
      if (!stored) {
        // Migration check: check for legacy LocalStorage data
        const legacy = localStorage.getItem(key);
        if (legacy) {
          console.log(`Migrating ${key} from LocalStorage to IndexedDB`);
          const data = this._parseStored(legacy);
          await this.save(key, data);
          localStorage.removeItem(key);
          return data;
        }
        return defaultValue;
      }

      return this._parseStored(stored);
    } catch (e) {
      console.warn(`Storage load failed for ${key}, returning default.`, e);
      return defaultValue;
    }
  },

  _parseStored(stored: any): any {
    if (typeof stored !== 'string') return stored;
    try {
      const decompressed = LZString.decompressFromUTF16(stored);
      return JSON.parse(decompressed || stored);
    } catch {
      return JSON.parse(stored);
    }
  },

  async remove(key: string): Promise<void> {
    await del(key);
  },

  async clearAll(): Promise<void> {
    await clear();
  }
};

export const STORAGE_KEYS = {
  COMPANIES: 'mis_companies',
  OFFERS: 'mis_offers',
  PROGRESS: 'mis_progress',
  ACTIVE_COMPANY: 'mis_active_company_id',
  INDUSTRY_INTELLIGENCE: 'industryIntelligence',
  EDIT_HISTORY: 'editHistory',
  NEEDS_OFFER_UPDATE: 'mis_needs_offer_update',
};

export async function exportSessionData() {
  const [companies, offers, progress, industryIntelligence, needsOfferUpdate] = await Promise.all([
    StorageManager.load(STORAGE_KEYS.COMPANIES, []),
    StorageManager.load(STORAGE_KEYS.OFFERS, {}),
    StorageManager.load(STORAGE_KEYS.PROGRESS, {}),
    StorageManager.load(STORAGE_KEYS.INDUSTRY_INTELLIGENCE, {}),
    StorageManager.load(STORAGE_KEYS.NEEDS_OFFER_UPDATE, {}),
  ]);

  const data = {
    companies,
    offers,
    progress,
    needsOfferUpdate,
    industryIntelligence,
    exportAt: new Date().toISOString(),
    version: '1.4.0'
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mis-intelligence-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSessionData(jsonData: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonData);
    if (!data.companies || !data.offers) throw new Error('Invalid data format: Missing core keys');
    
    if (!Array.isArray(data.companies)) throw new Error('Invalid data format: companies must be an array');

    await Promise.all([
      StorageManager.save(STORAGE_KEYS.COMPANIES, data.companies),
      StorageManager.save(STORAGE_KEYS.OFFERS, data.offers),
      StorageManager.save(STORAGE_KEYS.PROGRESS, data.progress || {}),
      StorageManager.save(STORAGE_KEYS.NEEDS_OFFER_UPDATE, data.needsOfferUpdate || {}),
      StorageManager.save(STORAGE_KEYS.INDUSTRY_INTELLIGENCE, data.industryIntelligence || {}),
    ]);
    
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
