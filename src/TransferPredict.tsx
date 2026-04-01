import React, { useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Activity, LogOut, Plane, Siren, Truck } from "lucide-react";
import GlassLayout from "./components/GlassLayout";
import type { SensorPayload } from "./TransferLiveForm";
import {
  criticalParenLabel,
  generateIndexes,
  type IndexResult,
} from "./utils/generateIndexes";

type LocationState = {
  sensorData?: SensorPayload;
};

const glass =
  "rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150";

function formatSnapshotForDisplay(data: SensorPayload): { label: string; value: string }[] {
  return [
    { label: "SpO2", value: `${data.spo2} %` },
    { label: "Heart Rate", value: `${data.heart_rate} bpm` },
    { label: "BP Sys / Dia", value: `${data.bp_sys} / ${data.bp_dia} mmHg` },
    { label: "Resp Rate", value: `${data.resp_rate} /min` },
    { label: "Temperature", value: `${data.temperature} °C` },
    { label: "Glucose", value: `${data.glucose} mg/dL` },
    { label: "MAP", value: `${data.map} mmHg` },
    { label: "Cardiac Output", value: `${data.cardiac_output} L/min` },
    { label: "Cardiac Index", value: `${data.cardiac_index} L/min/m²` },
    { label: "CVP", value: `${data.cvp} mmHg` },
    { label: "Timestamp (UTC)", value: data.timestamp },
  ];
}

function IndexRow({
  title,
  value,
  paren,
  icon,
  accentClass,
}: {
  title: string;
  value: number;
  paren: string;
  icon: React.ReactNode;
  accentClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm ${accentClass}`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-200/80">
        {icon}
        {title}
      </div>
      <p className="font-mono text-2xl font-bold text-white sm:text-3xl">
        {value}{" "}
        <span className="text-base font-semibold text-cyan-100/85">
          ({paren})
        </span>
      </p>
    </div>
  );
}

export default function TransferPredict() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const sensorData = state?.sensorData;

  const result: IndexResult | null = useMemo(() => {
    if (!sensorData) return null;
    return generateIndexes(sensorData);
  }, [sensorData]);

  if (!sensorData || !result) {
    return <Navigate to="/transfer-live" replace />;
  }

  const snapshotRows = formatSnapshotForDisplay(sensorData);
  const criticalParen = criticalParenLabel(
    result.critical_index,
    result.summary.critical_status
  );

  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col px-4 py-8 sm:px-8 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-300" />
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Transfer — Index prediction
            </h1>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-400/40 hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Exit to home
          </Link>
        </header>

        <div className={`${glass} mb-6 p-5 sm:p-6`}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-300">
            Input snapshot
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {snapshotRows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm"
              >
                <span className="text-cyan-200/70">{row.label}: </span>
                <span className="font-mono text-cyan-50">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <IndexRow
            title="Critical Index"
            value={result.critical_index}
            paren={criticalParen}
            icon={<Siren className="h-4 w-4 text-red-300" />}
            accentClass="border-l-4 border-l-red-500/80"
          />
          <IndexRow
            title="Airlift Index"
            value={result.airlift_index}
            paren={result.summary.airlift_status}
            icon={<Plane className="h-4 w-4 text-cyan-200" />}
            accentClass="border-l-4 border-l-sky-400/80"
          />
          <IndexRow
            title="Transfer Index"
            value={result.transfer_index}
            paren={result.summary.transfer_status}
            icon={<Truck className="h-4 w-4 text-cyan-200" />}
            accentClass="border-l-4 border-l-emerald-400/80"
          />
        </div>

        <p className="mt-6 text-center text-xs text-cyan-100/50">
          Indices computed from the snapshot above. Refresh sensor data on the
          previous screen and run Predict again for a new reading.
        </p>
      </div>
    </GlassLayout>
  );
}
