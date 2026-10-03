"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, User, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// ============ INNER COMPONENT (uses useSearchParams) ============
function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/pos";

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(decodeURIComponent(redirectTo));
    }
  }, [user, isLoading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 400));

    const success = login(username.trim(), password);
    if (success) {
      toast.success("Welcome back!");
      router.replace(decodeURIComponent(redirectTo));
    } else {
      toast.error("Invalid username or password");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.jpeg" alt="Concept Autos" width={56} height={56} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mb-1">Concept Autos</h1>
          <p className="text-sm text-zinc-500">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-zinc-900 placeholder-zinc-400 font-digit"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-zinc-900 placeholder-zinc-400 font-digit"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-zinc-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </button>
        </form>

        {/* <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            {showHint ? "Hide hint" : "Show login hint"}
          </button>
          {showHint && (
            <p className="text-xs text-zinc-500 mt-2 bg-zinc-50 border border-zinc-200 rounded-lg p-3 font-digit">
              Default admin: <span className="font-bold">admin</span> /{" "}
              <span className="font-bold">admin123</span>
              <br />
              <span className="text-[10px] text-zinc-400">
                (Set via NEXT_PUBLIC_ADMIN_USERNAME / PASSWORD in .env)
              </span>
            </p>
          )}
        </div> */}
      </div>
    </div>
  );
}

// ============ PAGE (wraps in Suspense) ============
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-zinc-500 text-sm">Loading...</div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}