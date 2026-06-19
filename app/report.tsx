import LightBackground from "@/components/DotBackground";
import { Button } from "@/components/buttons/button";
import CuidadoModal from "@/components/modals/CuidadoModal";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import useReportGeneration from "@/hooks/useReportGeneration";
import { useTheme } from "@/hooks/useTheme";
import { getSupabaseClient } from "@/utils/supabase/client";
import { generateReportPdf } from "@/utils/generateReportPdf";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "short",
  timeStyle: "short",
});

type PatientOption = {
  id: string;
  name: string;
};

export default function ReportScreen() {
  const { user } = useAuth();
  const { profileType } = useUserProfile();
  const { isDark } = useTheme();
  const {
    report,
    noteCount,
    patientName,
    noteTitles,
    isLoading,
    error,
    generate,
    lastGeneratedAt,
  } = useReportGeneration();

  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 14);
    return today;
  });
  const [endDate, setEndDate] = useState(() => new Date());
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(
    null,
  );
  const [showPatientModal, setShowPatientModal] = useState(false);

  useEffect(() => {
    if (!user?.id || profileType !== "aider") {
      setPatients([]);
      setSelectedPatientId(user?.id ?? null);
      return;
    }

    const loadPatients = async () => {
      const supabase = getSupabaseClient();

      const { data: patientUsers } = await supabase.rpc(
        "get_patients_for_aider",
        { p_aider_id: user.id },
      );

      const mapped = (patientUsers ?? []).map(
        (patient: {
          id: string;
          name: string | null;
          email: string | null;
        }) => ({
          id: patient.id,
          name: patient.name?.trim() || patient.email || "Paciente",
        }),
      );

      setPatients(mapped);
      setSelectedPatientId(mapped[0]?.id ?? null);
    };

    void loadPatients();
  }, [profileType, user?.id]);

  const displayPatientName = useMemo(() => {
    if (profileType === "aider") {
      return (
        patients.find((patient) => patient.id === selectedPatientId)?.name ??
        "Paciente"
      );
    }

    return patientName || user?.user_metadata?.name || "Paciente";
  }, [
    patientName,
    patients,
    profileType,
    selectedPatientId,
    user?.user_metadata?.name,
  ]);

  const markdownStyles = useMemo(
    () => ({
      body: {
        color: isDark ? "#FFFFFF" : "#0F172A",
        fontSize: 15,
        lineHeight: 22,
      },
      heading1: { color: isDark ? "#FFFFFF" : "#0F172A" },
      heading2: {
        color: isDark ? "#FFFFFF" : "#0F172A",
        marginTop: 18,
        marginBottom: 8,
      },
      bullet_list: { marginBottom: 12 },
      list_item: { marginBottom: 6 },
      paragraph: { marginBottom: 10 },
    }),
    [isDark],
  );

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    if (activePicker === "start") {
      setStartDate(selectedDate);
      return;
    }

    if (activePicker === "end") {
      setEndDate(selectedDate);
    }
  };

  const startDateIso = startDate.toISOString().slice(0, 10);
  const endDateIso = endDate.toISOString().slice(0, 10);
  const canGenerate =
    profileType !== "aider" ? Boolean(user?.id) : Boolean(selectedPatientId);

  const downloadPdf = async () => {
    if (!report) return;
    setIsPdfLoading(true);
    try {
      await generateReportPdf({
        patientName: displayPatientName,
        generationDate: lastGeneratedAt
          ? dateTimeFormatter.format(new Date(lastGeneratedAt))
          : dateFormatter.format(new Date()),
        intervalStart: dateFormatter.format(startDate),
        intervalEnd: dateFormatter.format(endDate),
        reportMarkdown: report,
        noteTitles,
      });
    } catch (e) {
      console.error("[PDF] generation error:", e);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <LightBackground>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-6">
            <View className="items-center mb-4">
              <Image
                source={require("../assets/icon/icon.png")}
                style={{ width: 72, height: 72, resizeMode: "contain" }}
              />
              <Text
                className={`mt-3 text-2xl font-safiro ${isDark ? "text-white" : "text-slate-950"}`}
              >
                {displayPatientName}
              </Text>
              <Text
                className={`mt-1 text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}
              >
                {dateFormatter.format(startDate)} —{" "}
                {dateFormatter.format(endDate)}
              </Text>
            </View>

            <View
              className={`rounded-[28px] p-5 mb-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
            >
              <Text
                className={`text-xs uppercase tracking-[0.4px] mb-3 ${isDark ? "text-white/50" : "text-slate-500"}`}
              >
                Intervalo de análise
              </Text>

              {profileType === "aider" && patients.length > 1 && (
                <View className="mb-4">
                  <Text
                    className={`text-xs uppercase tracking-[0.4px] mb-2 ${isDark ? "text-white/50" : "text-slate-500"}`}
                  >
                    Selecionar paciente
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPatientModal(true)}
                    activeOpacity={0.7}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                      isDark
                        ? "border-white/10 bg-white/5"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-950"}`}
                    >
                      {patients.find((p) => p.id === selectedPatientId)?.name ??
                        "Selecionar paciente"}
                    </Text>
                    <Text
                      className={isDark ? "text-white/50" : "text-slate-400"}
                    >
                      ▾
                    </Text>
                  </TouchableOpacity>
                  <CuidadoModal
                    visible={showPatientModal}
                    onClose={() => setShowPatientModal(false)}
                    cuidados={patients}
                    onSelect={(patient) => {
                      setSelectedPatientId(patient.id);
                      setShowPatientModal(false);
                    }}
                  />
                </View>
              )}

              {profileType === "aider" && patients.length === 0 ? (
                <View
                  className={`rounded-2xl border p-4 mb-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}
                >
                  <Text className={isDark ? "text-white" : "text-slate-950"}>
                    Ainda não tem pacientes associados. Associe um paciente para
                    gerar relatórios.
                  </Text>
                </View>
              ) : (
                <>
                  <View className="flex-row gap-3 mb-4">
                    <Pressable
                      onPress={() => setActivePicker("start")}
                      className={`flex-1 rounded-2xl border px-4 py-3 ${
                        isDark
                          ? "border-white/10 bg-white/5"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <Text
                        className={`text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}
                      >
                        Data inicial
                      </Text>
                      <Text
                        className={`mt-1 font-semibold ${isDark ? "text-white" : "text-slate-950"}`}
                      >
                        {dateFormatter.format(startDate)}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setActivePicker("end")}
                      className={`flex-1 rounded-2xl border px-4 py-3 ${
                        isDark
                          ? "border-white/10 bg-white/5"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <Text
                        className={`text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}
                      >
                        Data final
                      </Text>
                      <Text
                        className={`mt-1 font-semibold ${isDark ? "text-white" : "text-slate-950"}`}
                      >
                        {dateFormatter.format(endDate)}
                      </Text>
                    </Pressable>
                  </View>

                  <Button
                    variant="primary"
                    label="Gerar Relatório"
                    onPress={() => {
                      const patientId =
                        profileType === "aider" ? selectedPatientId : user?.id;
                      if (!patientId) return;
                      void generate(patientId, startDateIso, endDateIso);
                    }}
                    loading={isLoading}
                    disabled={!canGenerate}
                  />
                </>
              )}

              <View className="mt-4 flex-row justify-between">
                <Text
                  className={`${isDark ? "text-white/70" : "text-slate-600"}`}
                >
                  Notas analisadas
                </Text>
                <Text
                  className={`${isDark ? "text-white" : "text-slate-950"} font-bold`}
                >
                  {noteCount}
                </Text>
              </View>
            </View>

            {isLoading && (
              <View className="items-center py-8">
                <ActivityIndicator color={isDark ? "#FFFFFF" : "#5061FF"} />
              </View>
            )}

            {error && (
              <View
                className={`rounded-[24px] p-4 mb-4 ${isDark ? "bg-red-500/10" : "bg-red-50"}`}
              >
                <Text className={isDark ? "text-red-200" : "text-red-700"}>
                  {error}
                </Text>
              </View>
            )}

            {!!report && (
              <View
                className={`rounded-[28px] p-5 mb-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
              >
                <Markdown style={markdownStyles as any}>{report}</Markdown>
              </View>
            )}

            {!!noteTitles.length && (
              <View
                className={`rounded-[28px] p-5 mb-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
              >
                <Text
                  className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-slate-950"}`}
                >
                  Notas Analisadas
                </Text>
                {noteTitles.map((item) => (
                  <View key={`${item.date}-${item.title}`} className="mb-3">
                    <Text
                      className={
                        isDark
                          ? "text-white font-semibold"
                          : "text-slate-950 font-semibold"
                      }
                    >
                      {item.date}
                    </Text>
                    <Text
                      className={isDark ? "text-white/70" : "text-slate-600"}
                    >
                      {item.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {!!report && (
              <View className="mt-2 mb-4">
                <Button
                  variant="primary"
                  label={isPdfLoading ? "A gerar PDF…" : "Exportar PDF"}
                  onPress={() => void downloadPdf()}
                  loading={isPdfLoading}
                  disabled={isPdfLoading}
                />
              </View>
            )}

            {lastGeneratedAt && (
              <Text
                className={`text-center text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}
              >
                Última geração:{" "}
                {dateTimeFormatter.format(new Date(lastGeneratedAt))}
              </Text>
            )}
          </View>
        </ScrollView>

        {activePicker && (
          <DateTimePicker
            value={activePicker === "start" ? startDate : endDate}
            mode="date"
            display="default"
            onChange={handlePickerChange}
          />
        )}
      </SafeAreaView>
    </LightBackground>
  );
}
