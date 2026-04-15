import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

const getCurrentPath = (pathname: string) => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  return `${pathname}${search}`;
};

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !session) {
      const currentPath = getCurrentPath(pathname);
      router.replace(`/login?next=${encodeURIComponent(currentPath)}` as any);
    }
  }, [isLoading, session, router, pathname]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{session ? children : null}</>;
}
