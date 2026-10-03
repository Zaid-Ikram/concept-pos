"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  username: string;
  name: string;
  role: "admin" | "employee";
}

export interface Employee {
  username: string;
  password: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  employees: Employee[];
  addEmployee: (emp: Employee) => boolean;
  removeEmployee: (username: string) => void;
  changePassword: (username: string, oldPass: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "concept_autos_auth";
const EMPLOYEES_KEY = "concept_autos_employees";
const COOKIE_NAME = "concept_autos_session";

const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {}
    try {
      const savedEmp = localStorage.getItem(EMPLOYEES_KEY);
      if (savedEmp) setEmployees(JSON.parse(savedEmp));
    } catch {}
    setIsLoading(false);
  }, []);

  const setCookie = (value: string) => {
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=86400; SameSite=Lax`;
  };
  const clearCookie = () => {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  };

  const login = (username: string, password: string): boolean => {
    // Admin from .env
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const u: User = { username: ADMIN_USERNAME, name: "Administrator", role: "admin" };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setCookie("1");
      return true;
    }
    // Employee from localStorage
    const emp = employees.find(e => e.username === username && e.password === password);
    if (emp) {
      const u: User = { username: emp.username, name: emp.name, role: "employee" };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setCookie("1");
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    clearCookie();
  };

  const addEmployee = (emp: Employee): boolean => {
    if (emp.username === ADMIN_USERNAME) return false;
    if (employees.some(e => e.username === emp.username)) return false;
    const updated = [...employees, emp];
    setEmployees(updated);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
    return true;
  };

  const removeEmployee = (username: string) => {
    const updated = employees.filter(e => e.username !== username);
    setEmployees(updated);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
  };

  const changePassword = (username: string, oldPass: string, newPass: string): boolean => {
    const idx = employees.findIndex(e => e.username === username && e.password === oldPass);
    if (idx === -1) return false;
    const updated = [...employees];
    updated[idx] = { ...updated[idx], password: newPass };
    setEmployees(updated);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, employees, addEmployee, removeEmployee, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}