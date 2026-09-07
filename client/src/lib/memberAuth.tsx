import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Member } from "@shared/schema";
import { apiRequest } from "./queryClient";

type MemberInfo = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  subscriptionStatus: string;
  subscriptionEndDate?: Date | null;
  adminApproved?: boolean;
  createdAt?: Date | null;
};

interface MemberAuthContextType {
  member: MemberInfo | null;
  isLoading: boolean;
  isSubscribed: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/members/me", { credentials: "include" });
      if (res.ok) {
        const memberData = await res.json();
        setMember(memberData);
      } else {
        setMember(null);
      }
    } catch {
      setMember(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/members/login", { email, password });
    const memberData = await res.json();
    setMember(memberData);
  };

  const signup = async (name: string, email: string, password: string, phone?: string) => {
    const res = await apiRequest("POST", "/api/members/signup", { name, email, password, phone });
    const memberData = await res.json();
    setMember(memberData);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/members/logout");
    setMember(null);
  };

  // Member must have active subscription AND be admin approved
  const isSubscribed = member?.subscriptionStatus === "active" && member?.adminApproved !== false;

  return (
    <MemberAuthContext.Provider value={{ member, isLoading, isSubscribed, login, signup, logout, checkAuth }}>
      {children}
    </MemberAuthContext.Provider>
  );
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error("useMemberAuth must be used within a MemberAuthProvider");
  }
  return context;
}
