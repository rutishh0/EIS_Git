import { LoginForm } from "@/components/auth/login-form"
import { Plane, Shield } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#2ed573] flex items-center justify-center">
              <Plane className="w-8 h-8 text-[#08090a]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2ed573] border-2 border-[#08090a] flex items-center justify-center">
              <Shield className="w-2.5 h-2.5 text-[#08090a]" />
            </div>
          </div>
          <span className="text-[10px] font-mono tracking-[0.4em] text-muted-foreground/60 uppercase mb-2">
            Rolls-Royce
          </span>
          <h1 className="text-2xl font-light tracking-tight">
            EIS <span className="text-gradient font-semibold">Command Center</span>
          </h1>
        </div>

        {/* Login card */}
        <div className="panel rounded-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
            <p className="text-xs text-muted-foreground">
              Sign in to access the EIS Command Center
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 pt-4 border-t border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground/40">
              Authorized personnel only. Contact your administrator for access.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-border/30" />
          <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-[0.3em]">
            Civil Aerospace Division
          </p>
          <div className="h-px w-12 bg-border/30" />
        </div>
      </div>
    </div>
  )
}
