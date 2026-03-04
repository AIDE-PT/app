import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import Navbar from "@/components/navBar/NavBar";
import ArrowIcon from "@/components/svg/ArrowIcon";
import { ResizeIcon } from "@/components/svg/ResizeIcon";
import WidgetIcon from "@/components/svg/WidgetIcon";
import WidgetGrid from "@/components/widgets/WidgetGrid";
import {
  DASHBOARD_CONFIG,
  METRIC_STYLES,
  WidgetVariant,
} from "@/components/widgets/WidgetWrapper";
import { ScrollView } from "react-native-gesture-handler";
import { CloseIcon } from "../svg/CloseIcon";
import TopBar from "../topBar/TopBar";
import DashboardMetricWidget from "../widgets/DashboardMetricWidget";
import { Button } from "../buttons/button";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = "@dashboard_layout";

export default function EditableDashboard({
  notEditable = false,
}: {
  notEditable?: boolean;
}) {
  const router = useRouter();
  const [activeWidgets, setActiveWidgets] = useState(DASHBOARD_CONFIG);
  const [hiddenWidgets, setHiddenWidgets] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCuidado, setSelectedCuidado] = useState({
    id: "1",
    name: "Emília Almeida",
  });

  const cuidados = [
    { id: "1", name: "Emília Almeida" },
    { id: "2", name: "João Silva" },
  ];

  const loadDashboard = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const repair = (list: any[]) =>
          list.map((w) => {
            const original = DASHBOARD_CONFIG.find((c) => c.id === w.id);
            return {
              ...w,
              endpoint: w.endpoint || original?.endpoint,
            };
          });

        setActiveWidgets(repair(parsed.activeWidgets || []));
        setHiddenWidgets(repair(parsed.hiddenWidgets || []));
      }
    } catch (e) {
      console.log("Erro ao carregar dashboard", e);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const save = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activeWidgets, hiddenWidgets }),
      );
    } catch (e) {
      console.log("Erro ao guardar dashboard", e);
    }
  };

  const toggleVisibility = (id: string, visible: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (visible) {
      const w = activeWidgets.find((x) => x.id === id);
      if (!w) return;
      setActiveWidgets((p) => p.filter((x) => x.id !== id));
      setHiddenWidgets((p) => [...p, w]);
    } else {
      const w = hiddenWidgets.find((x) => x.id === id);
      if (!w) return;
      setHiddenWidgets((p) => p.filter((x) => x.id !== id));
      setActiveWidgets((p) => [...p, w]);
    }
  };

  const toggleSize = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveWidgets((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const cycle: WidgetVariant[] = ["1-1", "1-2", "1-3", "2-3"];
          const index = cycle.indexOf(w.variant);
          const next = cycle[(index + 1) % cycle.length];
          return { ...w, variant: next };
        }
        return w;
      }),
    );
  };

  const move = (index: number, dir: "left" | "right") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const list = [...activeWidgets];
    const target = dir === "left" ? index - 1 : index + 1;
    if (target >= 0 && target < list.length) {
      [list[index], list[target]] = [list[target], list[index]];
      setActiveWidgets(list);
    }
  };

  return (
    <View className="flex-1 pt-10 bg-[#ECF5FF]">
      <SafeAreaView className="flex-1">
        {!notEditable && (
          <TopBar
            cuidados={cuidados}
            selectedCuidado={selectedCuidado}
            onSelectCuidado={setSelectedCuidado}
            onNotificationPress={() => console.log("Notificações")}
            onSettingsPress={() => router.push("/definicoes")}
          />
        )}
        <ScrollView className="flex-1  px-4">
          <WidgetGrid>
            {activeWidgets.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push("./MasterDetail")}
                onLongPress={notEditable ? undefined : () => setIsEditing(true)}
                activeOpacity={0.9}
                className="relative"
              >
                <DashboardMetricWidget
                  type={item.type}
                  endpoint={item.endpoint}
                  variant={item.variant as any}
                />

                {isEditing && (
                  <View className="absolute inset-0 bg-white/70 rounded-[16px] items-center justify-center border-2 border-dashed border-blue-400">
                    <TouchableOpacity
                      onPress={() => toggleVisibility(item.id, true)}
                      className="absolute -top-2 -right-2 bg-red-500 w-8 h-8 rounded-full items-center justify-center shadow-lg z-50"
                    >
                      <CloseIcon />
                    </TouchableOpacity>

                    <View className="flex-row gap-4 mb-2">
                      <TouchableOpacity
                        className="bg-white p-2 rounded-full shadow-md"
                        onPress={() => move(index, "left")}
                      >
                        <ArrowIcon variant="LEFT" dark />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-white p-2 rounded-full shadow-md"
                        onPress={() => move(index, "right")}
                      >
                        <ArrowIcon variant="RIGHT" dark />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => toggleSize(item.id)}
                      className="bg-white p-2 rounded-full shadow-md"
                    >
                      <ResizeIcon dark size={25} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </WidgetGrid>

          {isEditing && hiddenWidgets.length > 0 && (
            <View className="mt-8 pb-10">
              <Text className="text-xs text-slate-400 text-center mb-4 uppercase tracking-widest">
                Disponíveis para adicionar
              </Text>
              <View className="flex-row flex-wrap justify-center gap-3">
                {hiddenWidgets.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleVisibility(item.id, false)}
                    className="bg-white px-5 py-3 rounded-2xl flex-row items-center gap-3 shadow-sm border border-gray-100"
                  >
                    <WidgetIcon variant={item.type} />
                    <Text className="text-sm font-bold text-slate-700">
                      {
                        METRIC_STYLES[item.type as keyof typeof METRIC_STYLES]
                          ?.title
                      }
                    </Text>
                    <Text className="text-blue-500 font-bold text-lg">＋</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {isEditing && (
            <View className="w-1/2 mx-auto  mb-32">
              <Button
                label="Guardar"
                variant="list"
                onPress={async () => {
                  await save();
                  setIsEditing(false);
                }}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <Navbar notEditable />
    </View>
  );
}
