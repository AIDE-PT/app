import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LightBackground from "@/components/DotBackground";
import BackButton from "@/components/buttons/backButton";
import { useTheme } from "@/hooks/useTheme";
import {
  createNote,
  getNoteById,
  updateNote,
} from "@/utils/supabase/notesService";

const DEFAULT_AUTHOR = "frontend-demo-user";

export default function AddNoteForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState(DEFAULT_AUTHOR);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (!id) return;

    const loadNote = async () => {
      try {
        const note = await getNoteById(id);
        if (note) {
          setTitle(note.title);
          setContent(note.description || "");
          setAuthor(note.creator_id || DEFAULT_AUTHOR);
        }
      } catch (error) {
        console.log("Erro ao carregar nota", error);
      }
    };

    loadNote();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Nota vazia", "Adicione um título ou conteúdo.");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: substituir estes valores pelos IDs reais do paciente/utilizador
      const patientId = "demo-patient-id";
      const creatorId = "demo-creator-id";

      if (isEditing && id) {
        await updateNote(id, {
          title: title.trim() || "Sem título",
          description: content.trim(),
        });
      } else {
        await createNote({
          patient_id: patientId,
          creator_id: creatorId,
          title: title.trim() || "Sem título",
          description: content.trim(),
        });
      }

      router.back();
    } catch (error) {
      console.log("Erro ao guardar nota", error);
      Alert.alert("Erro", "Não foi possível guardar a nota.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = isDark
    ? "border-white/10 bg-white/10 text-white"
    : "border-white bg-white/95 text-slate-950";
  const textMain = isDark ? "text-white" : "text-slate-950";
  const textMuted = isDark ? "text-slate-300" : "text-slate-600";

  return (
    <LightBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4 pt-6">
            <View className="mb-5 flex-row items-center justify-between">
              <BackButton
                label={isEditing ? "Editar Nota" : "Nova Nota"}
                dark={isDark}
              />
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className={`rounded-full border px-4 py-2 ${
                  isDark
                    ? "border-white/10 bg-white"
                    : "border-white bg-[#111827]"
                }`}
                accessibilityRole="button"
                accessibilityLabel="Guardar nota"
              >
                <Text
                  className={`text-sm font-open-sans-semibold ${
                    isDark ? "text-slate-950" : "text-white"
                  }`}
                >
                  {isSaving ? "A guardar..." : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              <View
                className={`rounded-[24px] border p-4 ${
                  isDark
                    ? "bg-aide-dark-card border-white/10"
                    : "bg-white/85 border-white"
                }`}
              >
                <Text
                  className={`text-xs uppercase tracking-[0.4px] ${textMuted}`}
                >
                  Editor da equipa Aider
                </Text>

                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Título da nota"
                  placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
                  className={`mt-3 rounded-[18px] border px-4 py-4 text-[28px] font-safiro ${inputClass}`}
                />

                <View className="mt-4 flex-row flex-wrap gap-2">
                  <View
                    className={`rounded-full border px-3 py-2 ${inputClass}`}
                  >
                    <Text className={`text-sm ${textMuted}`}>
                      Autor: {author}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full border px-3 py-2 ${inputClass}`}
                  >
                    <Text className={`text-sm ${textMuted}`}>
                      {format(new Date(), "dd MMM yyyy '·' HH:mm")}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                className={`mt-4 rounded-[24px] border p-4 ${
                  isDark
                    ? "bg-aide-dark-card border-white/10"
                    : "bg-white/85 border-white"
                }`}
              >
                <Text className={`text-sm font-open-sans-semibold ${textMain}`}>
                  Conteúdo
                </Text>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Escreva o conteúdo da nota..."
                  placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
                  multiline
                  textAlignVertical="top"
                  className={`mt-2 min-h-[260px] rounded-[18px] border px-4 py-4 text-base leading-6 ${inputClass}`}
                />
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LightBackground>
  );
}
