import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { IconCardButton } from "../components/buttons/IconCardButton";
import { LightBackground } from "../components/LightBackground";
import {
  BpmIcon,
  CalIcon,
  GlicoseIcon,
  O2Icon,
  PassosIcon,
  PressaoIcon,
  SonoIcon,
  StressIcon,
  TempIcon,
} from "../components/svg/HealthIcons";

import "../global.css";

type HealthMetric = 
  | "pressao"
  | "glicose"
  | "bpm"
  | "cal"
  | "passos"
  | "stress"
  | "sono"
  | "o2"
  | "temp";

const healthMetrics: { id: HealthMetric; label: string; icon: React.ReactNode }[] = [
  { id: "pressao", label: "PRESSÃO", icon: <PressaoIcon /> },
  { id: "glicose", label: "GLICOSE", icon: <GlicoseIcon /> },
  { id: "bpm", label: "BPM", icon: <BpmIcon /> },
  { id: "cal", label: "CAL", icon: <CalIcon /> },
  { id: "passos", label: "PASSOS", icon: <PassosIcon /> },
  { id: "stress", label: "STRESS", icon: <StressIcon /> },
  { id: "sono", label: "SONO", icon: <SonoIcon /> },
  { id: "o2", label: "O2", icon: <O2Icon /> },
  { id: "temp", label: "TEMP", icon: <TempIcon /> },
];

const conditionToMetrics: Record<string, HealthMetric[]> = {
  Hipoglicemia: ["glicose", "pressao", "sono"],
  Hepatopatia: ["temp", "cal", "sono"],
  Asma: ["o2", "bpm", "pressao"],
  Hipertensão: ["pressao", "bpm", "stress"],
  TOC: ["stress", "sono", "bpm"],
  Hipotensão: ["pressao", "bpm", "o2"],
  Diabetes: ["glicose", "cal", "passos"],
  Hiperglicemia: ["glicose", "pressao", "cal"],
};

export default function Recommendations() {
  const router = useRouter();
  const { conditions } = useLocalSearchParams<{ conditions: string }>();
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    if (conditions) {
      const conditionList = conditions.split(",");
      const metricsSet = new Set<HealthMetric>();

      conditionList.forEach((condition) => {
        const metrics = conditionToMetrics[condition];
        if (metrics) {
          metrics.forEach((m) => metricsSet.add(m));
        }
      });

      if (metricsSet.size > 0) {
        setSelectedMetrics(Array.from(metricsSet));
      } else {
        setSelectedMetrics(["pressao", "bpm", "passos", "sono"]);
      }
    } else {
      setSelectedMetrics(["pressao", "bpm", "passos", "sono"]);
    }
  }, [conditions]);

  const toggleMetric = (metric: HealthMetric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  const handleConcluir = () => {
    console.log("Selected metrics:", selectedMetrics);
    router.push("/");
  };

  return (
    <LightBackground>
      <SafeAreaView className="flex-1 px-6">
        <View className="mt-12 mb-6">
          <Text className="text-3xl font-bold text-black/90">
            Nós recomendamos
          </Text>
          <Text className="text-base text-black/60 mt-1">
            Baseado nas suas escolhas
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {healthMetrics.map((metric) => (
            <View key={metric.id} className="w-[48%]">
              <IconCardButton
                label={metric.label}
                icon={metric.icon}
                selected={selectedMetrics.includes(metric.id)}
                onPress={() => toggleMetric(metric.id)}
              />
            </View>
          ))}
        </View>

        <View className="flex-1" />

        <View className="items-center mb-8">
          <Button
            variant="primary"
            label="Concluir"
            onPress={handleConcluir}
          />
        </View>
      </SafeAreaView>
    </LightBackground>
  );
}
