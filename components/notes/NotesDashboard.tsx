import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useFocusEffect } from "@react-navigation/native";

const STORAGE_KEY = "@aide_notes";
const REORDER_KEY = "@aide_notes_order";

export type Note = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

const NOTE_COLORS = ["#FFFFFF", "#FFF7D6", "#EAF7FF", "#F1F8E9", "#FCE7F3"];

export default function NotesDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: Note[] = raw ? JSON.parse(raw) : [];

      const orderRaw = await AsyncStorage.getItem(REORDER_KEY);
      if (orderRaw) {
        const order: string[] = JSON.parse(orderRaw);
        const noteMap = new Map(parsed.map((n) => [n.id, n]));
        const ordered = order
          .map((id) => noteMap.get(id))
          .filter((n): n is Note => n !== undefined);
        const remaining = parsed.filter((n) => !order.includes(n.id));
        remaining.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setNotes([...ordered, ...remaining]);
      } else {
        parsed.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setNotes(parsed);
      }
    } catch (error) {
      console.log("Erro ao carregar notas", error);
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

  const deleteNote = (noteId: string) => {
    Alert.alert("Eliminar nota", "Tem a certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const updated = notes.filter((n) => n.id !== noteId);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          const orderRaw = await AsyncStorage.getItem(REORDER_KEY);
          if (orderRaw) {
            const order: string[] = JSON.parse(orderRaw);
            await AsyncStorage.setItem(
              REORDER_KEY,
              JSON.stringify(order.filter((id) => id !== noteId)),
            );
          }
          setNotes(updated);
        },
      },
    ]);
  };

  const persistOrder = async (orderedIds: string[]) => {
    await AsyncStorage.setItem(REORDER_KEY, JSON.stringify(orderedIds));
  };

  const moveNote = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= notes.length) return;

    setNotes((current) => {
      const updated = [...current];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      persistOrder(updated.map((n) => n.id));
      return updated;
    });
  };

  const enterReorderMode = () => setReorderMode(true);
  const exitReorderMode = () => setReorderMode(false);

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
        onLongPress={() => deleteNote(item.id)}
        className="mb-3 w-[48.5%]"
      >
        <View
          className={`rounded-[20px] border p-4 min-h-[130px] justify-between ${
            isDark
              ? "bg-[#131632] border-white/10"
              : "bg-white border-white/90"
          }`}
          style={{
            backgroundColor: isDark ? "rgba(19,22,50,0.92)" : NOTE_COLORS[colorIndex],
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
              {item.content || "Sem conteúdo"}
            </Text>
          </View>

          <View className="mt-3">
            <Text className={`text-[10px] ${textMuted}`} numberOfLines={1}>
              {item.author} ·{" "}
              {format(new Date(item.updatedAt), "dd/MM/yyyy")}
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