import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BOOKING_OPTION_EACH_DAY_DATA_DEFAULT } from '@/lib/constants';

// Note: We don't import GapService here to avoid circular dependency
// Instead we fetch settings directly

// ============ TYPES ============

export interface UserData {
  objectId?: string;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  sessionToken?: string;
  [key: string]: any;
}

export interface IpHash {
  objectId?: string;
  HashIP?: string;
  userData?: UserData;
  [key: string]: any;
}

export interface SettingData {
  WORKING_DAY_COUNT?: number;
  BOOKING_OPTION_EACH_DAY?: Record<string, string>;
  IS_SHOW_BOOKING_FORM?: string;
  [key: string]: any;
}

export interface AppState {
  // Auth & User
  userData: UserData | null;
  sessionToken: string | null;
  isAuthenticated: boolean;

  // Settings
  settings: SettingData;
  isSettingsLoaded: boolean;

  // IP Hash
  ipHash: IpHash | null;

  // Locale
  locale: string;

  // Loading states
  isLoading: boolean;

  // Redux states
  categoryRedux: any[] | null;
  channelMonitorRedux: any | null;
  tempConsignmentRedux: any | null;
  unitAddressRedux: any | null;
}

export interface AppActions {
  // Auth actions
  setUserData: (userData: UserData | null) => void;
  setSessionToken: (token: string | null) => void;
  login: (userData: UserData, sessionToken: string) => void;
  logout: () => void;

  // Settings actions
  setSettings: (settings: SettingData) => void;
  updateSettingWithKey: (key: string, value: any) => void;
  fetchSettings: () => Promise<SettingData>;
  getSettingWithKey: <T = any>(key: string, defaultValue?: T) => T;

  // IP Hash actions
  setIpHash: (ipHash: IpHash | null) => void;

  // Locale actions
  setLocale: (locale: string) => void;

  // Loading actions
  setLoading: (isLoading: boolean) => void;

  // Auth key helpers
  getAuthKeyBearer: () => string;

  // Reset
  reset: () => void;

  // Redux actions
  setCategoryRedux: (data: any[]) => void;
  setChannelMonitorRedux: (data: any) => void;
  setTempConsignment: (data: any) => void;
  setUnitAddressRedux: (data: any) => void;
}

type AppStore = AppState & AppActions;

// ============ INITIAL STATE ============

const initialState: AppState = {
  userData: null,
  sessionToken: null,
  isAuthenticated: false,
  settings: {
    WORKING_DAY_COUNT: 14,
    BOOKING_OPTION_EACH_DAY: BOOKING_OPTION_EACH_DAY_DATA_DEFAULT,
    IS_SHOW_BOOKING_FORM: 'true',
    BOOKING_OPTION_CUSTOM_EACH_DAY: '',
  },
  isSettingsLoaded: false,
  ipHash: null,
  locale: 'vi',
  isLoading: false,
  categoryRedux: null,
  channelMonitorRedux: null,
  tempConsignmentRedux: null,
  unitAddressRedux: null,
};

// ============ STORE ============

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Auth actions
      setUserData: userData => {
        set({
          userData,
          isAuthenticated: !!userData,
        });
      },

      setSessionToken: token => {
        set({ sessionToken: token });
      },

      login: (userData, sessionToken) => {
        set({
          userData,
          sessionToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          userData: null,
          sessionToken: null,
          isAuthenticated: false,
        });
      },

      // Settings actions
      setSettings: settings => {
        set({
          settings: { ...get().settings, ...settings },
          isSettingsLoaded: true,
        });
      },

      updateSettingWithKey: (key, value) => {
        set({
          settings: {
            ...get().settings,
            [key]: value,
          },
        });
      },

      fetchSettings: async () => {
        try {
          set({ isLoading: true });

          // Fetch settings through local Next.js API proxy
          const HOST = process.env.NEXT_PUBLIC_SERVER_URL || '/api/parse';
          const response = await fetch(`${HOST}/classes/Setting`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_APP_ID || '',
              'X-Parse-REST-API-Key':
                process.env.NEXT_PUBLIC_REST_API_KEY || '',
            },
          });
          const data = await response.json();

          if (data && data.results && data.results.length > 0) {
            const settingData = data.results[0]?.Setting || {};
            set({
              settings: { ...get().settings, ...settingData },
              isSettingsLoaded: true,
              isLoading: false,
            });
            return settingData;
          }

          set({ isLoading: false });
          return get().settings;
        } catch (error) {
          console.error('Error fetching settings:', error);
          set({ isLoading: false });
          return get().settings;
        }
      },

      getSettingWithKey: <T = any>(key: string, defaultValue?: T): T => {
        const { settings } = get();
        const value = settings[key];

        if (value === undefined || value === null) {
          return defaultValue as T;
        }

        // Handle string booleans
        if (typeof defaultValue === 'boolean') {
          return (value === 'true' || value === true) as T;
        }

        return value as T;
      },

      // IP Hash actions
      setIpHash: ipHash => {
        set({ ipHash });
      },

      // Locale actions
      setLocale: locale => {
        set({ locale });
      },

      // Loading actions
      setLoading: isLoading => {
        set({ isLoading });
      },

      // Auth key helpers
      getAuthKeyBearer: () => {
        const { sessionToken } = get();
        return sessionToken || '';
      },

      // Reset
      reset: () => {
        set(initialState);
      },

      // Redux actions
      setCategoryRedux: data => set({ categoryRedux: data }),
      setChannelMonitorRedux: data => set({ channelMonitorRedux: data }),
      setTempConsignment: data => set({ tempConsignmentRedux: data }),
      setUnitAddressRedux: data => set({ unitAddressRedux: data }),
    }),
    {
      name: 'gap-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        userData: state.userData,
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
        locale: state.locale,
        // Don't persist settings - fetch fresh from API
      }),
    }
  )
);

// ============ SELECTORS ============

export const selectUserData = (state: AppStore) => state.userData;
export const selectIsAuthenticated = (state: AppStore) => state.isAuthenticated;
export const selectSettings = (state: AppStore) => state.settings;
export const selectSessionToken = (state: AppStore) => state.sessionToken;
export const selectLocale = (state: AppStore) => state.locale;
export const selectIsLoading = (state: AppStore) => state.isLoading;

// ============ HELPER HOOKS ============

export const useUserData = () => useAppStore(selectUserData);
export const useIsAuthenticated = () => useAppStore(selectIsAuthenticated);
export const useSettings = () => useAppStore(selectSettings);
export const useSessionToken = () => useAppStore(selectSessionToken);
export const useLocale = () => useAppStore(selectLocale);
export const useIsLoading = () => useAppStore(selectIsLoading);

// ============ NON-REACT HELPERS (for use in services) ============

export const getStoreState = () => useAppStore.getState();

export const StoreServices = {
  getSetting: async (): Promise<SettingData> => {
    const store = useAppStore.getState();

    // If settings already loaded, return cached
    if (store.isSettingsLoaded) {
      return store.settings;
    }

    // Otherwise fetch from API
    return store.fetchSettings();
  },

  getSettingWithKey: <T = any>(key: string, defaultValue?: T): T => {
    return useAppStore.getState().getSettingWithKey(key, defaultValue);
  },

  getUserData: (): UserData | null => {
    return useAppStore.getState().userData;
  },

  getAuthKeyBearer: (): string => {
    return useAppStore.getState().getAuthKeyBearer();
  },

  getIpHash: (): IpHash | null => {
    return useAppStore.getState().ipHash;
  },

  setUserData: (userData: UserData | null): void => {
    useAppStore.getState().setUserData(userData);
  },

  setIpHash: (ipHash: IpHash | null): void => {
    useAppStore.getState().setIpHash(ipHash);
  },

  login: (userData: UserData, sessionToken: string): void => {
    useAppStore.getState().login(userData, sessionToken);
  },

  logout: (): void => {
    useAppStore.getState().logout();
  },
};

export default useAppStore;
