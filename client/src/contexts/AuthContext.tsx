import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export type AuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetch: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
      window.location.href = "/login";
    },
  });

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const user = data
    ? ({
        id: (data as AuthUser).id,
        name: (data as AuthUser).name,
        email: (data as AuthUser).email,
        role: (data as AuthUser).role,
      } as AuthUser)
    : null;

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, refetch, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AuthContext);
}
