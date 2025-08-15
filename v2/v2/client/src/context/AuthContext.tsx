import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo purposes, auto-authenticate as admin
    const demoUser: User = {
      id: 1,
      username: "admin",
      password: "",
      name: "Анна Смирнова",
      email: "admin@asisto.ru",
      role: "administrator",
    };
    setUser(demoUser);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // In a real app, you would call an API to authenticate
      // For now, we'll use the demo user
      if (username === "admin" && password === "password") {
        const demoUser: User = {
          id: 1,
          username: "admin",
          password: "",
          name: "Анна Смирнова",
          email: "admin@asisto.ru",
          role: "administrator",
        };
        setUser(demoUser);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
