import LightBackground from "@/components/DotBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/utils/supabase/client";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import BackButton from "../components/buttons/backButton";
import { Button } from "../components/buttons/button";
import { Input } from "../components/input/Input";
import { QRcode } from "../components/input/QRcode";

const emailSchema = z.string().email({ message: "Email invalido" });

const isCuidadoDesignation = (designation: unknown) => {
  const normalized = String(designation ?? "")
    .trim()
    .toLowerCase();

  return (
    normalized === "cuidado" ||
    normalized === "patient" ||
    normalized === "pacient" ||
    normalized === "paciente"
  );
};

export default function AssociarPage() {
  const { user } = useAuth();
  const { profileType } = useUserProfile();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [, setLastScan] = useState("");
  const [isAssociating, setIsAssociating] = useState(false);
  const { isDark } = useTheme();

  const associateByEmail = async (rawEmail: string) => {
    const normalizedEmail = rawEmail.trim().toLowerCase();

    if (!user?.id) {
      setError("Sessao invalida. Inicie sessao novamente.");
      return;
    }

    if (profileType !== "aider") {
      setError("Apenas perfis aider podem associar um cuidado.");
      return;
    }

    setIsAssociating(true);
    try {
      const { data: cuidadoUser, error: cuidadoError } = await supabase
        .from("users")
        .select("id, email, user_type_id")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (cuidadoError) {
        setError("Nao foi possivel procurar este cuidado.");
        return;
      }

      if (!cuidadoUser?.id) {
        setError("Nao existe nenhum cuidado com esse email.");
        return;
      }

      if (cuidadoUser.id === user.id) {
        setError("Nao pode associar a propria conta.");
        return;
      }

      if (!cuidadoUser.user_type_id) {
        setError("A conta indicada nao tem tipo de perfil configurado.");
        return;
      }

      const { data: cuidadoType, error: cuidadoTypeError } = await supabase
        .from("user_types")
        .select("designation")
        .eq("id", cuidadoUser.user_type_id)
        .maybeSingle();

      if (cuidadoTypeError) {
        setError("Nao foi possivel validar o tipo de perfil do cuidado.");
        return;
      }

      if (!isCuidadoDesignation(cuidadoType?.designation)) {
        setError("A conta indicada nao esta configurada como cuidado.");
        return;
      }

      const { data: existingRelation, error: existingError } = await supabase
        .from("care_relations")
        .select("id")
        .eq("user_id_pacient", cuidadoUser.id)
        .eq("user_id_aider", user.id)
        .maybeSingle();

      if (existingError) {
        setError("Erro ao validar associacao existente.");
        return;
      }

      if (!existingRelation?.id) {
        const { error: insertError } = await supabase
          .from("care_relations")
          .insert({
            user_id_pacient: cuidadoUser.id,
            user_id_aider: user.id,
          });

        if (insertError) {
          setError("Nao foi possivel concluir a associacao.");
          return;
        }
      }

      setError("");
      router.push("/testDashboard");
    } catch (associationError) {
      console.error("Erro na associacao:", associationError);
      setError("Erro inesperado ao associar contas.");
    } finally {
      setIsAssociating(false);
    }
  };

  const handleAvancar = async () => {
    try {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        const errorMessage =
          result.error.issues?.[0]?.message || "Email invalido";
        setError(errorMessage);
      } else {
        setError("");
        await associateByEmail(result.data);
      }
    } catch (e) {
      console.error("Erro na validacao:", e);
      setError("Erro ao validar email");
    }
  };

  const handleScanResult = async (data: string) => {
    console.log("QR result:", data);
    setLastScan(data);
    setError("");
    await associateByEmail(data);
  };

  return (
    <LightBackground>
      <SafeAreaView className="flex-1 bg-transparent">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="flex-1 px-4 pt-10">
              <View className="mb-4">
                <BackButton
                  label="Adicionar um cuidado"
                  onPress={() => router.back()}
                />
              </View>

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
                    helperText="Introduza o email do cuidado que quer associar."
                    errorText={error || undefined}
                  />
                </View>
              </View>

              <View className="w-full items-center px-8 pb-8 pt-2">
                <Button
                  variant="primary"
                  label="Avancar"
                  onPress={handleAvancar}
                  loading={isAssociating}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LightBackground>
  );
}
