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
  isAider?: boolean;
};

export function useHardOnboarding({
  userId,
  healthConnectGranted,
  hasAtLeastOneWidget,
  isAider = false,
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
          setState(DEFAULT_ONBOARDING_STATE);
          return;
        }

        const parsed = normalizeState(JSON.parse(raw));
        setState(parsed);
      } catch (error) {
        console.log("Erro ao carregar onboarding", error);
        setState(DEFAULT_ONBOARDING_STATE);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [userId]);

  useEffect(() => {
    if (isLoading || !userId || state.completed) return;

    const nextState: HardOnboardingState = {
      ...state,
      healthConnectDone: true,
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
    isAider,
    isLoading,
    persistState,
    state,
    userId,
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
    if (!state.firstWidgetAddedDone) return "add-widget";
    return "completed";
  }, [state.completed, state.firstWidgetAddedDone]);

  return {
    state,
    currentStep,
    isLoading,
    skipOnboarding,
    completeOnboarding,
    completeHealthConnectStep,
    isActive: !state.completed,
  };
}

export default useHardOnboarding;
