import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CONSENT_STORAGE_KEY = "@aide_consent";
const CONSENT_VERSION = 1;
const AUTO_OPEN_BLOCKED_ROUTES = [
  "/",
  "/login",
  "/register",
  "/recover-password",
  "/terms-of-service",
];

export type ConsentState = {
  version: number;
  strictlyNecessary: true;
  preferences: boolean;
  analytics: boolean;
  acceptedAt: string;
  updatedAt: string;
};

type ConsentDraft = {
  preferences: boolean;
  analytics: boolean;
};

interface ConsentContextType {
  consent: ConsentState | null;
  draft: ConsentDraft;
  isLoading: boolean;
  isModalVisible: boolean;
  isPreviewMode: boolean;
  setDraftValue: (key: keyof ConsentDraft, value: boolean) => void;
  acceptSelected: () => Promise<void>;
  acceptAll: () => Promise<void>;
  openConsentPreview: () => void;
  closeConsentPreview: () => void;
}

const DEFAULT_DRAFT: ConsentDraft = {
  preferences: true,
  analytics: false,
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const getConsentStorageKey = (userId: string) => `${CONSENT_STORAGE_KEY}:${userId}`;

const stripQueryString = (path: string) => path.split("?")[0];

const getDraftFromConsent = (consent: ConsentState | null): ConsentDraft => ({
  preferences: consent?.preferences ?? DEFAULT_DRAFT.preferences,
  analytics: consent?.analytics ?? DEFAULT_DRAFT.analytics,
});

export const ConsentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const userId = user?.id;

  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [draft, setDraft] = useState<ConsentDraft>(DEFAULT_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const setDraftValue = useCallback((key: keyof ConsentDraft, value: boolean) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const persistConsent = useCallback(
    async (nextDraft: ConsentDraft) => {
      if (!userId) return;

      const now = new Date().toISOString();
      const nextConsent: ConsentState = {
        version: CONSENT_VERSION,
        strictlyNecessary: true,
        preferences: nextDraft.preferences,
        analytics: nextDraft.analytics,
        acceptedAt: consent?.acceptedAt ?? now,
        updatedAt: now,
      };

      await AsyncStorage.setItem(
        getConsentStorageKey(userId),
        JSON.stringify(nextConsent),
      );

      setConsent(nextConsent);
      setDraft(getDraftFromConsent(nextConsent));
      setIsModalVisible(false);
      setIsPreviewMode(false);
      setHasAutoOpened(true);
    },
    [consent?.acceptedAt, userId],
  );

  const acceptSelected = useCallback(async () => {
    await persistConsent(draft);
  }, [draft, persistConsent]);

  const acceptAll = useCallback(async () => {
    const nextDraft: ConsentDraft = {
      preferences: true,
      analytics: true,
    };

    setDraft(nextDraft);
    await persistConsent(nextDraft);
  }, [persistConsent]);

  const openConsentPreview = useCallback(() => {
    setDraft(getDraftFromConsent(consent));
    setIsPreviewMode(true);
    setIsModalVisible(true);
  }, [consent]);

  const closeConsentPreview = useCallback(() => {
    if (!isPreviewMode) return;
    setDraft(getDraftFromConsent(consent));
    setIsModalVisible(false);
    setIsPreviewMode(false);
  }, [consent, isPreviewMode]);

  useEffect(() => {
    const loadConsent = async () => {
      setHasAutoOpened(false);

      if (!userId) {
        setConsent(null);
        setDraft(DEFAULT_DRAFT);
        setIsModalVisible(false);
        setIsPreviewMode(false);
        setHasAutoOpened(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const raw = await AsyncStorage.getItem(getConsentStorageKey(userId));

        if (!raw) {
          setConsent(null);
          setDraft(DEFAULT_DRAFT);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<ConsentState>;
        const restoredConsent: ConsentState = {
          version: CONSENT_VERSION,
          strictlyNecessary: true,
          preferences: Boolean(parsed.preferences),
          analytics: Boolean(parsed.analytics),
          acceptedAt:
            typeof parsed.acceptedAt === "string"
              ? parsed.acceptedAt
              : new Date().toISOString(),
          updatedAt:
            typeof parsed.updatedAt === "string"
              ? parsed.updatedAt
              : new Date().toISOString(),
        };

        setConsent(restoredConsent);
        setDraft(getDraftFromConsent(restoredConsent));
      } catch (error) {
        console.log("Erro ao carregar consentimento RGPD", error);
        setConsent(null);
        setDraft(DEFAULT_DRAFT);
      } finally {
        setIsLoading(false);
      }
    };

    void loadConsent();
  }, [userId]);

  useEffect(() => {
    if (isLoading || !userId || consent || hasAutoOpened) return;

    const currentPath = stripQueryString(pathname);
    if (AUTO_OPEN_BLOCKED_ROUTES.includes(currentPath)) return;

    setDraft(getDraftFromConsent(null));
    setIsPreviewMode(false);
    setIsModalVisible(true);
    setHasAutoOpened(true);
  }, [consent, hasAutoOpened, isLoading, pathname, userId]);

  const value = useMemo(
    () => ({
      consent,
      draft,
      isLoading,
      isModalVisible,
      isPreviewMode,
      setDraftValue,
      acceptSelected,
      acceptAll,
      openConsentPreview,
      closeConsentPreview,
    }),
    [
      acceptAll,
      acceptSelected,
      closeConsentPreview,
      consent,
      draft,
      isLoading,
      isModalVisible,
      isPreviewMode,
      openConsentPreview,
      setDraftValue,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
};

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
};
