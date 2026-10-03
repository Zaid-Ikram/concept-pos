"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, User, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AutoLock() {
  const { user, login } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // ============ LOCK ============
  const lock = useCallback(() => {
    if (!user) return;
    setIsLocked(true);
    setUsername(user.username); // pre-fill username
    setPassword("");
    setError("");
  }, [user]);

  // ============ UNLOCK ============
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Enter username and password");
      return;
    }
    setIsUnlocking(true);
    setError("");

    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 400));

    const success = login(username.trim(), password);
    if (success) {
      setIsLocked(false);
      setPassword("");
      toast.success("Unlocked");
    } else {
      setError("Invalid username or password");
      setPassword("");
    }
    setIsUnlocking(false);
  };

  // ============ ACTIVITY LISTENERS ============
  useEffect(() => {
    if (!user) return; // Only when logged in

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!isLocked) {
        timeoutRef.current = setTimeout(lock, IDLE_TIMEOUT_MS);
      }
    };

    // Initial timer
    resetTimer();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

    // Manual lock event (from profile menu)
    const manualLock = () => lock();
    window.addEventListener("lock-session", manualLock);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
      window.removeEventListener("lock-session", manualLock);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, isLocked, lock]);

  // ============ AUTO-FOCUS + ESCAPE HANDLER ============
  useEffect(() => {
    if (!isLocked) return;

    // Prevent Escape key from closing
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKey, true);

    // Auto-focus password
    setTimeout(() => {
      document.getElementById("unlock-password")?.focus();
    }, 100);

    return () => window.removeEventListener("keydown", handleKey, true);
  }, [isLocked]);

  if (!isLocked || !user) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" />

      {/* Lock card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Session Locked</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Your session was idle for 15 minutes. Please re-enter your credentials.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="username"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="unlock-password"
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-zinc-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {isUnlocking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" /> Unlock
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-zinc-400 mt-4 font-digit">
          Signed in as @{user.username} · {user.role === "admin" ? "Administrator" : "Employee"}
        </p>
      </div>
    </div>
  );
}