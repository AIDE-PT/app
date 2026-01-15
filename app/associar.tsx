import { router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { Input } from "../components/input/Input";
import { QRcode } from "../components/input/QRcode";
import AssociarConfirmationModal from "../components/modals/AssociarConfirmationModal";
import ArrowIcon from "../components/svg/ArrowIcon";

const emailSchema = z.string().email({ message: "E-mail inválido" });

export default function AssociarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [lastScan, setLastScan] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAvançar = () => {
    try {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        // Zod validation failed
        const errorMessage =
          result.error.issues?.[0]?.message || "E-mail inválido";
        setError(errorMessage);
        // For testing purposes, we can keep error or force show if user specifically asked to "always work"
        // but let's stick to valid email requirement for now, or just show it if data exists.
      } else {
        // Success
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
    // Show confirmation on any QR code as requested
    setShowConfirmation(true);
  };

  const handleConfirmAssociation = () => {
    console.log("Associado com sucesso!");
    setShowConfirmation(false);
    // Add logic here to finish the process (e.g., redirect or success message)
  };

  return (
    <SafeAreaView className="flex-1 bg-[#ECF5FF]">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-12 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowIcon variant="LEFT" dark size={24} />
          </TouchableOpacity>
          <Text className="font-safiro text-2xl text-black ml-2">
            Adicionar um cuidado
          </Text>
        </View>

        <View className="flex-1 px-8 pt-10">
          {/* QR Code Section */}
          <View className="items-center mb-8">
            <Text className="font-open-sans text-gray-700 text-lg mb-6 self-start">
              Associar com QR Code
            </Text>
            <QRcode onScan={handleScanResult} size={176} />
          </View>

          {/* Separator */}
          <View className="flex-row items-center mb-8">
            <View className="flex-1 h-[1px] bg-gray-300" />
            <Text className="mx-4 font-bold text-xl text-black">Ou</Text>
            <View className="flex-1 h-[1px] bg-gray-300" />
          </View>

          {/* Email Section */}
          <View className="mb-8">
            <Text className="font-open-sans text-gray-700 text-lg mb-4">
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
          <TouchableOpacity
            onPress={handleAvançar}
            className="w-[60%] max-w-[280px] bg-[#7C89FF] py-3 rounded-[20px] items-center justify-center"
          >
            <Text className="font-open-sans font-semibold text-base text-black">
              Avançar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <AssociarConfirmationModal
        visible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmAssociation}
        data={{
          name: "Emilia Silva",
          email: email || "emiliasilva@gmail.com", // Show typed email if available
          initial: "E",
        }}
      />
    </SafeAreaView>
  );
}
