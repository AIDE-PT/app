import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, hasSupabaseConfig } from "@/utils/supabase/client";

const DEFAULT_AUTH_REDIRECT = "/testDashboard";

const ONBOARDING_ROUTES = [
  "/terms-of-service",
  "/perfil",
  "/extraData",
  "/associar",
];

const stripQueryString = (path: string) => path.split("?")[0];

export const isOnboardingRoute = (path: string) =>
  ONBOARDING_ROUTES.includes(stripQueryString(path));

const normalizeDesignation = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const hasCuidadoExtraData = (row: Record<string, unknown> | null) => {
  if (!row) return false;

  return (
    typeof row.age === "number" &&
    Number.isFinite(row.age) &&
    typeof row.weight === "number" &&
    Number.isFinite(row.weight) &&
    typeof row.height === "number" &&
    Number.isFinite(row.height) &&
    typeof row.gender === "string" &&
    row.gender.trim().length > 0
  );
};

export const getRequiredOnboardingRoute = async (
  session: Session | null,
): Promise<string | null> => {
  if (!session?.user?.id || !hasSupabaseConfig) return null;

  const supabase = getSupabaseClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("user_type_id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (userError) {
    console.warn("Nao foi possivel avaliar onboarding:", userError.message);
    return null;
  }

  if (!userRow?.user_type_id) {
    return "/terms-of-service?fromStart=true";
  }

  const { data: userType, error: userTypeError } = await supabase
    .from("user_types")
    .select("designation")
    .eq("id", userRow.user_type_id)
    .maybeSingle();

  if (userTypeError) {
    console.warn(
      "Nao foi possivel avaliar tipo de utilizador:",
      userTypeError.message,
    );
    return null;
  }

  const designation = normalizeDesignation(userType?.designation);
  if (designation !== "cuidado") return null;

  const { data: cuidadoRow, error: cuidadoError } = await supabase
    .from("users")
    .select("age, weight, height, gender")
    .eq("id", session.user.id)
    .maybeSingle();

  if (cuidadoError) {
    console.warn(
      "Nao foi possivel avaliar dados adicionais:",
      cuidadoError.message,
    );
    return "/extraData";
  }

  return hasCuidadoExtraData(cuidadoRow as Record<string, unknown> | null)
    ? null
    : "/extraData";
};

export const resolveAuthenticatedEntryRoute = async (
  session: Session | null,
  requestedRoute = DEFAULT_AUTH_REDIRECT,
) => {
  if (isOnboardingRoute(requestedRoute)) return requestedRoute;

  const requiredRoute = await getRequiredOnboardingRoute(session);
  return requiredRoute ?? requestedRoute;
};
