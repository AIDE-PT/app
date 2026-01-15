import { CalendarButton } from "@/components/buttons/calendarButton";
import WidgetIcon from "@/components/svg/WidgetIcon";
import WidgetGrid from "@/components/widgets/WidgetGrid";
import { WidgetWrapper } from "@/components/widgets/WidgetWrapper";
import React from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import BackButton from "../components/buttons/backButton";


const HistoricoDiario = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F9FF]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-8">
          <BackButton label="Histórico Diário" />
        </View>

        <View className="flex-row">
          <CalendarButton label="Dia" onPress={() => console.log("clicked")} />
          <CalendarButton
            label="Período"
            onPress={() => console.log("clicked")}
          />
        </View>

        <WidgetGrid className="mt-2">
          <WidgetWrapper
            feedback="Normal"
            unit="bpm"
            value="72"
            feedbackColor="#E0F2FE"
            icon={<WidgetIcon variant="heartRate" />}
            title="BPM"
            variant="1-1"
          />
          <WidgetWrapper
            feedback="Meta"
            unit="passos"
            value="8.5k"
            feedbackColor="#DCFCE7"
            icon={<WidgetIcon variant="steps" />}
            title="Passos"
            variant="1-2"
          />
          <WidgetWrapper
            feedback="Estável"
            unit="ºC"
            value="36.5"
            feedbackColor="#FEF3C7"
            icon={<WidgetIcon variant="temp" />}
            title="Temperatura"
            variant="2-3"
          />
        </WidgetGrid>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoricoDiario;