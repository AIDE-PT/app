import BackButton from "@/components/buttons/backButton";
import { Button } from "@/components/buttons/button";
import SimpleLineChart from "@/components/charts/LineChartSlim";
import { Input } from "@/components/input/Input";
import BottomModal from "@/components/modals/BottomModal";
import Navbar from "@/components/navBar/NavBar";
import WidgetIcon from "@/components/svg/WidgetIcon";
import TopBar from "@/components/topBar/TopBar";
import WidgetGrid from "@/components/widgets/WidgetGrid";
import { WidgetWrapper } from "@/components/widgets/WidgetWrapper";
import clsx from "clsx";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TestScreen() {
  const [color, setColor] = useState("blue");
  const [value, setValue] = useState("");
  const [pass, setPass] = useState("");
  const [date, setDatetPass] = useState("");
  const [email, setEmail] = useState("");

  const cuidados = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Maria Santos" },
  ];
  const [selectedCuidado, setSelectedCuidado] = useState(cuidados[0]);

  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);

  const data = [{ value: 50 }, { value: 80 }, { value: 90 }, { value: 70 }];

  return (
    <SafeAreaView className=" bg-[#ECF5FF]">
      <TopBar
        cuidados={cuidados}
        selectedCuidado={selectedCuidado}
        onSelectCuidado={setSelectedCuidado}
        onNotificationPress={() => console.log("Notification")}
        onSettingsPress={() => console.log("Settings")}
      />
      <ScrollView className=" px-4 pb-5">
        <Input
          value={value}
          onChangeText={(str: string) => setValue(str)}
          placeholder="exemplo"
        />
        <Input
          value={pass}
          type="password"
          onChangeText={(str: string) => setPass(str)}
          placeholder="Password"
        />
        <Input
          value={date}
          type="date"
          onChangeText={(str: string) => setDatetPass(str)}
          placeholder="data"
        />
        <Input
          value={email}
          type="email"
          onChangeText={(str: string) => setEmail(str)}
          placeholder="email"
        />

        <SimpleLineChart />

        <WidgetGrid>
          <WidgetWrapper
            feedback="exercicio"
            unit="bpm"
            value="73"
            feedbackColor="#FFCC00"
            icon={<WidgetIcon variant="heartRate" />}
            title="BPM"
            variant="1-1"
          />
          <WidgetWrapper
            feedback="exercicio"
            unit="bpm"
            value="73"
            feedbackColor="#FFCC00"
            icon={<WidgetIcon variant="steps" />}
            title="Passos"
            variant="1-2"
          />
          <WidgetWrapper
            feedback="exercicio"
            unit="bpm"
            value="73"
            feedbackColor="#FFCC00"
            icon={<WidgetIcon variant="heartRate" />}
            title="BPM"
            variant="1-3"
          />
          <WidgetWrapper
            feedback="exercicio"
            unit="bpm"
            value="73"
            feedbackColor="#FFCC00"
            icon={<WidgetIcon variant="temp" />}
            title="Temperatura"
            variant="2-3"
          />
        </WidgetGrid>

        <Button
          label="list"
          variant="list"
          onPress={() => setIsAddDeviceOpen(true)}
        />

        <BottomModal
          visible={isAddDeviceOpen}
          onClose={() => setIsAddDeviceOpen(false)}
        >
          {/* CONTEÚDO REAL */}
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            Adicionar Dispositivos
          </Text>

          <Text style={{ marginTop: 4, color: "#6B7280" }}>
            Selecione uma das fontes de dados disponíveis
          </Text>
        </BottomModal>

        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-6">
          Native Wind Test
        </Text>

        {/* Color Palette */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Colors
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setColor("blue")}>
              <View className="h-16 w-16 bg-blue-500 rounded-lg" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setColor("red")}>
              <View className="h-16 w-16 bg-red-500 rounded-lg" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setColor("green")}>
              <View className="h-16 w-16 bg-green-500 rounded-lg" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity className="bg-blue-600 rounded-lg py-3 px-4 mb-4">
          <Text className="text-white text-center font-semibold">
            Test Button
          </Text>
        </TouchableOpacity>

        {/* Card */}
        <View
          className={clsx("rounded-lg p-4 mb-4", {
            "bg-blue-100": color === "blue",
            "bg-red-100": color === "red",
            "bg-green-100": color === "green",
          })}
        >
          <Text className="text-gray-900 font-semibold mb-2">
            Card Component
          </Text>
          <Text className="text-gray-600">
            This is a test card with Tailwind styling
          </Text>
        </View>
        <View className="bg-slate-400">
          <BackButton />
          <BackButton dark />
        </View>
        <Button
          label="primario"
          variant="primary"
          onPress={() => console.log("primario")}
        />
        <Button
          label="primario dark"
          variant="primaryDark"
          onPress={() => console.log("primario dark")}
        />
        <Button
          label="list"
          variant="list"
          onPress={() => console.log("primario")}
        />
        <Button
          label="list dark"
          variant="listDark"
          onPress={() => console.log("primario dark")}
        />

        <LineChart data={data} areaChart />
      </ScrollView>
      <Navbar />
    </SafeAreaView>
  );
}
