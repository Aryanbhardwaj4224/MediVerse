import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  MapPin,
  MessageCircle,
  Phone,
  Radio,
} from "lucide-react";
import GlassLayout from "./components/GlassLayout";
import {
  staffData,
  type StaffMember,
  type TransferStatus,
} from "./data/staffData";

type FilterCategory = "department" | "role" | "ward" | "status";

export type ActiveFilter = {
  category: FilterCategory;
  value: string;
} | null;

const DEPARTMENTS = [
  "Cardiologist",
  "Neurologist",
  "Orthopedic",
  "Emergency",
  "ICU",
] as const;
const ROLES = ["Doctor", "Nurse", "Ward Boy", "Technician"] as const;
const WARDS = ["ICU", "General Ward", "Private Room"] as const;
const STATUS_OPTIONS = ["Available", "On Duty", "Off Duty"] as const;

function matchesStatusFilter(s: StaffMember, label: string): boolean {
  if (label === "Available") return s.currentStatus === "Available";
  if (label === "On Duty") return s.currentStatus === "Busy";
  if (label === "Off Duty") return s.currentStatus === "On Break";
  return true;
}

function filterStaff(list: StaffMember[], f: ActiveFilter): StaffMember[] {
  if (!f) return list;
  return list.filter((s) => {
    switch (f.category) {
      case "department":
        return s.department === f.value;
      case "role":
        return s.role === f.value;
      case "ward":
        return s.ward === f.value;
      case "status":
        return matchesStatusFilter(s, f.value);
      default:
        return true;
    }
  });
}

function cardAccent(s: StaffMember): {
  border: string;
  dot: string;
  label: string;
} {
  if (s.priorityLevel === "Critical") {
    return {
      border: "border-l-red-500 shadow-[0_0_24px_rgba(239,68,68,0.22)]",
      dot: "bg-red-500 shadow-[0_0_10px_#f87171]",
      label: "Critical",
    };
  }
  if (
    s.transferStatus === "In Progress" ||
    s.transferStatus === "Pending"
  ) {
    return {
      border: "border-l-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.2)]",
      dot: "bg-amber-400 shadow-[0_0_10px_#fbbf24]",
      label: "In transfer",
    };
  }
  return {
    border: "border-l-emerald-500/90 shadow-[0_0_18px_rgba(16,185,129,0.18)]",
    dot: "bg-emerald-500 shadow-[0_0_10px_#34d399]",
    label: "Stable",
  };
}

function transferBadgeClass(ts: TransferStatus): string {
  if (ts === "Completed")
    return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
  if (ts === "In Progress")
    return "border-amber-400/50 bg-amber-500/15 text-amber-100";
  return "border-cyan-400/40 bg-cyan-500/15 text-cyan-100";
}

const filterBtn =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-cyan-100/90 transition hover:border-cyan-300/40 hover:bg-cyan-500/10 hover:text-white";
const filterBtnActive =
  "border-cyan-400/50 bg-cyan-500/20 text-white shadow-[0_0_16px_rgba(34,211,238,0.15)]";

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-100 transition hover:border-cyan-300/40 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);

  const filtered = useMemo(
    () => filterStaff(staffData, activeFilter),
    [activeFilter]
  );

  function selectFilter(category: FilterCategory, value: string) {
    setActiveFilter((prev) =>
      prev?.category === category && prev.value === value
        ? null
        : { category, value }
    );
  }

  return (
    <GlassLayout>
      {/* h-[100dvh] + overflow-hidden: only inner panels scroll — sidebar does not move with main */}
      <div className="flex h-[100dvh] min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-6 lg:flex-row lg:gap-8 lg:p-8">
        {/* Sidebar — independent scroll only if filters overflow; not tied to main scroll */}
        <aside className="scrollbar-modern max-h-[min(42vh,24rem)] w-full shrink-0 overflow-y-auto rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 lg:max-h-none lg:h-full lg:w-1/4 lg:self-stretch lg:overflow-y-auto lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-200">
              Filters
            </h2>
            {activeFilter && (
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className="text-xs font-medium text-cyan-300/80 underline-offset-2 hover:text-white hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <nav className="space-y-6" aria-label="Dashboard filters">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400/80">
                Departments
              </h3>
              <ul className="flex flex-col gap-1.5">
                {DEPARTMENTS.map((d) => (
                  <li key={d}>
                    <button
                      type="button"
                      onClick={() => selectFilter("department", d)}
                      className={`${filterBtn} ${
                        activeFilter?.category === "department" &&
                        activeFilter.value === d
                          ? filterBtnActive
                          : ""
                      }`}
                    >
                      {d}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400/80">
                Roles
              </h3>
              <ul className="flex flex-col gap-1.5">
                {ROLES.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => selectFilter("role", r)}
                      className={`${filterBtn} ${
                        activeFilter?.category === "role" &&
                        activeFilter.value === r
                          ? filterBtnActive
                          : ""
                      }`}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400/80">
                Wards
              </h3>
              <ul className="flex flex-col gap-1.5">
                {WARDS.map((w) => (
                  <li key={w}>
                    <button
                      type="button"
                      onClick={() => selectFilter("ward", w)}
                      className={`${filterBtn} ${
                        activeFilter?.category === "ward" &&
                        activeFilter.value === w
                          ? filterBtnActive
                          : ""
                      }`}
                    >
                      {w}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400/80">
                Status
              </h3>
              <ul className="flex flex-col gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => selectFilter("status", s)}
                      className={`${filterBtn} ${
                        activeFilter?.category === "status" &&
                        activeFilter.value === s
                          ? filterBtnActive
                          : ""
                      }`}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main — only this column scrolls vertically */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 lg:w-3/4">
          <div className="scrollbar-modern min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 sm:p-6">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <Link
                to="/"
                className="mb-2 inline-block text-sm font-medium text-cyan-200/90 transition hover:text-white"
              >
                ← Home
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Staff dashboard
              </h1>
              <p className="mt-1 text-sm text-cyan-100/70">
                {filtered.length} staff member
                {filtered.length !== 1 ? "s" : ""} shown
                {activeFilter && (
                  <span className="text-cyan-300/90">
                    {" "}
                    · {activeFilter.category}: {activeFilter.value}
                  </span>
                )}
              </p>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
            {filtered.map((s) => {
              const accent = cardAccent(s);
              return (
                <article
                  key={s.id}
                  className={`rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md transition hover:border-white/25 ${accent.border} border-l-4`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${accent.dot}`}
                        title={accent.label}
                        aria-hidden
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {s.name}
                        </h2>
                        <p className="text-sm text-cyan-200/90">
                          {s.role} · {s.department}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-cyan-100/60">
                          {s.staffId}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-100">
                        {s.currentStatus}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          s.priorityLevel === "Critical"
                            ? "border-red-400/40 bg-red-500/15 text-red-100"
                            : s.priorityLevel === "High"
                              ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                              : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                        }`}
                      >
                        {s.priorityLevel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-cyan-50/90">
                    <p>
                      <span className="text-cyan-200/70">Patient: </span>
                      {s.patientName} ({s.patientId})
                    </p>
                    <p>
                      <span className="text-cyan-200/70">Location: </span>
                      {s.ward} · Room {s.room} · Bed {s.bed}
                    </p>
                    <p>
                      <span className="text-cyan-200/70">Task: </span>
                      {s.currentTask}
                    </p>
                    <p>
                      <span className="text-cyan-200/70">Diagnosis: </span>
                      {s.diagnosis}
                    </p>
                    <p>
                      <span className="text-cyan-200/70">Treatment: </span>
                      {s.treatment}
                    </p>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
                      Transfer
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${transferBadgeClass(s.transferStatus)}`}
                      >
                        {s.transferStatus}
                      </span>
                      <span className="text-xs text-cyan-100/80">
                        {s.transferResponsibility}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-cyan-100/60">
                      Supervisor: {s.supervisor} · Assistance:{" "}
                      {s.transferAssistanceAvailable ? "Yes" : "No"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}
                        className={iconBtn}
                        aria-label="Call"
                      >
                        <Phone className="h-4 w-4" strokeWidth={2} />
                      </a>
                      <button type="button" className={iconBtn} aria-label="Pager">
                        <Radio className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button type="button" className={iconBtn} aria-label="Message">
                        <MessageCircle className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <span className="self-center text-xs text-cyan-200/60">
                        Ext {s.internalExt}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                        onClick={() =>
                          window.alert(`Live location (mock): ${s.liveLocation}`)
                        }
                      >
                        <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                        Live location
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-xl border border-red-400/35 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-100 transition hover:bg-red-500/20"
                        onClick={() =>
                          window.alert(
                            `Emergency alert (mock) for ${s.name} — notify charge nurse.`
                          )
                        }
                      >
                        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                        Emergency alert
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-[10px] text-cyan-100/45">
                    Shift: {s.shift} · Updated {s.lastUpdated}
                  </p>
                </article>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-cyan-200/70">
              No staff match this filter. Try another or{" "}
              <button
                type="button"
                className="text-cyan-300 underline hover:text-white"
                onClick={() => setActiveFilter(null)}
              >
                clear filters
              </button>
              .
            </p>
          )}
          </div>
        </main>
      </div>
    </GlassLayout>
  );
}
