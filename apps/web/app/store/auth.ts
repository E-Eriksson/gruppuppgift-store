import { useState } from "react";
import { API_URL } from "../../../../packages/api/src/fetchProducts";

export function useAuth() {
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    }
    return null;
  });
  const [jwt, setJwt] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jwt");
    }
    return null;
  });

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password }),
    });
    const data = await res.json();
    if (data.jwt && data.user) {
      setJwt(data.jwt);
      setUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem("jwt", data.jwt);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } else {
      throw new Error(data.error?.message || "Login failed");
    }
  }

  async function register(username: string, email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (data.jwt && data.user) {
      setJwt(data.jwt);
      setUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem("jwt", data.jwt);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } else {
      throw new Error(data.error?.message || "Registration failed");
    }
  }

  function logout() {
    setJwt(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt");
      localStorage.removeItem("user");
    }
  }

  return { user, jwt, login, register, logout };
}