import BackButton from "@/components/buttons/backButton";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { Camera, Pencil } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GerirPerfilFormulario from "../components/gerir_perfil_formulario";

const GerirPerfil = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [userData, setUserData] = useState({
    nome: "Emília Almeida",
    email: "almeida.emilia@gmail.com",
    contacto: "+351 983 987 657",
    nif: "231432256",
    password: "password123",
  });

  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  const handleSave = () => {
    setIsEditing(false);
    console.log("Alterações salvas localmente:", userData);
  };

  return (
   <View className="flex-1 px-4 pt-10 bg-aide-background">
       <SafeAreaView className="flex-1">
        {/* Header */}
         <View className="mb-4">
          <BackButton label="Gerir Perfil" dark/>
        </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto de Perfil */}
        <View className="items-center my-6">
          <View className="w-32 h-32 bg-[#E0E0E0] rounded-full items-center justify-center relative border-4 border-white shadow-sm">
            <Text className="text-4xl font-medium text-[#555]">E</Text>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-black p-2 rounded-full border-2 border-white">
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Título e Lápis */}
        <View className="px-4 mb-2">
          <Text className="text-[11px] font-open-sans font-bold uppercase tracking-tighter">
            Aqui pode fazer alterações às suas informações de{"\n"}identificação
            e de contacto.
          </Text>
          <View className="flex-row justify-between items-center mt-6 mb-2">
            <Text className="text-lg font-safiro text-[#111]">
              A SUA IDENTIFICAÇÃO
            </Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Pencil size={22} color="black" />
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
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isEditing}
            className={`py-4 rounded-full items-center ${
              isEditing ? "bg-[#E1E9FF] shadow-md" : "bg-[#E1E9FF] opacity-40"
            }`}
          >
            <Text className="text-lg font-bold text-[#111]">Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* Cards Extras */}
        <View className="px-4 mt-10">
          <View className="bg-[#E2E8F0] p-6 rounded-[32px] mb-4">
            <Text className="text-xl font-bold">Apagar Conta</Text>
            <Text className="text-xs font-bold text-gray-800 mt-1">
              Ao apagar a sua conta todos os dados vão ser perdidos no espaço de
              30 dias.
            </Text>
            <TouchableOpacity className="bg-[#CBD5E1] mt-4 py-3 rounded-full items-center w-36 self-center">
              <Text className="text-red-500 font-bold">Apagar</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-[#E2E8F0] p-6 rounded-[32px]">
            <Text className="text-xl font-bold">Pedir Dados</Text>
            <Text className="text-xs font-bold text-gray-800 mt-1">
              Pedir dados que a AIDE têm sobre ti, desde a sua criação de conta
              em formato XML.
            </Text>
            <TouchableOpacity className="bg-[#CBD5E1] mt-4 py-3 rounded-full items-center w-36 self-center">
              <Text className="text-white font-bold">Extrair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
};

export default GerirPerfil;
