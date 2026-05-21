import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager, STORAGE_KEYS } from '../lib/storage';

// idb-keyval is mocked in setup.ts
import * as idb from 'idb-keyval';

describe('StorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('saves and loads a value round-trip', async () => {
    const data = { name: 'Acme Corp', industry: 'SaaS' };
    await StorageManager.save(STORAGE_KEYS.COMPANIES, [data]);
    const loaded = await StorageManager.load<typeof data[]>(STORAGE_KEYS.COMPANIES, []);
    expect(loaded).toEqual([data]);
  });

  it('returns the default value when no data is stored', async () => {
    const result = await StorageManager.load('nonexistent_key', { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it('migrates a legacy localStorage key to IndexedDB on first load', async () => {
    const legacy = JSON.stringify([{ id: '1', name: 'Legacy Co' }]);
    localStorage.setItem('mis_companies', legacy);

    const result = await StorageManager.load(STORAGE_KEYS.COMPANIES, []);
    expect(result).toEqual([{ id: '1', name: 'Legacy Co' }]);
    expect(localStorage.getItem('mis_companies')).toBeNull();
    expect(idb.set).toHaveBeenCalled();
  });

  it('removes a key', async () => {
    await StorageManager.save('tmp_key', 'some data');
    await StorageManager.remove('tmp_key');
    expect(idb.del).toHaveBeenCalledWith('tmp_key');
  });

  it('STORAGE_KEYS covers all required keys', () => {
    expect(STORAGE_KEYS).toMatchObject({
      COMPANIES: expect.any(String),
      OFFERS: expect.any(String),
      PROGRESS: expect.any(String),
      ACTIVE_COMPANY: expect.any(String),
      INDUSTRY_INTELLIGENCE: expect.any(String),
      EDIT_HISTORY: expect.any(String),
      NEEDS_OFFER_UPDATE: expect.any(String),
    });
  });
});
