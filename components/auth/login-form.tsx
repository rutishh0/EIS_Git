"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="username" className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
          Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="w-full bg-[#0c0d0f] border border-border/50 rounded-lg px-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#00d4aa]/50 focus:ring-1 focus:ring-[#00d4aa]/20 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full bg-[#0c0d0f] border border-border/50 rounded-lg px-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#00d4aa]/50 focus:ring-1 focus:ring-[#00d4aa]/20 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/20">
          <AlertCircle className="w-4 h-4 text-[#ff4757] shrink-0" />
          <p className="text-sm text-[#ff4757]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200",
          "bg-[#00d4aa] text-[#08090a] hover:bg-[#00e4b8] hover:shadow-[0_0_20px_rgba(0,212,170,0.3)]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
          "flex items-center justify-center gap-2"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
