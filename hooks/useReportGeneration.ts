import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabaseClient } from "@/utils/supabase/client";
import { useCallback, useMemo, useState } from "react";

type NoteTitle = {
  date: string;
  title: string;
};

type ReportResponse = {
  report: string;
  noteCount: number;
  patientName: string;
  noteTitles: NoteTitle[];
  startDate: string;
  endDate: string;
};

type UseReportGenerationResult = {
  report: string;
  noteCount: number;
  patientName: string;
  noteTitles: NoteTitle[];
  startDate: string;
  endDate: string;
  isLoading: boolean;
  error: string | null;
  generate: (
    patientId: string,
    startDate: string,
    endDate: string,
  ) => Promise<void>;
  lastGeneratedAt: string | null;
};

type StoredReport = {
  timestamp: string;
  noteCount: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getLastReportKey = (patientId: string) => `last_report_${patientId}`;

export default function useReportGeneration(): UseReportGenerationResult {
  const [report, setReport] = useState("");
  const [noteCount, setNoteCount] = useState(0);
  const [patientName, setPatientName] = useState("");
  const [noteTitles, setNoteTitles] = useState<NoteTitle[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (patientId: string, nextStartDate: string, nextEndDate: string) => {
      const supabase = getSupabaseClient();
      const lastReportKey = getLastReportKey(patientId);
      const stored = await AsyncStorage.getItem(lastReportKey);

      // Cooldown disabled for testing
      void stored;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: invokeError } =
          await supabase.functions.invoke<ReportResponse>("generate-report", {
            body: {
              patientId,
              startDate: nextStartDate,
              endDate: nextEndDate,
            },
          });

        if (invokeError) {
          throw invokeError;
        }

        if (!data) {
          throw new Error("A resposta do relatório está vazia.");
        }

        console.log(
          "[Report] noteCount:",
          data.noteCount,
          "startDate:",
          nextStartDate,
          "endDate:",
          nextEndDate,
        );

        setReport(data.report);
        setNoteCount(data.noteCount);
        setPatientName(data.patientName);
        setNoteTitles(data.noteTitles ?? []);
        setStartDate(data.startDate);
        setEndDate(data.endDate);

        const nowIso = new Date().toISOString();
        setLastGeneratedAt(nowIso);
        await AsyncStorage.setItem(
          lastReportKey,
          JSON.stringify({ timestamp: nowIso, noteCount: data.noteCount }),
        );
      } catch (generationError) {
        console.error("[Report] generation error:", generationError);
        // Extract HTTP status + body from FunctionsHttpError for easier diagnosis
        const ctx = (generationError as Record<string, unknown>)?.context as
          | Response
          | undefined;
        if (ctx) {
          ctx
            .text()
            .then((body) =>
              console.error(
                "[Report] error status:",
                ctx.status,
                "body:",
                body,
              ),
            )
            .catch(() => {});
        }
        const message =
          generationError instanceof Error
            ? generationError.message
            : "Não foi possível gerar o relatório.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const state = useMemo(
    () => ({
      report,
      noteCount,
      patientName,
      noteTitles,
      startDate,
      endDate,
      isLoading,
      error,
      generate,
      lastGeneratedAt,
    }),
    [
      report,
      noteCount,
      patientName,
      noteTitles,
      startDate,
      endDate,
      isLoading,
      error,
      generate,
      lastGeneratedAt,
    ],
  );

  return state;
}
