import { useFonts } from "expo-font";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";
import { Button } from "../components/buttons/button";
import SimpleLineChart from "../components/charts/LineChartSlim";
import MiniSparkline from "../components/charts/MiniSparkline";
import { GradientBackground } from "../components/GradientBackground";
import { Input } from "../components/input/Input";
import BottomModal from "../components/modals/BottomModal";
import Navbar from "../components/navBar/NavBar";
import TopTitleNav from "../components/navBar/TopTitleNav";
import AddIcon from "../components/svg/AddIcon";
import AideIcon from "../components/svg/AideIcon";
import ArrowIcon from "../components/svg/ArrowIcon";
import CalendarIcon from "../components/svg/CalendarIcon";
import EyeIcon from "../components/svg/EyeIcon";
import HomeIcon from "../components/svg/HomeIcon";
import ProfileIcon from "../components/svg/ProfileIcon";
import WidgetIcon from "../components/svg/WidgetIcon";
import { WidgetWrapper } from "../components/widgets/WidgetWrapper";
import "../global.css";

// Component Section Wrapper
const ComponentSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="mb-8">
    <Text className="font-open-sans-semibold text-[18px] text-[#1A1A2E] mb-4 border-b border-[#E5E7EB] pb-2">
      {title}
    </Text>
    <View className="gap-4">{children}</View>
  </View>
);

// Component Item with label
const ComponentItem = ({
  label,
  children,
  dark = false,
}: {
  label: string;
  children: React.ReactNode;
  dark?: boolean;
}) => (
  <View className={`p-4 rounded-xl ${dark ? "bg-[#1A1A2E]" : "bg-white/80"}`}>
    <Text
      className={`font-open-sans text-[12px] ${dark ? "text-white/60" : "text-[#9CA3AF]"} mb-2 uppercase tracking-wider`}
    >
      {label}
    </Text>
    {children}
  </View>
);

export default function Components() {
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dateValue, setDateValue] = useState(new Date());

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <TopTitleNav
          title="Componentes"
          subtitle="Design System AIDE"
          href="/"
        />

        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* BUTTONS */}
          <ComponentSection title="Buttons">
            <ComponentItem label="Button - Primary">
              <Button variant="primary" label="Começa Já!" onPress={() => {}} />
            </ComponentItem>

            <ComponentItem label="Button - Primary Dark" dark>
              <Button
                variant="primaryDark"
                label="Continuar"
                onPress={() => {}}
              />
            </ComponentItem>

            <ComponentItem label="Button - List">
              <Button variant="list" label="Ver detalhes" onPress={() => {}} />
            </ComponentItem>

            <ComponentItem label="Button - List Dark" dark>
              <Button
                variant="listDark"
                label="Configurações"
                onPress={() => {}}
              />
            </ComponentItem>

            <ComponentItem label="BackButton">
              <BackButton label="Voltar" dark />
            </ComponentItem>

            <ComponentItem label="BackButton - Light" dark>
              <BackButton label="Voltar" />
            </ComponentItem>
          </ComponentSection>

          {/* INPUTS */}
          <ComponentSection title="Inputs">
            <ComponentItem label="Input - Text (Light)">
              <Input
                variant="light"
                type="text"
                placeholder="Digite seu nome"
                value={inputValue}
                onChangeText={setInputValue}
              />
            </ComponentItem>

            <ComponentItem label="Input - Text (Dark)" dark>
              <Input variant="dark" type="text" placeholder="Digite seu nome" />
            </ComponentItem>

            <ComponentItem label="Input - Email">
              <Input
                variant="light"
                type="email"
                placeholder="exemplo@email.com"
              />
            </ComponentItem>

            <ComponentItem label="Input - Password">
              <Input variant="light" type="password" placeholder="••••••••" />
            </ComponentItem>

            <ComponentItem label="Input - Date">
              <Input
                variant="light"
                type="date"
                dateValue={dateValue}
                onDateChange={setDateValue}
              />
            </ComponentItem>
          </ComponentSection>

          {/* NAVIGATION */}
          <ComponentSection title="Navigation">
            <ComponentItem label="TopTitleNav">
              <View className="bg-white rounded-lg overflow-hidden">
                <TopTitleNav
                  title="Título da Página"
                  subtitle="Subtítulo opcional"
                />
              </View>
            </ComponentItem>

            <ComponentItem label="Navbar" dark>
              <View className="h-24 relative">
                <Navbar dark />
              </View>
            </ComponentItem>

            <ComponentItem label="Navbar - Light">
              <View className="h-24 relative">
                <Navbar />
              </View>
            </ComponentItem>
          </ComponentSection>

          {/* CHARTS */}
          <ComponentSection title="Charts">
            <ComponentItem label="LineChartSlim">
              <SimpleLineChart
                data={[10, 25, 15, 30, 20, 35, 25, 40, 30, 45]}
                height={100}
              />
            </ComponentItem>

            <ComponentItem label="MiniSparkline">
              <MiniSparkline
                data={[100, 102, 101, 103, 105, 102, 108, 110, 107, 112]}
                width={280}
                height={30}
                color="#5C6CFF"
              />
            </ComponentItem>

            <ComponentItem label="MiniSparkline - Red">
              <MiniSparkline
                data={[50, 45, 48, 42, 40, 38, 35, 32, 30, 28]}
                width={280}
                height={30}
                color="#FF5C5C"
              />
            </ComponentItem>
          </ComponentSection>

          {/* WIDGETS */}
          <ComponentSection title="Widgets">
            <ComponentItem label="WidgetWrapper - 1x1">
              <View className="items-center">
                <WidgetWrapper
                  title="BPM"
                  variant="1-1"
                  icon={<WidgetIcon variant="heartRate" />}
                  value="78"
                  unit="bpm"
                  feedback="Normal"
                  feedbackColor="#D4EDDA"
                />
              </View>
            </ComponentItem>

            <ComponentItem label="WidgetWrapper - 1x2">
              <View className="items-center">
                <WidgetWrapper
                  title="Glucose"
                  variant="1-2"
                  icon={<WidgetIcon variant="o2" />}
                  value="95"
                  unit="mg/dL"
                  feedback="Óptimo"
                  feedbackColor="#D4EDDA"
                />
              </View>
            </ComponentItem>

            <ComponentItem label="WidgetWrapper - 1x3">
              <View className="items-center">
                <WidgetWrapper
                  title="Passos"
                  variant="1-3"
                  icon={<WidgetIcon variant="steps" />}
                  value="8,452"
                  unit="passos"
                  feedback="85% da meta"
                  feedbackColor="#FFF3CD"
                />
              </View>
            </ComponentItem>
          </ComponentSection>

          {/* ICONS */}
          <ComponentSection title="Icons">
            <ComponentItem label="SVG Icons">
              <View className="flex-row flex-wrap gap-4 items-center">
                <View className="items-center">
                  <AddIcon />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">
                    AddIcon
                  </Text>
                </View>
                <View className="items-center">
                  <AideIcon />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">
                    AideIcon
                  </Text>
                </View>
                <View className="items-center">
                  <CalendarIcon />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">
                    CalendarIcon
                  </Text>
                </View>
                <View className="items-center">
                  <HomeIcon />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">
                    HomeIcon
                  </Text>
                </View>
                <View className="items-center">
                  <ProfileIcon />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">
                    ProfileIcon
                  </Text>
                </View>
              </View>
            </ComponentItem>

            <ComponentItem label="ArrowIcon - Variants">
              <View className="flex-row gap-6 items-center justify-center">
                <View className="items-center">
                  <ArrowIcon variant="LEFT" dark />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">LEFT</Text>
                </View>
                <View className="items-center">
                  <ArrowIcon variant="RIGHT" dark />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">RIGHT</Text>
                </View>
                <View className="items-center">
                  <ArrowIcon variant="UP" dark />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">UP</Text>
                </View>
                <View className="items-center">
                  <ArrowIcon variant="DOWN" dark />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">DOWN</Text>
                </View>
              </View>
            </ComponentItem>

            <ComponentItem label="EyeIcon - Variants">
              <View className="flex-row gap-6 items-center justify-center">
                <View className="items-center">
                  <EyeIcon variant="open" />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">open</Text>
                </View>
                <View className="items-center">
                  <EyeIcon variant="close" />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">close</Text>
                </View>
              </View>
            </ComponentItem>

            <ComponentItem label="WidgetIcon - Variants">
              <View className="flex-row flex-wrap gap-4 items-center justify-center">
                <View className="items-center">
                  <WidgetIcon variant="heartRate" />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">
                    heartRate
                  </Text>
                </View>
                <View className="items-center">
                  <WidgetIcon variant="o2" />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">o2</Text>
                </View>
                <View className="items-center">
                  <WidgetIcon variant="steps" />
                  <Text className="text-[10px] text-[#9CA3AF] mt-1">steps</Text>
                </View>
              </View>
            </ComponentItem>
          </ComponentSection>

          {/* MODALS */}
          <ComponentSection title="Modals">
            <ComponentItem label="BottomModal">
              <Button
                variant="primary"
                label="Abrir Modal"
                onPress={() => setModalVisible(true)}
              />
            </ComponentItem>
          </ComponentSection>

          {/* BACKGROUNDS */}
          <ComponentSection title="Backgrounds">
            <ComponentItem label="GradientBackground">
              <View className="h-32 rounded-lg overflow-hidden">
                <GradientBackground>
                  <View className="flex-1 justify-center items-center">
                    <Text className="text-[#1A1A2E] font-open-sans">
                      #FFFFFF → #DBEDF8
                    </Text>
                  </View>
                </GradientBackground>
              </View>
            </ComponentItem>
          </ComponentSection>
        </ScrollView>

        {/* Bottom Modal */}
        <BottomModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        >
          <View className="items-center py-6">
            <Text className="font-safiro text-[24px] text-[#1A1A2E] mb-4">
              Modal de Exemplo
            </Text>
            <Text className="font-open-sans text-[15px] text-[#4B5563] text-center mb-6">
              Este é um exemplo de BottomModal com conteúdo personalizado.
            </Text>
            <Button
              variant="primary"
              label="Fechar"
              onPress={() => setModalVisible(false)}
            />
          </View>
        </BottomModal>
      </SafeAreaView>
    </GradientBackground>
  );
}
