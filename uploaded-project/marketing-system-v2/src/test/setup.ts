import '@testing-library/jest-dom';

// Mock idb-keyval (IndexedDB) — not available in jsdom
vi.mock('idb-keyval', () => {
  const store = new Map<string, any>();
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key))),
    set: vi.fn((key: string, value: any) => { store.set(key, value); return Promise.resolve(); }),
    del: vi.fn((key: string) => { store.delete(key); return Promise.resolve(); }),
    keys: vi.fn(() => Promise.resolve([...store.keys()])),
    clear: vi.fn(() => { store.clear(); return Promise.resolve(); }),
  };
});

// Provide a minimal localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
