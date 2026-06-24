import BackButton from "@/components/buttons/backButton";
import { Button } from "@/components/buttons/button";
import LightBackground from "@/components/DotBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useTheme } from "@/hooks/useTheme";
import { forceSyncAll } from "@/src/tasks/healthBackgroundSync";
import { getSupabaseClient } from "@/utils/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { Camera, Pencil } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GerirPerfilFormulario from "../components/gerir_perfil_formulario";

type UserFormData = {
  nome: string;
  email: string;
  contacto: string;
  nif: string;
  password: string;
};

const EMPTY_FORM: UserFormData = {
  nome: "",
  email: "",
  contacto: "",
  nif: "",
  password: "",
};

const GerirPerfil = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isDark } = useTheme();
  const { signOut, user } = useAuth();
  const { profileType } = useUserProfile();

  const accountTypeLabel =
    profileType === "aider"
      ? "Aider"
      : profileType === "cuidado"
        ? "Cuidado"
        : "Nao definido";

  const [userData, setUserData] = useState<UserFormData>(EMPTY_FORM);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setUserData(EMPTY_FORM);
        return;
      }

      try {
        const { data, error } = await getSupabaseClient()
          .from("users")
          .select("name, email, phone_number, nif")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        setUserData((previous) => ({
          ...previous,
          nome:
            typeof data?.name === "string"
              ? data.name
              : typeof user.user_metadata?.name === "string"
                ? user.user_metadata.name
                : "",
          email:
            typeof data?.email === "string" ? data.email : (user.email ?? ""),
          contacto:
            typeof data?.phone_number === "string" ? data.phone_number : "",
          nif: typeof data?.nif === "string" ? data.nif : "",
        }));
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setUserData((previous) => ({
          ...previous,
          nome:
            typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : "",
          email: user.email ?? "",
          contacto: "",
          nif: "",
        }));
      }
    };

    loadProfile();
  }, [user?.email, user?.id, user?.user_metadata?.name]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "Sessao invalida. Inicie sessao novamente.");
      return;
    }

    try {
      setIsSavingProfile(true);
      const { error } = await getSupabaseClient()
        .from("users")
        .update({
          name: userData.nome.trim() || null,
          phone_number: userData.contacto.trim() || null,
          nif: userData.nif.trim() || null,
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setIsEditing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso.");
    } catch (error) {
      console.error("Erro ao guardar perfil:", error);
      Alert.alert("Erro", "Nao foi possivel guardar os dados do perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      await signOut();
    } catch {
      Alert.alert(
        "Erro",
        "Nao foi possivel terminar a sessao. Tente novamente.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="mb-4">
            <BackButton label="Gerir Perfil" dark={isDark} />
          </View>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Foto de Perfil */}
            <View className="items-center my-6">
              <View
                className={`w-32 h-32 rounded-full items-center justify-center relative border-4 ${isDark ? "bg-[#1a1a2e] border-white/20" : "bg-[#E0E0E0] border-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <Text
                  className={`text-4xl font-medium ${isDark ? "text-white/60" : "text-[#555]"}`}
                >
                  {(userData.nome || user?.email || "U")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </Text>
                <TouchableOpacity className="absolute bottom-0 right-0 bg-black p-2 rounded-full border-2 border-white">
                  <Camera size={16} color="white" />
                </TouchableOpacity>
              </View>

              <View
                className={`mt-4 px-4 py-2 rounded-full ${isDark ? "bg-[#5061FF]/25" : "bg-[#5061FF]/12"}`}
              >
                <Text
                  className={`text-xs font-bold uppercase tracking-wide ${isDark ? "text-[#C9D0FF]" : "text-[#3342CC]"}`}
                >
                  Tipo de conta: {accountTypeLabel}
                </Text>
              </View>
            </View>

            {/* Título e Lápis */}
            <View className="px-4 mb-2">
              <Text
                className={`text-xs font-open-sans font-bold uppercase tracking-tighter ${isDark ? "text-white/60" : "text-black"}`}
              >
                Aqui pode fazer alterações às suas informações de{"\n"}
                identificação e de contacto.
              </Text>
              <View className="flex-row justify-between items-center mt-6 mb-2">
                <Text
                  className={`text-lg font-safiro ${isDark ? "text-white" : "text-[#111]"}`}
                >
                  A SUA IDENTIFICAÇÃO
                </Text>
                {!isEditing && (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Pencil size={22} color={isDark ? "white" : "black"} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <GerirPerfilFormulario
              formData={userData}
              setFormData={setUserData}
              isEditing={isEditing}
            />

            {/* Botão Alterar */}
            <View className="mt-4 px-4">
              <View className="w-full items-center">
                <Button
                  variant="primary"
                  label={isSavingProfile ? "A guardar..." : "Alterar"}
                  onPress={handleSave}
                  loading={isSavingProfile}
                />
              </View>
            </View>

            {/* Cards Extras */}
            <View className="px-4 mt-10">
              <View
                className={`p-6 rounded-[32px] mb-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <Text
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
                >
                  Apagar Conta
                </Text>
                <Text
                  className={`text-xs font-bold mt-1 ${isDark ? "text-white/60" : "text-gray-800"}`}
                >
                  Ao apagar a sua conta todos os dados vão ser perdidos no
                  espaço de 30 dias.
                </Text>
                <TouchableOpacity
                  className="mt-4 py-3 rounded-xl items-center self-center"
                  onPress={() => console.log("Apagar conta")}
                >
                  <View
                    className={`py-3 px-8 rounded-xl ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
                  >
                    <Text
                      className={`font-medium ${isDark ? "text-red-400" : "text-red-600"}`}
                    >
                      Apagar
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {Platform.OS === "android" && (
                <View
                  className={`p-6 rounded-[32px] mt-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                  style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
                    >
                      Sincronização
                    </Text>
                    <Ionicons
                      name="sync-outline"
                      size={24}
                      color={isDark ? "#A0AEC0" : "#4A5568"}
                    />
                  </View>
                  <Text
                    className={`text-xs font-bold mt-1 ${isDark ? "text-white/60" : "text-gray-800"}`}
                  >
                    Força a sincronização completa dos últimos 30 dias a partir
                    do Health Connect, ignorando a última sincronização
                    guardada.
                  </Text>
                  <TouchableOpacity
                    className="mt-4 py-3 rounded-xl items-center self-center"
                    disabled={isSyncing}
                    onPress={async () => {
                      setIsSyncing(true);
                      try {
                        await forceSyncAll();
                        Alert.alert(
                          "Sincronização concluída",
                          "Os dados dos últimos 30 dias foram sincronizados.",
                        );
                      } catch {
                        Alert.alert(
                          "Erro",
                          "Não foi possível sincronizar os dados. Tente novamente.",
                        );
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                  >
                    <View
                      className={`py-3 px-8 rounded-xl ${isDark ? "bg-white/10" : "bg-slate-100"} ${isSyncing ? "opacity-60" : ""}`}
                    >
                      <Text
                        className={`font-medium ${isDark ? "text-white" : "text-slate-700"}`}
                      >
                        {isSyncing ? "A sincronizar..." : "sync force --all"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <View
                className={`p-6 rounded-[32px] mt-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <Text
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
                >
                  Pedir Dados
                </Text>
                <Text
                  className={`text-xs font-bold mt-1 ${isDark ? "text-white/60" : "text-gray-800"}`}
                >
                  Pedir dados que a AIDE têm sobre ti, desde a sua criação de
                  conta em formato XML.
                </Text>
                <TouchableOpacity
                  className="mt-4 py-3 rounded-xl items-center self-center"
                  onPress={() => console.log("Extrair dados")}
                >
                  <View
                    className={`py-3 px-8 rounded-xl ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}
                  >
                    <Text
                      className={`font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      Extrair
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View className="mt-6">
                <TouchableOpacity
                  className="w-full items-center"
                  onPress={handleLogout}
                  disabled={isSigningOut}
                >
                  <View
                    className={`py-3 px-8 rounded-xl ${isDark ? "bg-red-500/20" : "bg-red-100"} ${isSigningOut ? "opacity-70" : ""}`}
                  >
                    <Text
                      className={`font-medium ${isDark ? "text-red-400" : "text-red-600"}`}
                    >
                      {isSigningOut ? "A terminar sessao..." : "Logout"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default GerirPerfil;
