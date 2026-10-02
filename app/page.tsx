"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    login(email || "admin@conceptpos.com");
    router.push("/pos");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-primary mb-2">Concept Autos</h1>
          <p className="text-sm text-zinc-500">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@conceptpos.com" className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all font-digit" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all font-digit" required />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}