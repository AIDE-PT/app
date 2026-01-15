import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditableDashboard from "@/components/dashboard/EditableDashboard";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export default function TestScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <EditableDashboard />
    </QueryClientProvider>
  );
}
