import LightBackground from "@/components/DotBackground";
import BackButton from "@/components/buttons/backButton";
import { Button } from "@/components/buttons/button";
import { ChoseCuidado } from "@/components/buttons/choseCuidado";
import {
  getSurfaceStyle,
  surfaceRadius,
  surfaceSpacing,
} from "@/components/surface/surfaceStyles";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import useReportGeneration from "@/hooks/useReportGeneration";
import { useTheme } from "@/hooks/useTheme";
import { generateReportPdf } from "@/utils/generateReportPdf";
import { getSupabaseClient } from "@/utils/supabase/client";
import { Feather } from "@expo/vector-icons";
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
        lineHeight: 23,
      },
      heading1: {
        color: isDark ? "#FFFFFF" : "#0F172A",
        fontSize: 22,
        marginBottom: 10,
      },
      heading2: {
        color: isDark ? "#FFFFFF" : "#0F172A",
        fontSize: 18,
        marginTop: 18,
        marginBottom: 8,
      },
      bullet_list: { marginBottom: 12 },
      list_item: { marginBottom: 6 },
      paragraph: { marginBottom: 10 },
      strong: { color: isDark ? "#FFFFFF" : "#0F172A" },
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

  const neutralBorderColor = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(226, 232, 240, 0.92)";
  const cardStyle = getSurfaceStyle("elevated", isDark, {
    borderColor: neutralBorderColor,
    borderRadius: surfaceRadius.lg,
  });
  const fieldStyle = getSurfaceStyle("base", isDark, {
    borderColor: neutralBorderColor,
    borderRadius: surfaceRadius.md,
  });
  const textMain = isDark ? "text-white" : "text-slate-950";
  const textMuted = isDark ? "text-white/65" : "text-slate-600";
  const iconColor = isDark ? "#E5E7EB" : "#475569";
  const errorStyle = {
    backgroundColor: isDark ? "rgba(127, 29, 29, 0.22)" : "#FEF2F2",
    borderColor: isDark ? "rgba(252, 165, 165, 0.3)" : "#FECACA",
    borderRadius: surfaceRadius.md,
    borderWidth: 1,
  };

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
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton label="Relatorio" dark={isDark} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View
              style={[
                cardStyle,
                {
                  marginBottom: surfaceSpacing.md,
                  padding: surfaceSpacing.md,
                },
              ]}
            >
              <View className="flex-row items-center">
                <View
                  style={[
                    fieldStyle,
                    {
                      alignItems: "center",
                      height: 56,
                      justifyContent: "center",
                      marginRight: surfaceSpacing.sm,
                      width: 56,
                    },
                  ]}
                >
                  <Image
                    source={require("../assets/icon/icon.png")}
                    style={{ height: 36, resizeMode: "contain", width: 36 }}
                  />
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-xs font-bold uppercase ${textMuted}`}
                    numberOfLines={1}
                  >
                    Resumo clinico
                  </Text>
                  <Text
                    className={`mt-1 text-2xl font-safiro ${textMain}`}
                    numberOfLines={2}
                  >
                    {displayPatientName}
                  </Text>
                </View>
              </View>

              <View
                className="flex-row items-center"
                style={[
                  fieldStyle,
                  {
                    marginTop: surfaceSpacing.md,
                    paddingHorizontal: surfaceSpacing.md,
                    paddingVertical: surfaceSpacing.sm,
                  },
                ]}
              >
                <Feather name="calendar" size={17} color={iconColor} />
                <Text
                  className={`ml-2 flex-1 text-sm font-semibold ${textMain}`}
                  numberOfLines={1}
                >
                  {dateFormatter.format(startDate)} -{" "}
                  {dateFormatter.format(endDate)}
                </Text>
              </View>
            </View>

            <View
              style={[
                cardStyle,
                {
                  marginBottom: surfaceSpacing.md,
                  padding: surfaceSpacing.md,
                },
              ]}
            >
              <View
                className="flex-row items-start justify-between"
                style={{ marginBottom: surfaceSpacing.md }}
              >
                <View className="flex-1 pr-3">
                  <Text className={`text-xl font-bold ${textMain}`}>
                    Configuracao
                  </Text>
                  <Text className={`mt-1 text-sm leading-5 ${textMuted}`}>
                    Escolha o intervalo usado para analisar as notas.
                  </Text>
                </View>

                <View
                  className="flex-row items-center"
                  style={[
                    fieldStyle,
                    {
                      paddingHorizontal: surfaceSpacing.sm,
                      paddingVertical: surfaceSpacing.xs,
                    },
                  ]}
                >
                  <Feather name="file-text" size={14} color={iconColor} />
                  <Text className={`ml-1 text-xs font-bold ${textMain}`}>
                    {noteCount}
                  </Text>
                </View>
              </View>

              {profileType === "aider" && patients.length > 1 && (
                <View style={{ marginBottom: surfaceSpacing.md }}>
                  <Text
                    className={`mb-2 text-xs font-bold uppercase ${textMuted}`}
                  >
                    Selecionar paciente
                  </Text>
                  <ChoseCuidado
                    cuidados={patients}
                    selectedCuidado={
                      patients.find(
                        (patient) => patient.id === selectedPatientId,
                      ) ?? undefined
                    }
                    onSelect={(patient) => setSelectedPatientId(patient.id)}
                  />
                </View>
              )}

              {profileType === "aider" && patients.length === 0 ? (
                <View
                  style={[
                    fieldStyle,
                    {
                      padding: surfaceSpacing.md,
                    },
                  ]}
                >
                  <Text className={`text-sm leading-5 ${textMain}`}>
                    Ainda nao tem pacientes associados. Associe um paciente para
                    gerar relatorios.
                  </Text>
                </View>
              ) : (
                <>
                  <View className="flex-row" style={{ gap: surfaceSpacing.sm }}>
                    <Pressable
                      onPress={() => setActivePicker("start")}
                      className="flex-1"
                      style={[
                        fieldStyle,
                        {
                          paddingHorizontal: surfaceSpacing.md,
                          paddingVertical: surfaceSpacing.sm,
                        },
                      ]}
                    >
                      <View className="mb-1 flex-row items-center">
                        <Feather
                          name="arrow-right"
                          size={13}
                          color={iconColor}
                        />
                        <Text className={`ml-1 text-xs ${textMuted}`}>
                          Inicio
                        </Text>
                      </View>
                      <Text
                        className={`text-base font-bold ${textMain}`}
                        numberOfLines={1}
                      >
                        {dateFormatter.format(startDate)}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setActivePicker("end")}
                      className="flex-1"
                      style={[
                        fieldStyle,
                        {
                          paddingHorizontal: surfaceSpacing.md,
                          paddingVertical: surfaceSpacing.sm,
                        },
                      ]}
                    >
                      <View className="mb-1 flex-row items-center">
                        <Feather name="flag" size={13} color={iconColor} />
                        <Text className={`ml-1 text-xs ${textMuted}`}>Fim</Text>
                      </View>
                      <Text
                        className={`text-base font-bold ${textMain}`}
                        numberOfLines={1}
                      >
                        {dateFormatter.format(endDate)}
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    className="items-center"
                    style={{ marginTop: surfaceSpacing.md }}
                  >
                    <Button
                      variant="primary"
                      label="Gerar Relatorio"
                      onPress={() => {
                        const patientId =
                          profileType === "aider"
                            ? selectedPatientId
                            : user?.id;
                        if (!patientId) return;
                        void generate(patientId, startDateIso, endDateIso);
                      }}
                      loading={isLoading}
                      disabled={!canGenerate}
                    />
                  </View>
                </>
              )}
            </View>

            {isLoading && (
              <View
                className="items-center justify-center"
                style={[
                  cardStyle,
                  {
                    marginBottom: surfaceSpacing.md,
                    padding: surfaceSpacing.md,
                  },
                ]}
              >
                <ActivityIndicator color={iconColor} />
                <Text className={`mt-3 text-sm ${textMuted}`}>
                  A gerar relatorio...
                </Text>
              </View>
            )}

            {error && (
              <View
                style={[
                  errorStyle,
                  {
                    marginBottom: surfaceSpacing.md,
                    padding: surfaceSpacing.md,
                  },
                ]}
              >
                <View className="flex-row items-start">
                  <Feather
                    name="alert-circle"
                    size={18}
                    color={isDark ? "#FCA5A5" : "#B91C1C"}
                  />
                  <Text
                    className={`ml-2 flex-1 text-sm leading-5 ${isDark ? "text-red-100" : "text-red-700"}`}
                  >
                    {error}
                  </Text>
                </View>
              </View>
            )}

            {!!report && (
              <View
                style={[
                  cardStyle,
                  {
                    marginBottom: surfaceSpacing.md,
                    padding: surfaceSpacing.md,
                  },
                ]}
              >
                <View className="mb-3 flex-row items-center">
                  <Feather name="clipboard" size={18} color={iconColor} />
                  <Text className={`ml-2 text-lg font-bold ${textMain}`}>
                    Relatorio gerado
                  </Text>
                </View>
                <Markdown style={markdownStyles as any}>{report}</Markdown>
              </View>
            )}

            {!!noteTitles.length && (
              <View
                style={[
                  cardStyle,
                  {
                    marginBottom: surfaceSpacing.md,
                    padding: surfaceSpacing.md,
                  },
                ]}
              >
                <Text className={`mb-3 text-lg font-bold ${textMain}`}>
                  Notas analisadas
                </Text>
                {noteTitles.map((item) => (
                  <View
                    key={`${item.date}-${item.title}`}
                    style={[
                      fieldStyle,
                      {
                        marginBottom: surfaceSpacing.sm,
                        padding: surfaceSpacing.md,
                      },
                    ]}
                  >
                    <Text className={`text-sm font-bold ${textMain}`}>
                      {item.date}
                    </Text>
                    <Text
                      className={`mt-1 text-sm leading-5 ${textMuted}`}
                      numberOfLines={3}
                    >
                      {item.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {!!report && (
              <View
                className="items-center"
                style={{ marginBottom: surfaceSpacing.md }}
              >
                <Button
                  variant="primary"
                  label={isPdfLoading ? "A gerar PDF..." : "Exportar PDF"}
                  onPress={() => void downloadPdf()}
                  loading={isPdfLoading}
                  disabled={isPdfLoading}
                />
              </View>
            )}

            {lastGeneratedAt && (
              <Text className={`text-center text-xs ${textMuted}`}>
                Ultima geracao:{" "}
                {dateTimeFormatter.format(new Date(lastGeneratedAt))}
              </Text>
            )}
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
      </View>
    </LightBackground>
  );
}
