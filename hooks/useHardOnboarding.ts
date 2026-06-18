import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

const ONBOARDING_STORAGE_KEY = "@aide_onboarding";
const ONBOARDING_VERSION = 1;

export type HardOnboardingStep = "health-connect" | "add-widget" | "completed";

export type HardOnboardingState = {
  version: number;
  completed: boolean;
  healthConnectDone: boolean;
  firstWidgetAddedDone: boolean;
  completedAt: string | null;
};

const DEFAULT_ONBOARDING_STATE: HardOnboardingState = {
  version: ONBOARDING_VERSION,
  completed: false,
  healthConnectDone: false,
  firstWidgetAddedDone: false,
  completedAt: null,
};

const createCompletedOnboardingState = (
  completedAt = new Date().toISOString(),
): HardOnboardingState => ({
  version: ONBOARDING_VERSION,
  completed: true,
  healthConnectDone: true,
  firstWidgetAddedDone: true,
  completedAt,
});

const getOnboardingStorageKey = (userId: string) =>
  `${ONBOARDING_STORAGE_KEY}:${userId}`;

const normalizeState = (raw: unknown): HardOnboardingState => {
  if (!raw || typeof raw !== "object") return DEFAULT_ONBOARDING_STATE;

  const parsed = raw as Partial<HardOnboardingState>;
  const healthConnectDone = Boolean(parsed.healthConnectDone);
  const firstWidgetAddedDone = Boolean(parsed.firstWidgetAddedDone);
  const completed =
    Boolean(parsed.completed) || (healthConnectDone && firstWidgetAddedDone);

  return {
    version: ONBOARDING_VERSION,
    completed,
    healthConnectDone,
    firstWidgetAddedDone,
    completedAt:
      completed && typeof parsed.completedAt === "string"
        ? parsed.completedAt
        : completed
          ? new Date().toISOString()
          : null,
  };
};

type UseHardOnboardingParams = {
  userId?: string;
  healthConnectGranted: boolean;
  hasAtLeastOneWidget: boolean;
  isEnabled?: boolean;
};

export function useHardOnboarding({
  userId,
  healthConnectGranted,
  hasAtLeastOneWidget,
  isEnabled = true,
}: UseHardOnboardingParams) {
  const [state, setState] = useState<HardOnboardingState>(
    DEFAULT_ONBOARDING_STATE,
  );
  const [isLoading, setIsLoading] = useState(true);

  const persistState = useCallback(
    async (nextState: HardOnboardingState) => {
      if (!userId) return;
      const key = getOnboardingStorageKey(userId);
      await AsyncStorage.setItem(key, JSON.stringify(nextState));
    },
    [userId],
  );

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setState(DEFAULT_ONBOARDING_STATE);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const key = getOnboardingStorageKey(userId);
        const raw = await AsyncStorage.getItem(key);
        if (!raw) {
          const fallbackState = isEnabled
            ? DEFAULT_ONBOARDING_STATE
            : createCompletedOnboardingState();
          setState(fallbackState);
          if (!isEnabled) {
            await AsyncStorage.setItem(key, JSON.stringify(fallbackState));
          }
          return;
        }

        const parsed = normalizeState(JSON.parse(raw));
        if (!isEnabled && !parsed.completed) {
          const completedState = createCompletedOnboardingState(
            parsed.completedAt ?? undefined,
          );
          setState(completedState);
          await AsyncStorage.setItem(key, JSON.stringify(completedState));
          return;
        }

        setState(parsed);
      } catch (error) {
        console.log("Erro ao carregar onboarding", error);
        setState(
          isEnabled ? DEFAULT_ONBOARDING_STATE : createCompletedOnboardingState(),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isEnabled, userId]);

  useEffect(() => {
    if (isLoading || !userId || state.completed || !isEnabled) return;

    const nextState: HardOnboardingState = {
      ...state,
      healthConnectDone: state.healthConnectDone || healthConnectGranted,
      firstWidgetAddedDone: state.firstWidgetAddedDone || hasAtLeastOneWidget,
    };

    if (nextState.healthConnectDone && nextState.firstWidgetAddedDone) {
      nextState.completed = true;
      nextState.completedAt = nextState.completedAt ?? new Date().toISOString();
    }

    if (
      nextState.completed !== state.completed ||
      nextState.healthConnectDone !== state.healthConnectDone ||
      nextState.firstWidgetAddedDone !== state.firstWidgetAddedDone ||
      nextState.completedAt !== state.completedAt
    ) {
      setState(nextState);
      void persistState(nextState);
    }
  }, [
    hasAtLeastOneWidget,
    healthConnectGranted,
    isLoading,
    persistState,
    state,
    userId,
    isEnabled,
  ]);

  const completeOnboarding = useCallback(async () => {
    const nextState: HardOnboardingState = {
      ...state,
      completed: true,
      completedAt: state.completedAt ?? new Date().toISOString(),
    };
    setState(nextState);
    await persistState(nextState);
  }, [persistState, state]);

  const skipOnboarding = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  const completeHealthConnectStep = useCallback(async () => {
    const shouldCompleteOnboarding = state.completed || state.firstWidgetAddedDone;
    const nextState: HardOnboardingState = {
      ...state,
      healthConnectDone: true,
      completed: shouldCompleteOnboarding,
      completedAt: shouldCompleteOnboarding
        ? state.completedAt ?? new Date().toISOString()
        : state.completedAt,
    };

    setState(nextState);
    await persistState(nextState);
  }, [persistState, state]);

  const currentStep: HardOnboardingStep = useMemo(() => {
    if (state.completed) return "completed";
    if (!state.healthConnectDone) return "health-connect";
    if (!state.firstWidgetAddedDone) return "add-widget";
    return "completed";
  }, [state.completed, state.firstWidgetAddedDone, state.healthConnectDone]);

  return {
    state,
    currentStep,
    isLoading,
    skipOnboarding,
    completeOnboarding,
    completeHealthConnectStep,
    isActive: isEnabled && !state.completed,
  };
}

export default useHardOnboarding;
