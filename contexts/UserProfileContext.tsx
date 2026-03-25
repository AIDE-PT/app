import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type ProfileType = "aider" | "cuidado" | null;

interface UserProfileContextType {
  profileType: ProfileType;
  setProfileType: (type: ProfileType) => void;
}

const PROFILE_STORAGE_KEY = "@aide_profile_type";

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileType, setProfileTypeState] = useState<ProfileType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved === "aider" || saved === "cuidado") {
          setProfileTypeState(saved);
        }
      } catch (error) {
        console.error("Error loading profile type:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const setProfileType = async (type: ProfileType) => {
    try {
      if (type) {
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, type);
      } else {
        await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      }
      setProfileTypeState(type);
    } catch (error) {
      console.error("Error saving profile type:", error);
    }
  };

  if (isLoading) {
    return null;
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
