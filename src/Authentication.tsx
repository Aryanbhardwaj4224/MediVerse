import React, { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import GlassLayout from "./components/GlassLayout";

export type AuthContextType = "patient-history" | "patient-transfer";

const validContexts: AuthContextType[] = ["patient-history", "patient-transfer"];

function isAuthContext(v: string | undefined): v is AuthContextType {
  return v !== undefined && validContexts.includes(v as AuthContextType);
}

type AuthenticationProps = {
  /** When used as a routed page, `context` is read from the URL. Optional override for tests or nested use. */
  contextOverride?: AuthContextType;
};

export default function Authentication({ contextOverride }: AuthenticationProps) {
  const { context: paramContext } = useParams<{ context: string }>();
  const context = contextOverride ?? paramContext;

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  if (!isAuthContext(context)) {
    return <Navigate to="/tab3" replace />;
  }

  const idLabel = context === "patient-history" ? "Doctor ID" : "Staff ID";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Wire to API / session when ready
  }

  const inputClass =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-cyan-50 placeholder:text-cyan-200/40 shadow-inner backdrop-blur-md transition focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950/80";

  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <Link
          to="/tab3"
          className="mb-6 text-sm font-medium text-cyan-200/80 transition hover:text-white"
        >
          ← Back to options
        </Link>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150"
        >
          <h1 className="mb-8 text-center text-lg font-semibold tracking-tight text-white">
            {context === "patient-history" ? "Patient History" : "Patient Transfer"}
          </h1>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="auth-id"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-cyan-100/80"
              >
                {idLabel}
              </label>
              <input
                id="auth-id"
                name="id"
                type="text"
                autoComplete="username"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className={inputClass}
                placeholder={`Enter ${idLabel}`}
              />
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-cyan-100/80"
              >
                Password
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/40 to-sky-500/35 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] backdrop-blur-sm transition hover:border-cyan-200/50 hover:shadow-[0_0_32px_rgba(34,211,238,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Submit
          </button>
        </form>
      </div>
    </GlassLayout>
  );
}
