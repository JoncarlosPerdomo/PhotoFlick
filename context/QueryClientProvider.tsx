import React from "react";
import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Platform } from "react-native";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously called cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface QueryClientProviderProps {
  children: React.ReactNode;
}

export const QueryClientProvider: React.FC<QueryClientProviderProps> = ({
  children,
}) => {
  // Only show devtools on web in development
  const showDevTools =
    process.env.NODE_ENV === "development" && Platform.OS === "web";

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {showDevTools && <ReactQueryDevtools initialIsOpen={false} />}
    </TanstackQueryClientProvider>
  );
};
