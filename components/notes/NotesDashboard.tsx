import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LightBackground from "@/components/DotBackground";
import BackButton from "@/components/buttons/backButton";
import { useTheme } from "@/hooks/useTheme";
import {
  deleteNote,
  getNotesByPatient,
  type Note,
} from "@/utils/supabase/notesService";
import { useFocusEffect } from "@react-navigation/native";

const NOTE_COLORS = ["#FFFFFF", "#FFF7D6", "#EAF7FF", "#F1F8E9", "#FCE7F3"];

export default function NotesDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      // TODO: substituir pelo ID do paciente real vindo do perfil/contexto
      const patientId = "demo-patient-id";
      const data = await getNotesByPatient(patientId);

      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      setNotes(sorted);
    } catch (error) {
      console.log("Erro ao carregar notas", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotes();
    }, [loadNotes]),
  );

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Eliminar nota", "Tem a certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNote(noteId);
            setNotes((current) => current.filter((note) => note.id !== noteId));
          } catch (error) {
            console.log("Erro ao eliminar nota", error);
            Alert.alert("Erro", "Não foi possível eliminar a nota.");
          }
        },
      },
    ]);
  };

  const panelClass = isDark
    ? "bg-aide-dark-card border-white/10"
    : "bg-white/85 border-white";
  const textMain = isDark ? "text-white" : "text-slate-950";
  const textMuted = isDark ? "text-slate-300" : "text-slate-600";

  const renderNote = ({ item, index }: { item: Note; index: number }) => {
    const colorIndex = index % NOTE_COLORS.length;
    return (
      <Pressable
        onPress={() => router.push(`/add_notas?id=${item.id}` as never)}
        onLongPress={() => handleDeleteNote(item.id)}
        className="mb-3 w-[48.5%]"
      >
        <View
          className={`rounded-[20px] border p-4 min-h-[130px] justify-between ${
            isDark ? "bg-[#131632] border-white/10" : "bg-white border-white/90"
          }`}
          style={{
            backgroundColor: isDark
              ? "rgba(19,22,50,0.92)"
              : NOTE_COLORS[colorIndex],
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.9)",
          }}
        >
          <View>
            <Text
              className={`text-base font-bold ${textMain}`}
              numberOfLines={2}
            >
              {item.title || "Sem título"}
            </Text>
            <Text
              className={`mt-2 text-sm leading-5 ${textMuted}`}
              numberOfLines={3}
            >
              {item.description || "Sem conteúdo"}
            </Text>
          </View>

          <View className="mt-3">
            <Text className={`text-[10px] ${textMuted}`} numberOfLines={1}>
              {item.creator_id} ·{" "}
              {format(new Date(item.updated_at), "dd/MM/yyyy")}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <LightBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4 pt-6">
          <View className="mb-5 flex-row items-center justify-between">
            <BackButton label="Notas" dark={isDark} />
            <TouchableOpacity
              onPress={() => router.push("/add_notas" as never)}
              className={`h-11 w-11 items-center justify-center rounded-full border ${
                isDark
                  ? "border-white/15 bg-white/10"
                  : "border-white bg-white/90"
              }`}
              accessibilityRole="button"
              accessibilityLabel="Criar nota"
            >
              <Feather
                name="plus"
                size={20}
                color={isDark ? "#ffffff" : "#111827"}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text className={`text-sm ${textMuted}`}>A carregar notas...</Text>
          ) : notes.length === 0 ? (
            <View className={`rounded-[20px] border p-5 ${panelClass}`}>
              <Text className={`text-base font-bold ${textMain}`}>
                Ainda não há notas
              </Text>
              <Text className={`mt-2 text-sm leading-5 ${textMuted}`}>
                Toque no botão + para criar a primeira nota.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notes}
              renderItem={renderNote}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          )}
        </View>
      </SafeAreaView>
    </LightBackground>
  );
}
