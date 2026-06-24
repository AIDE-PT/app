import { LOCAL_API_BASE as API_BASE } from "@/constants/api";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert as RNAlert,
  Animated,
  GestureResponderEvent,
  LayoutAnimation,
  LayoutChangeEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { LightBackground } from "@/components/DotBackground";
import Navbar from "@/components/navBar/NavBar";
import WidgetGrid from "@/components/widgets/WidgetGrid";
import {
  DASHBOARD_CONFIG,
  WidgetVariant,
} from "@/components/widgets/WidgetWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import useHardOnboarding from "@/hooks/useHardOnboarding";
import useHealthConnectStatus from "@/hooks/useHealthConnectStatus";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/utils/supabase/client";
import { Button } from "../buttons/button";
import TopBar from "../topBar/TopBar";
import DashboardMetricWidget from "../widgets/DashboardMetricWidget";
import HealthStatusHero from "./HealthStatusHero";

if (
  Platform.OS === "android" &&
  !(Platform.constants as { isNewArchEnabled?: boolean } | undefined)
    ?.isNewArchEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = "@dashboard_layout";

interface Alert {
  id: string;
  severity: "high" | "medium" | "low";
  read: boolean;
}

const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await axios.get(`${API_BASE}/alerts`);
  return Array.isArray(response.data) ? response.data : [];
};

const SIZE_OPTIONS: { label: string; variant: WidgetVariant }[] = [
  { label: "1 x 1", variant: "1-1" },
  { label: "2 x 1", variant: "1-2" },
  { label: "3 x 1", variant: "1-3" },
  { label: "3 x 2", variant: "2-3" },
];

type DashboardWidget = (typeof DASHBOARD_CONFIG)[number];

type CardLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragEventLike = {
  nativeEvent: {
    pageX?: number;
    pageY?: number;
    touches?: { pageX: number; pageY: number }[];
    changedTouches?: { pageX: number; pageY: number }[];
  };
};

type CuidadoOption = {
  id: string;
  name: string;
};

export default function EditableDashboard({
  notEditable = false,
}: {
  notEditable?: boolean;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { profileType } = useUserProfile();
  const [activeWidgets, setActiveWidgets] = useState<DashboardWidget[]>([]);
  const [, setIsEditing] = useState(false);
  const [openSizeMenuId, setOpenSizeMenuId] = useState<string | null>(null);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [cuidados, setCuidados] = useState<CuidadoOption[]>([]);
  const [selectedCuidado, setSelectedCuidado] = useState<CuidadoOption>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [topBarOverlayHeight, setTopBarOverlayHeight] = useState(0);
  const metricPatientId =
    profileType === "aider"
      ? (selectedCuidado?.id ?? null)
      : (user?.id ?? null);

  const menuAnimation = useRef(new Animated.Value(0)).current;
  const gridContentRef = useRef<View | null>(null);
  const gridOffsetRef = useRef({ x: 0, y: 0 });
  const cardLayoutsRef = useRef<Record<string, CardLayout>>({});
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragSizeRef = useRef({ width: 0, height: 0 });
  const draggingIdRef = useRef<string | null>(null);
  const lastSwapTargetRef = useRef<string | null>(null);
  const suppressNextPressRef = useRef(false);
  const hasLoadedLayoutRef = useRef(false);
  const previousOnboardingCompletedRef = useRef<boolean | null>(null);
  const queryClient = useQueryClient();

  const handleManualSync = useCallback(async () => {
    if (profileType !== "cuidado") return;
    if (Platform.OS !== "android") return;
    if (Constants.executionEnvironment === "storeClient") {
      console.warn("[HealthSync] Manual sync is unavailable in Expo Go.");
      return;
    }

    try {
      const { runSyncNow } = await import("@/src/tasks/healthBackgroundSync");
      await runSyncNow();
    } catch (error) {
      console.warn("[HealthSync] Failed to run manual sync", error);
    }
  }, [profileType]);

  const loadAssociatedCuidados = useCallback(async () => {
    if (!user?.id || profileType !== "aider") {
      setCuidados([]);
      setSelectedCuidado(undefined);
      return;
    }

    try {
      const { data: patients, error: patientsError } = await supabase.rpc(
        "get_patients_for_aider",
        { p_aider_id: user.id },
      );

      if (patientsError) {
        console.log(
          "Erro ao carregar cuidados associados",
          patientsError.message,
        );
        return;
      }

      if (!patients || patients.length === 0) {
        setCuidados([]);
        setSelectedCuidado(undefined);
        return;
      }

      const mappedCuidados: CuidadoOption[] = (patients ?? []).map(
        (patient: {
          id: string;
          name: string | null;
          email: string | null;
        }) => ({
          id: patient.id,
          name: patient.name?.trim() || patient.email || "Cuidado",
        }),
      );

      setCuidados(mappedCuidados);
      setSelectedCuidado((previous) => {
        if (
          previous &&
          mappedCuidados.some((cuidado) => cuidado.id === previous.id)
        ) {
          return previous;
        }
        return mappedCuidados[0];
      });
    } catch (error) {
      console.log("Erro ao carregar cuidados associados", error);
    }
  }, [profileType, user?.id]);

  const repairWidgets = (list: DashboardWidget[]) =>
    (list || []).map((widget) => {
      const original = DASHBOARD_CONFIG.find(
        (config) => config.id === widget.id,
      );
      return {
        ...widget,
        endpoint: widget.endpoint || original?.endpoint || "",
      };
    });

  const getSavedWidgets = (raw: unknown): DashboardWidget[] | null => {
    if (Array.isArray(raw)) return raw as DashboardWidget[];

    if (
      raw &&
      typeof raw === "object" &&
      Array.isArray((raw as { activeWidgets?: unknown }).activeWidgets)
    ) {
      return (raw as { activeWidgets: DashboardWidget[] }).activeWidgets;
    }

    return null;
  };

  const loadDashboard = async () => {
    const applyFallbackFromLocal = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setActiveWidgets([]);
        return;
      }

      const parsed = JSON.parse(saved);
      const savedWidgets = getSavedWidgets(parsed);
      if (savedWidgets) {
        setActiveWidgets(repairWidgets(savedWidgets));
        return;
      }

      setActiveWidgets([]);
    };

    try {
      if (user?.id) {
        const { data, error } = await supabase
          .from("users")
          .select("widgets")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.log("Erro ao carregar widgets no Supabase", error.message);
          await applyFallbackFromLocal();
          return;
        }

        const remoteWidgets = getSavedWidgets(data?.widgets);
        if (remoteWidgets) {
          const repaired = repairWidgets(remoteWidgets);
          setActiveWidgets(repaired);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ activeWidgets: repaired }),
          );
          return;
        }
      }

      await applyFallbackFromLocal();
    } catch (e) {
      console.log("Erro ao carregar dashboard", e);
    } finally {
      hasLoadedLayoutRef.current = true;
    }
  };

  const measureGrid = () => {
    gridContentRef.current?.measureInWindow((x, y) => {
      gridOffsetRef.current = { x, y };
    });
  };

  useEffect(() => {
    if (authLoading) return;
    loadDashboard();
    // loadDashboard intentionally depends on auth/user state only for initial/follow-up user loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    loadAssociatedCuidados();
  }, [authLoading, loadAssociatedCuidados]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      void loadAssociatedCuidados();
    }, [authLoading, loadAssociatedCuidados]),
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      measureGrid();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [activeWidgets]);

  const save = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activeWidgets }),
      );

      if (user?.id) {
        const { error } = await supabase
          .from("users")
          .update({ widgets: { activeWidgets } })
          .eq("id", user.id);

        if (error) {
          console.log("Erro ao guardar widgets no Supabase", error.message);
        }
      }
    } catch (e) {
      console.log("Erro ao guardar dashboard", e);
    }
  }, [activeWidgets, user?.id]);

  useEffect(() => {
    if (!hasLoadedLayoutRef.current) return;

    const timeoutId = setTimeout(() => {
      save();
    }, 120);

    return () => clearTimeout(timeoutId);
  }, [save]);

  const setSize = (id: string, variant: WidgetVariant) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, variant } : w)),
    );
    setIsEditing(true);
  };

  const deleteWidget = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveWidgets((prev) => prev.filter((w) => w.id !== id));
    setIsEditing(true);
    closeSizeMenu();
  };

  const addWidget = useCallback((widgetId: string) => {
    const widgetTemplate = DASHBOARD_CONFIG.find(
      (widget) => widget.id === widgetId,
    );
    if (!widgetTemplate) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveWidgets((prev) => {
      if (prev.some((widget) => widget.id === widgetId)) return prev;
      return [...prev, { ...widgetTemplate }];
    });
    setIsEditing(true);
  }, []);

  const closeSizeMenuImmediate = () => {
    menuAnimation.stopAnimation();
    menuAnimation.setValue(0);
    setOpenSizeMenuId(null);
  };

  const closeSizeMenu = (onClosed?: () => void) => {
    if (!openSizeMenuId) {
      onClosed?.();
      return;
    }

    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 130,
      useNativeDriver: true,
    }).start(() => {
      setOpenSizeMenuId(null);
      onClosed?.();
    });
  };

  const toggleSizeMenu = (id: string) => {
    if (openSizeMenuId === id) {
      closeSizeMenu();
      return;
    }

    const openMenu = () => {
      setOpenSizeMenuId(id);
      menuAnimation.setValue(0);
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    };

    if (openSizeMenuId) {
      closeSizeMenu(openMenu);
      return;
    }

    openMenu();
  };

  const registerCardLayout = (id: string, event: LayoutChangeEvent) => {
    cardLayoutsRef.current[id] = event.nativeEvent.layout;
  };

  const getPointFromEvent = (event: DragEventLike) => {
    const touch =
      event.nativeEvent.touches?.[0] ?? event.nativeEvent.changedTouches?.[0];
    const pageX =
      typeof event.nativeEvent.pageX === "number"
        ? event.nativeEvent.pageX
        : touch?.pageX;
    const pageY =
      typeof event.nativeEvent.pageY === "number"
        ? event.nativeEvent.pageY
        : touch?.pageY;

    if (typeof pageX !== "number" || typeof pageY !== "number") return null;
    return { pageX, pageY };
  };

  const beginDrag = (id: string, event: GestureResponderEvent) => {
    if (notEditable || isDashboardLocked) return;
    const layout = cardLayoutsRef.current[id];
    if (!layout) return;
    const startPoint = getPointFromEvent(event);
    if (!startPoint) return;

    closeSizeMenuImmediate();
    setIsEditing(true);
    suppressNextPressRef.current = true;

    const startDrag = (gridX: number, gridY: number) => {
      gridOffsetRef.current = { x: gridX, y: gridY };
      dragOffsetRef.current = {
        x: startPoint.pageX - (gridOffsetRef.current.x + layout.x),
        y: startPoint.pageY - (gridOffsetRef.current.y + layout.y),
      };
      dragSizeRef.current = { width: layout.width, height: layout.height };
      draggingIdRef.current = id;
      lastSwapTargetRef.current = null;
      setDraggingWidgetId(id);
      setDragPosition({ x: layout.x, y: layout.y });
    };

    if (!gridContentRef.current) {
      startDrag(0, 0);
      return;
    }

    gridContentRef.current.measureInWindow((x, y) => {
      startDrag(x, y);
    });
  };

  const handleDragMove = (id: string, event: DragEventLike) => {
    if (draggingIdRef.current !== id) return;
    const point = getPointFromEvent(event);
    if (!point) return;

    const nextX =
      point.pageX - gridOffsetRef.current.x - dragOffsetRef.current.x;
    const nextY =
      point.pageY - gridOffsetRef.current.y - dragOffsetRef.current.y;
    setDragPosition({ x: nextX, y: nextY });

    const centerX = nextX + dragSizeRef.current.width / 2;
    const centerY = nextY + dragSizeRef.current.height / 2;

    let hoveredWidgetId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const widget of activeWidgets) {
      if (widget.id === id) continue;
      const layout = cardLayoutsRef.current[widget.id];
      if (!layout) continue;

      const targetX = layout.x + layout.width / 2;
      const targetY = layout.y + layout.height / 2;
      const distance = Math.hypot(centerX - targetX, centerY - targetY);
      if (distance < closestDistance) {
        closestDistance = distance;
        hoveredWidgetId = widget.id;
      }
    }

    if (!hoveredWidgetId) {
      lastSwapTargetRef.current = null;
      return;
    }

    if (hoveredWidgetId === lastSwapTargetRef.current) return;
    lastSwapTargetRef.current = hoveredWidgetId;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveWidgets((prev) => {
      const fromIndex = prev.findIndex((widget) => widget.id === id);
      const toIndex = prev.findIndex((widget) => widget.id === hoveredWidgetId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const finishDrag = (id: string) => {
    if (draggingIdRef.current !== id) return;

    draggingIdRef.current = null;
    lastSwapTargetRef.current = null;
    setDraggingWidgetId(null);

    setTimeout(() => {
      suppressNextPressRef.current = false;
    }, 0);
  };

  const handleCardPress = (widgetId: string) => {
    if (isDashboardLocked) return;

    if (suppressNextPressRef.current) {
      suppressNextPressRef.current = false;
      return;
    }

    if (openSizeMenuId) {
      closeSizeMenu();
      return;
    }

    router.push(
      `/MasterDetail?type=${widgetId}${
        metricPatientId ? `&patientId=${metricPatientId}` : ""
      }`,
    );
  };

  const draggingWidget = draggingWidgetId
    ? activeWidgets.find((widget) => widget.id === draggingWidgetId)
    : undefined;

  const menuTranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  const menuScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const { isDark, widgetView } = useTheme();
  const useSuperSimplifiedWidgets = widgetView === "simplificada";
  const {
    status: healthConnectStatus,
    isLoading: isLoadingHealthConnect,
    refresh: refreshHealthConnectStatus,
  } = useHealthConnectStatus(profileType === "cuidado");
  const hasHealthConnectPermissions = Boolean(
    healthConnectStatus?.permissionsGranted,
  );
  const {
    state: onboardingState,
    currentStep: onboardingStep,
    isLoading: isOnboardingLoading,
    skipOnboarding,
    completeHealthConnectStep,
    isActive: isOnboardingActive,
  } = useHardOnboarding({
    userId: user?.id,
    healthConnectGranted: hasHealthConnectPermissions,
    hasAtLeastOneWidget: activeWidgets.length > 0,
    isAider: profileType === "aider",
  });
  const isHardOnboardingActive = !isOnboardingLoading && isOnboardingActive;
  const isDashboardLocked =
    isHardOnboardingActive && onboardingStep !== "completed";
  const highlightHealthConnectStep =
    isDashboardLocked && onboardingStep === "health-connect";
  const highlightWidgetStep =
    isDashboardLocked && onboardingStep === "add-widget";
  const shouldShowOnboardingHero =
    isOnboardingLoading || isHardOnboardingActive;
  const isAndroid = Platform.OS === "android";

  const showPopup = useCallback((title: string, message: string) => {
    if (Platform.OS === "web" && typeof globalThis.alert === "function") {
      globalThis.alert(`${title}\n\n${message}`);
      return;
    }

    RNAlert.alert(title, message);
  }, []);

  const handleHealthConnectPress = useCallback(async () => {
    await completeHealthConnectStep();

    if (isAndroid) {
      router.push("/health-connect");
      return;
    }

    showPopup(
      "Health Connect indisponivel",
      "Esta funcionalidade esta disponivel apenas em Android.",
    );
  }, [completeHealthConnectStep, isAndroid, router, showPopup]);

  useEffect(() => {
    if (isOnboardingLoading) return;

    if (previousOnboardingCompletedRef.current === null) {
      previousOnboardingCompletedRef.current = onboardingState.completed;
      return;
    }

    if (!previousOnboardingCompletedRef.current && onboardingState.completed) {
      showPopup("Parabens!", "Fez o onboarding com sucesso.");
    }

    previousOnboardingCompletedRef.current = onboardingState.completed;
  }, [isOnboardingLoading, onboardingState.completed, showPopup]);

  const setSizeSafe = (id: string, variant: WidgetVariant) => {
    if (isDashboardLocked) return;
    setSize(id, variant);
  };

  const deleteWidgetSafe = (id: string) => {
    if (isDashboardLocked) return;
    deleteWidget(id);
  };

  const toggleSizeMenuSafe = (id: string) => {
    if (isDashboardLocked) return;
    toggleSizeMenu(id);
  };

  const insets = useSafeAreaInsets();
  const TOP_BAR_HEIGHT = 30;
  const TOP_BAR_CONTENT_HEIGHT = 90;
  const heroTopExtension = notEditable ? 0 : insets.top + TOP_BAR_HEIGHT;

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 15000,
  });

  const heroStatus: "good" | "warning" | "critical" = (() => {
    const unread = alerts.filter((a) => !a.read);
    if (unread.some((a) => a.severity === "high")) return "critical";
    if (unread.some((a) => a.severity === "medium" || a.severity === "low"))
      return "warning";
    return "good";
  })();

  const heroUserName =
    typeof user?.user_metadata?.name === "string" &&
    user.user_metadata.name.trim().length > 0
      ? user.user_metadata.name.trim()
      : (user?.email ?? "Utilizador");

  const refetchStepsMetrics = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ["steps", "latest"] });
    queryClient.refetchQueries({ queryKey: ["steps", "stats"] });
  }, [queryClient]);

  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await handleManualSync();
      await refreshHealthConnectStatus();
      refetchStepsMetrics();
      queryClient.refetchQueries({ queryKey: ["alerts"], exact: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [
    handleManualSync,
    isRefreshing,
    queryClient,
    refetchStepsMetrics,
    refreshHealthConnectStatus,
  ]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const syncStepsAfterPermissionRefresh = async () => {
        await refreshHealthConnectStatus();
        if (!isMounted) return;
        refetchStepsMetrics();
      };

      void syncStepsAfterPermissionRefresh();

      return () => {
        isMounted = false;
      };
    }, [refetchStepsMetrics, refreshHealthConnectStatus]),
  );

  return (
    <LightBackground status={heroStatus}>
      <View style={{ flex: 1 }}>
        {/* TopBar as absolute overlay so Hero bleeds behind it */}
        {!notEditable && (
          <View
            onLayout={(event) => {
              setTopBarOverlayHeight(event.nativeEvent.layout.height);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 2000,
              elevation: 2000,
              overflow: "visible",
            }}
          >
            <SafeAreaView
              style={{
                borderBottomLeftRadius: 40,
                borderBottomRightRadius: 40,
                overflow: "visible",
                backgroundColor: isDark
                  ? "rgba(0, 4, 18, 1)"
                  : "rgba(219, 237, 248, 1)",
                elevation: 4,
              }}
              edges={["top"]}
            >
              <TopBar
                showBackground={true}
                cuidados={cuidados}
                selectedCuidado={selectedCuidado}
                onSelectCuidado={(cuidado) => setSelectedCuidado(cuidado)}
                onNotificationPress={
                  isDashboardLocked
                    ? undefined
                    : () => router.push("/notificacoes")
                }
                onSettingsPress={
                  isDashboardLocked
                    ? undefined
                    : () => router.push("/definicoes")
                }
              />
            </SafeAreaView>
          </View>
        )}

        <SafeAreaView
          style={{ flex: 1, backgroundColor: "transparent" }}
          edges={["bottom"]}
        >
          <ScrollView
            style={{ flex: 1 }}
            scrollEnabled={draggingWidgetId === null}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  void handlePullToRefresh();
                }}
                tintColor={isDark ? "#FFFFFF" : "#1F2937"}
                colors={["#5061FF"]}
                progressBackgroundColor={isDark ? "#000412" : "#ECF5FF"}
              />
            }
          >
            {/* Hero Section — extends to top edge, content padded below TopBar */}
            <HealthStatusHero
              userName={heroUserName}
              cuidadoName={selectedCuidado?.name ?? "Sem cuidado associado"}
              isCuidadoAccount={profileType === "cuidado"}
              status={heroStatus}
              topExtension={heroTopExtension}
              onCheckNotifications={() => router.push("/notificacoes")}
            />

            {isRefreshing && (
              <View className="px-4 mb-2">
                <View
                  className={`rounded-2xl px-4 py-3 flex-row items-center ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                  style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel="A sincronizar dados de saúde"
                >
                  <ActivityIndicator
                    size="small"
                    color={isDark ? "#A9BDFF" : "#5061FF"}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text
                    className={`ml-3 text-sm font-bold ${isDark ? "text-white" : "text-slate-700"}`}
                  >
                    A sincronizar dados...
                  </Text>
                </View>
              </View>
            )}

            {profileType === "aider" && cuidados.length === 0 && (
              <View className="px-4 mb-2">
                <View
                  className={`rounded-[28px] p-5 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                  style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(80, 97, 255, 0.18)"
                          : "rgba(80, 97, 255, 0.1)",
                      }}
                    >
                      <Feather
                        name="user-plus"
                        size={20}
                        color={isDark ? "#A9BDFF" : "#5061FF"}
                      />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text
                        className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}
                      >
                        Ainda não tem pacientes associados
                      </Text>
                      <Text
                        className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-slate-600"}`}
                      >
                        Adicione um paciente para começar a ver métricas e
                        notas.
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4">
                    <Button
                      variant="primary"
                      forceLight={false}
                      label="Adicionar paciente"
                      onPress={() => router.push("/associar")}
                    />
                  </View>
                </View>
              </View>
            )}

            {profileType === "cuidado" &&
              !isLoadingHealthConnect &&
              healthConnectStatus &&
              !healthConnectStatus.permissionsGranted && (
                <View className="px-4 mb-2">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => void handleHealthConnectPress()}
                    className={`rounded-[28px] p-5 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                    style={{
                      boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                      borderWidth: highlightHealthConnectStep ? 1.8 : 0,
                      borderColor: highlightHealthConnectStep
                        ? isDark
                          ? "#93c5fd"
                          : "#1d4ed8"
                        : "transparent",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir Health Connect"
                    accessibilityHint="Abre a pagina do Health Connect para concluir a ligacao."
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(214, 69, 80, 0.18)"
                            : "rgba(214, 69, 80, 0.1)",
                        }}
                      >
                        <Feather
                          name="heart"
                          size={20}
                          color={isDark ? "#fda4af" : "#be123c"}
                        />
                      </View>
                      <View className="flex-1 ml-4">
                        <Text
                          className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}
                        >
                          Ligar ao Health Connect
                        </Text>
                        <Text
                          className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-slate-600"}`}
                        >
                          Ative o acesso a passos, frequencia cardiaca e outros
                          dados de saude para completar a ligacao de saude.
                        </Text>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={20}
                        color={isDark ? "#ffffff" : "#0f172a"}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}

            {/* // <HealthDashboard /> } */}
            {/*
            <Button
              variant="primary"
              label="Forçar Sync"
              onPress={() => void runSyncNow()}
              disabled={isDashboardLocked}
            />
            */}
            <View style={{ zIndex: 0 }}>
              <WidgetGrid
                contentRef={gridContentRef}
                onContentLayout={measureGrid}
                scrollEnabled={false}
              >
                {activeWidgets.map((item) => {
                  const isBeingDragged = draggingWidgetId === item.id;
                  const isSizeMenuOpen = openSizeMenuId === item.id;

                  return (
                    <View
                      key={item.id}
                      className="relative"
                      style={
                        isSizeMenuOpen
                          ? {
                              zIndex: 2000,
                              elevation: 2000,
                            }
                          : undefined
                      }
                      onLayout={(event) => registerCardLayout(item.id, event)}
                    >
                      <Pressable
                        onPress={() => handleCardPress(item.id)}
                        onPressIn={
                          notEditable || isDashboardLocked
                            ? undefined
                            : measureGrid
                        }
                        onLongPress={
                          notEditable || isDashboardLocked
                            ? undefined
                            : (event) => beginDrag(item.id, event)
                        }
                        onTouchMove={
                          notEditable || isDashboardLocked
                            ? undefined
                            : (event) => handleDragMove(item.id, event)
                        }
                        onTouchEnd={
                          notEditable || isDashboardLocked
                            ? undefined
                            : () => finishDrag(item.id)
                        }
                        onTouchCancel={
                          notEditable || isDashboardLocked
                            ? undefined
                            : () => finishDrag(item.id)
                        }
                        onPressOut={
                          notEditable || isDashboardLocked
                            ? undefined
                            : () => finishDrag(item.id)
                        }
                        delayLongPress={280}
                        style={isBeingDragged ? { opacity: 0.1 } : undefined}
                      >
                        <DashboardMetricWidget
                          type={item.type}
                          endpoint={item.endpoint}
                          variant={item.variant as WidgetVariant}
                          iconSize={24}
                          patientId={metricPatientId}
                          superSimplified={useSuperSimplifiedWidgets}
                        />
                      </Pressable>

                      {!notEditable && !isDashboardLocked && (
                        <TouchableOpacity
                          onPress={() => toggleSizeMenuSafe(item.id)}
                          className={`absolute top-2 right-2 h-7 w-7 rounded-full items-center justify-center z-40 ${isDark ? "bg-aide-dark-card border border-white/20" : "bg-white/90 border border-slate-200"}`}
                          disabled={Boolean(draggingWidgetId)}
                          accessibilityRole="button"
                          accessibilityLabel={`Mais opções para ${item.type}`}
                          accessibilityHint="Abre opções de tamanho e remoção do widget."
                        >
                          <Feather
                            name="more-vertical"
                            size={14}
                            color={isDark ? "#ffffff" : "#1e293b"}
                            accessible={false}
                          />
                        </TouchableOpacity>
                      )}

                      {!notEditable && !isDashboardLocked && isSizeMenuOpen && (
                        <Animated.View
                          style={{
                            position: "absolute",
                            top: 36,
                            right: 4,
                            opacity: menuAnimation,
                            transform: [
                              { translateY: menuTranslateY },
                              { scale: menuScale },
                            ],
                            zIndex: 999,
                            elevation: 12,
                            borderRadius: 20,
                            overflow: "hidden",
                            backgroundColor: isDark
                              ? "rgba(0, 4, 18, 0.95)"
                              : "#ffffff",
                            borderWidth: 1,
                            borderColor: isDark
                              ? "rgba(80, 97, 255, 0.3)"
                              : "rgba(80, 97, 255, 0.2)",
                            minWidth: 140,
                            boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                          }}
                        >
                          {SIZE_OPTIONS.map((option) => {
                            const selected = option.variant === item.variant;
                            return (
                              <TouchableOpacity
                                key={option.variant}
                                className={`px-4 py-3 flex-row items-center justify-between ${selected ? (isDark ? "bg-blue-900/50" : "bg-blue-50") : isDark ? "bg-transparent" : "bg-white"}`}
                                onPress={() => {
                                  setSizeSafe(item.id, option.variant);
                                  closeSizeMenu();
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Tamanho ${option.label}`}
                                accessibilityState={{ selected }}
                              >
                                <Text
                                  className={`text-sm font-bold ${selected ? (isDark ? "text-blue-300" : "text-blue-700") : isDark ? "text-slate-300" : "text-slate-600"}`}
                                >
                                  {option.label}
                                </Text>
                                {selected && (
                                  <Feather
                                    name="check"
                                    size={13}
                                    color={isDark ? "#93c5fd" : "#1d4ed8"}
                                    accessible={false}
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                          {/* Delete Option */}
                          <TouchableOpacity
                            className={`px-4 py-3 flex-row items-center justify-between ${isDark ? "bg-transparent" : "bg-white"} border-t ${isDark ? "border-white/10" : "border-slate-100"}`}
                            onPress={() => {
                              deleteWidgetSafe(item.id);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Eliminar widget ${item.type}`}
                          >
                            <Text className="text-xs font-bold text-red-500">
                              Eliminar
                            </Text>
                            <Feather
                              name="trash-2"
                              size={13}
                              color="#ef4444"
                              accessible={false}
                            />
                          </TouchableOpacity>
                        </Animated.View>
                      )}
                    </View>
                  );
                })}

                {draggingWidget && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: dragPosition.x,
                      top: dragPosition.y,
                      zIndex: 120,
                      opacity: 0.96,
                      transform: [{ scale: 1.03 }],
                    }}
                  >
                    <DashboardMetricWidget
                      type={draggingWidget.type}
                      endpoint={draggingWidget.endpoint}
                      variant={draggingWidget.variant as WidgetVariant}
                      iconSize={24}
                      patientId={metricPatientId}
                      superSimplified={useSuperSimplifiedWidgets}
                    />
                  </View>
                )}
              </WidgetGrid>
            </View>
          </ScrollView>
        </SafeAreaView>
        <Navbar
          notEditable
          onAddWidget={addWidget}
          disableNavigation={isDashboardLocked}
          highlightAddButton={highlightWidgetStep}
          disableAddAction={isDashboardLocked && !highlightWidgetStep}
        />
      </View>
    </LightBackground>
  );
}
