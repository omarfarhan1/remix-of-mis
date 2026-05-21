import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export type Theme = 'light' | 'dark';
export type PendingSaveType = 'company' | 'offer' | null;

const THEME_STORAGE_KEY = 'mis_theme';

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  return 'dark';
}

function applyThemeSideEffect(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  // Intelligence Hub
  isHubOpen: boolean;
  openHub: () => void;
  closeHub: () => void;

  // Modals
  showFormulaModal: boolean;
  openFormulaModal: () => void;
  closeFormulaModal: () => void;

  showCompanyModal: boolean;
  openCompanyModal: () => void;
  closeCompanyModal: () => void;

  // Conflict modal
  showConflictModal: boolean;
  pendingSaveType: PendingSaveType;
  openConflictModal: (type: Exclude<PendingSaveType, null>) => void;
  closeConflictModal: () => void;

  // Toasts
  successToast: string | null;
  errorToast: string | null;
  showSuccess: (msg: string, ttlMs?: number) => void;
  showError: (msg: string) => void;
  dismissSuccess: () => void;
  dismissError: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyThemeSideEffect(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    applyThemeSideEffect(next);
    set({ theme: next });
  },

  isHubOpen: false,
  openHub: () => set({ isHubOpen: true }),
  closeHub: () => set({ isHubOpen: false }),

  showFormulaModal: false,
  openFormulaModal: () => set({ showFormulaModal: true }),
  closeFormulaModal: () => set({ showFormulaModal: false }),

  showCompanyModal: false,
  openCompanyModal: () => set({ showCompanyModal: true }),
  closeCompanyModal: () => set({ showCompanyModal: false }),

  showConflictModal: false,
  pendingSaveType: null,
  openConflictModal: (type) => set({ showConflictModal: true, pendingSaveType: type }),
  closeConflictModal: () => set({ showConflictModal: false }),

  successToast: null,
  errorToast: null,
  showSuccess: (msg) => set({ successToast: msg }),
  showError: (msg) => set({ errorToast: msg }),
  dismissSuccess: () => set({ successToast: null }),
  dismissError: () => set({ errorToast: null }),
}));

// Apply initial theme side effect once on module load (client only).
if (typeof document !== 'undefined') {
  applyThemeSideEffect(useUIStore.getState().theme);
}

// ─── Selector hooks (minimize rerenders) ────────────────────────────────

export const useTheme = () => useUIStore((s) => s.theme);
export const useThemeControls = () =>
  useUIStore(useShallow((s) => ({ theme: s.theme, toggleTheme: s.toggleTheme })));

export const useHubOpen = () => useUIStore((s) => s.isHubOpen);
export const useHubControls = () =>
  useUIStore(useShallow((s) => ({ openHub: s.openHub, closeHub: s.closeHub })));

export const useFormulaModal = () =>
  useUIStore(useShallow((s) => ({
    isOpen: s.showFormulaModal,
    open: s.openFormulaModal,
    close: s.closeFormulaModal,
  })));

export const useCompanyModal = () =>
  useUIStore(useShallow((s) => ({
    isOpen: s.showCompanyModal,
    open: s.openCompanyModal,
    close: s.closeCompanyModal,
  })));

export const useConflictModal = () =>
  useUIStore(useShallow((s) => ({
    isOpen: s.showConflictModal,
    pendingSaveType: s.pendingSaveType,
    open: s.openConflictModal,
    close: s.closeConflictModal,
  })));

export const useToasts = () =>
  useUIStore(useShallow((s) => ({
    successToast: s.successToast,
    errorToast: s.errorToast,
    dismissError: s.dismissError,
  })));

export const useToastActions = () =>
  useUIStore(useShallow((s) => ({ showSuccess: s.showSuccess, showError: s.showError })));