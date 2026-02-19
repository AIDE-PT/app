import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import BackButton from "../components/buttons/backButton";
import { Button } from "../components/buttons/button";
import { Input } from "../components/input/Input";
import { QRcode } from "../components/input/QRcode";
import AssociarConfirmationModal from "../components/modals/AssociarConfirmationModal";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";

const emailSchema = z.string().email({ message: "E-mail inválido" });

export default function AssociarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [, setLastScan] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isDark } = useTheme();

  const handleAvançar = () => {
    try {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        const errorMessage =
          result.error.issues?.[0]?.message || "E-mail inválido";
        setError(errorMessage);
      } else {
        setError("");
        console.log("Email válido:", email);
        setShowConfirmation(true);
      }
    } catch (e) {
      console.error("Erro na validação:", e);
      setError("Erro ao validar e-mail");
    }
  };

  const handleScanResult = (data: string) => {
    console.log("QR result:", data);
    setLastScan(data);
    setError("");
    setShowConfirmation(true);
  };

  const handleConfirmAssociation = () => {
    console.log("Associado com sucesso!");
    setShowConfirmation(false);
    router.push("/testDashboard");
  };

  return (
    <LightBackground>
      <SafeAreaView className={`flex-1 ${isDark ? "bg-transparent" : "bg-transparent"}`}>
        <View className="flex-1 px-4 pt-10">
        {/* Header */}
        <BackButton
          label="Adicionar um cuidado"
          dark={isDark ? false : true}
          onPress={() => router.back()}
        />

        <View className="flex-1 px-4 pt-10">
          {/* QR Code Section */}
          <View className="items-center mb-8">
            <Text className={`font-open-sans text-lg mb-6 self-start ${isDark ? "text-white" : "text-gray-700"}`}>
              Associar com QR Code
            </Text>
            <QRcode onScan={handleScanResult} size={176} />
          </View>

          {/* Separator */}
          <View className="flex-row items-center mb-8">
            <View className={`flex-1 h-[1px] ${isDark ? "bg-white/20" : "bg-gray-300"}`} />
            <Text className={`mx-4 font-bold text-xl ${isDark ? "text-white" : "text-black"}`}>Ou</Text>
            <View className={`flex-1 h-[1px] ${isDark ? "bg-white/20" : "bg-gray-300"}`} />
          </View>

          {/* Email Section */}
          <View className="mb-8">
            <Text className={`font-open-sans text-lg mb-4 ${isDark ? "text-white" : "text-gray-700"}`}>
              Associar com email
            </Text>
            <Input
              type="email"
              placeholder="cuidado@email.com"
              value={email}
              onChangeText={(text: string) => {
                setEmail(text);
                if (error) setError("");
              }}
              variant="light"
            />
            {error ? (
              <Text className="text-red-500 text-xs mt-1 ml-4">{error}</Text>
            ) : null}
          </View>
        </View>

        {/* Footer Button */}
        <View className="items-center pb-12 px-8 w-full">
          <Button variant="primary" label="Avançar" onPress={handleAvançar} />
        </View>

        <AssociarConfirmationModal
          visible={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmAssociation}
          data={{
            name: "Emilia Silva",
            email: email || "emiliasilva@gmail.com",
            initial: "E",
          }}
        />
      </View>
    </SafeAreaView>
  </LightBackground>
  );
}
