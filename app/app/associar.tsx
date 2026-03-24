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

const emailSchema = z.string().email({ message: "Email invalido" });

export default function AssociarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [, setLastScan] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isDark } = useTheme();

  const handleAvancar = () => {
    try {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || "Email invalido";
        setError(errorMessage);
      } else {
        setError("");
        console.log("Email valido:", email);
        setShowConfirmation(true);
      }
    } catch (e) {
      console.error("Erro na validacao:", e);
      setError("Erro ao validar email");
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
      <SafeAreaView className="flex-1 bg-transparent">
        <View className="flex-1 px-4 pt-10">
          <BackButton
            label="Adicionar um cuidado"
            onPress={() => router.back()}
          />

          <View className="flex-1 px-4 pt-10">
            <View className="mb-8 items-center">
              <Text
                className={`mb-6 self-start font-open-sans text-lg ${
                  isDark ? "text-white" : "text-gray-700"
                }`}
              >
                Associar com QR Code
              </Text>
              <QRcode onScan={handleScanResult} size={176} />
            </View>

            <View className="mb-8 flex-row items-center">
              <View
                className={`h-[1px] flex-1 ${
                  isDark ? "bg-white/20" : "bg-gray-300"
                }`}
              />
              <Text
                className={`mx-4 text-xl font-bold ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Ou
              </Text>
              <View
                className={`h-[1px] flex-1 ${
                  isDark ? "bg-white/20" : "bg-gray-300"
                }`}
              />
            </View>

            <View className="mb-8">
              <Text
                className={`mb-4 font-open-sans text-lg ${
                  isDark ? "text-white" : "text-gray-700"
                }`}
              >
                Associar com email
              </Text>
              <Input
                type="email"
                label="Email do cuidado"
                placeholder="cuidado@email.com"
                value={email}
                onChangeText={(text: string) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                variant="light"
                helperText="Introduza o email associado ao perfil que quer ligar."
                errorText={error || undefined}
              />
            </View>
          </View>

          <View className="w-full items-center px-8 pb-12">
            <Button variant="primary" label="Avancar" onPress={handleAvancar} />
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
