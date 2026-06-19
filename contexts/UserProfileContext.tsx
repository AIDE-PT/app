import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseClient } from "@/utils/supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

type ProfileType = "aider" | "cuidado" | null;

interface UserProfileContextType {
  profileType: ProfileType;
  setProfileType: (type: ProfileType) => Promise<void>;
}

const PROFILE_STORAGE_KEY = "@aide_profile_type";
const getProfileStorageKey = (userId: string) =>
  `${PROFILE_STORAGE_KEY}:${userId}`;

const isProfileType = (value: unknown): value is Exclude<ProfileType, null> =>
  value === "aider" || value === "cuidado";

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined,
);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const [profileType, setProfileTypeState] = useState<ProfileType>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveUserTypeId = async (type: Exclude<ProfileType, null>) => {
    const { data, error } = await getSupabaseClient()
      .from("user_types")
      .select("id")
      .ilike("designation", type)
      .maybeSingle();

    if (error || !data?.id) {
      throw new Error("Nao foi possivel resolver o tipo de utilizador.");
    }

    return data.id;
  };

  const persistProfileTypeInBackend = async (
    type: Exclude<ProfileType, null>,
  ) => {
    if (!user?.id || !user.email) {
      throw new Error("Sessao invalida para guardar tipo de perfil.");
    }

    const userTypeId = await resolveUserTypeId(type);

    // RLS often permits UPDATE on own row but blocks INSERT, so update first.
    const { data: updatedRows, error: updateError } = await getSupabaseClient()
      .from("users")
      .update({ user_type_id: userTypeId })
      .eq("id", user.id)
      .select("id")
      .limit(1);

    if (updateError) {
      throw new Error(
        `Nao foi possivel atualizar o tipo de perfil no backend: ${updateError.message}`,
      );
    }

    if (updatedRows && updatedRows.length > 0) {
      return;
    }

    // If no row exists yet, try to create it. If policy blocks INSERT, caller may
    // continue with local cache and retry sync in a future session.
    const { error: insertError } = await getSupabaseClient().from("users").insert({
      id: user.id,
      email: user.email,
      name:
        typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null,
      user_type_id: userTypeId,
    });

    if (insertError) {
      throw new Error(
        `Nao foi possivel guardar o tipo de perfil no backend: ${insertError.message}`,
      );
    }
  };

  const fetchProfileTypeFromBackend = async (): Promise<ProfileType> => {
    if (!user?.id) return null;

    const { data: userRow, error: userError } = await getSupabaseClient()
      .from("users")
      .select("user_type_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userError || !userRow?.user_type_id) {
      return null;
    }

    const { data: userType, error: userTypeError } = await getSupabaseClient()
      .from("user_types")
      .select("designation")
      .eq("id", userRow.user_type_id)
      .maybeSingle();

    if (userTypeError) {
      return null;
    }

    const designation = String(userType?.designation || "")
      .trim()
      .toLowerCase();

    return isProfileType(designation) ? designation : null;
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;

      setIsLoading(true);

      if (!user?.id) {
        setProfileTypeState(null);
        setIsLoading(false);
        return;
      }

      try {
        const scopedKey = getProfileStorageKey(user.id);
        const saved = await AsyncStorage.getItem(scopedKey);
        const savedProfile = isProfileType(saved) ? saved : null;

        // Backward compatibility for old global key on first load after update.
        let legacyProfile: ProfileType = null;
        if (!savedProfile) {
          const legacy = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
          if (isProfileType(legacy)) {
            legacyProfile = legacy;
          }
        }

        const backendProfile = await fetchProfileTypeFromBackend();
        const resolvedProfile = backendProfile ?? savedProfile ?? legacyProfile;

        if (isProfileType(resolvedProfile)) {
          setProfileTypeState(resolvedProfile);
          await AsyncStorage.setItem(scopedKey, resolvedProfile);

          // If backend is still empty, backfill from resolved local profile.
          if (!backendProfile) {
            try {
              await persistProfileTypeInBackend(resolvedProfile);
            } catch (error) {
              console.warn(
                "Profile type backend sync skipped during load:",
                error,
              );
            }
          }
        } else {
          setProfileTypeState(null);
          await AsyncStorage.removeItem(scopedKey);
        }
      } catch (error) {
        console.error("Error loading profile type:", error);
        setProfileTypeState(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [authLoading, user?.id]);

  const setProfileType = async (type: ProfileType) => {
    if (!user?.id) {
      setProfileTypeState(null);
      return;
    }

    const scopedKey = getProfileStorageKey(user.id);
    const previousType = profileType;
    setProfileTypeState(type);

    try {
      if (type) {
        await AsyncStorage.setItem(scopedKey, type);

        try {
          await persistProfileTypeInBackend(type);
        } catch (error) {
          console.warn("Error syncing profile type with backend:", error);
        }
      } else {
        await AsyncStorage.removeItem(scopedKey);
      }
    } catch (error) {
      console.error("Error saving profile type:", error);
      setProfileTypeState(previousType);
      if (previousType) {
        await AsyncStorage.setItem(scopedKey, previousType);
      } else {
        await AsyncStorage.removeItem(scopedKey);
      }
      throw error;
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <ActivityIndicator size="large" color="#5061FF" />
      </View>
    );
  }

  return (
    <UserProfileContext.Provider value={{ profileType, setProfileType }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

export default UserProfileContext;
