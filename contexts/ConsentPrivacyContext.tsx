import ConsentPrivacyModal from "@/components/modals/ConsentPrivacyModal";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ConsentPreferences = {
  preferences: boolean;
  analytics: boolean;
};

type ConsentPrivacyContextType = {
  isConsentPopupVisible: boolean;
  showConsentPopup: () => void;
  hideConsentPopup: () => void;
  toggleConsentPopup: () => void;
};

const CONSENT_STORAGE_KEY = "@aide_consent_privacy";
const DEFAULT_PREFERENCES: ConsentPreferences = {
  preferences: true,
  analytics: false,
};

const AUTO_POPUP_EXCLUDED_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/recover-password",
  "/terms-of-service",
]);

const ConsentPrivacyContext = createContext<
  ConsentPrivacyContextType | undefined
>(undefined);

const scopedConsentKey = (userId: string) => `${CONSENT_STORAGE_KEY}:${userId}`;

export const ConsentPrivacyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [isConsentPopupVisible, setConsentPopupVisible] = useState(false);
  const [preferences, setPreferences] =
    useState<ConsentPreferences>(DEFAULT_PREFERENCES);

  const showConsentPopup = useCallback(() => {
    setConsentPopupVisible(true);
  }, []);

  const hideConsentPopup = useCallback(() => {
    setConsentPopupVisible(false);
  }, []);

  const toggleConsentPopup = useCallback(() => {
    setConsentPopupVisible((current) => !current);
  }, []);

  const persistConsent = useCallback(
    async (nextPreferences: ConsentPreferences) => {
      if (!user?.id) {
        hideConsentPopup();
        return;
      }

      try {
        await AsyncStorage.setItem(
          scopedConsentKey(user.id),
          JSON.stringify({
            acceptedAt: new Date().toISOString(),
            preferences: nextPreferences,
          }),
        );
      } catch (error) {
        console.log("Erro ao guardar consentimento de privacidade", error);
      } finally {
        hideConsentPopup();
      }
    },
    [hideConsentPopup, user?.id],
  );

  const handleAcceptSelected = useCallback(() => {
    void persistConsent(preferences);
  }, [persistConsent, preferences]);

  const handleAcceptAll = useCallback(() => {
    const nextPreferences = {
      preferences: true,
      analytics: true,
    };
    setPreferences(nextPreferences);
    void persistConsent(nextPreferences);
  }, [persistConsent]);

  useEffect(() => {
    setPreferences(DEFAULT_PREFERENCES);
    setConsentPopupVisible(false);
  }, [user?.id]);

  useEffect(() => {
    if (isLoading || !user?.id) return;
    if (AUTO_POPUP_EXCLUDED_ROUTES.has(pathname)) return;

    let isMounted = true;

    const loadConsentState = async () => {
      try {
        const storedConsent = await AsyncStorage.getItem(
          scopedConsentKey(user.id),
        );

        if (!storedConsent && isMounted) {
          setConsentPopupVisible(true);
        }
      } catch (error) {
        console.log("Erro ao carregar consentimento de privacidade", error);
      }
    };

    void loadConsentState();

    return () => {
      isMounted = false;
    };
  }, [isLoading, pathname, user?.id]);

  const value = useMemo(
    () => ({
      isConsentPopupVisible,
      showConsentPopup,
      hideConsentPopup,
      toggleConsentPopup,
    }),
    [
      hideConsentPopup,
      isConsentPopupVisible,
      showConsentPopup,
      toggleConsentPopup,
    ],
  );

  return (
    <ConsentPrivacyContext.Provider value={value}>
      {children}
      <ConsentPrivacyModal
        visible={isConsentPopupVisible}
        preferences={preferences}
        onChangePreferences={setPreferences}
        onAcceptSelected={handleAcceptSelected}
        onAcceptAll={handleAcceptAll}
        onRequestClose={hideConsentPopup}
      />
    </ConsentPrivacyContext.Provider>
  );
};

export const useConsentPrivacy = () => {
  const context = useContext(ConsentPrivacyContext);

  if (!context) {
    throw new Error(
      "useConsentPrivacy must be used within a ConsentPrivacyProvider",
    );
  }

  return context;
};
