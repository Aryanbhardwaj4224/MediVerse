import React from "react";
import { ExternalLink, FileText, Home } from "lucide-react";
import { Link } from "react-router-dom";
import GlassLayout from "./components/GlassLayout";

const glass =
  "rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150";

const REPORTS: Array<{
  sNo: number;
  reportName: string;
  performedAt: string;
  dateOfPerform: string;
  performedBy: string;
  viewUrl: string;
}> = [
  {
    sNo: 1,
    reportName: "CBC report",
    performedAt: "Curefree Diagnostics",
    dateOfPerform: "12 February 2026",
    performedBy: "Dr. Vinayak Mishra",
    viewUrl:
      "https://drive.google.com/file/d/1MktSkH2rq67vdmnxJY4bufmzvLuwA2SN/view?usp=sharing",
  },
  {
    sNo: 2,
    reportName: "Liver Function Test (SGOT/SGPT)",
    performedAt: "Curefree Diagnostics",
    dateOfPerform: "23 February 2026",
    performedBy: "Dr. Mayank Kumar",
    viewUrl:
      "https://drive.google.com/file/d/1jHC9lKTzAdoxmE2diSyAOzjCXKqe0A3z/view?usp=sharing",
  },
  {
    sNo: 3,
    reportName: "Blood Glucose Level",
    performedAt: "Medicure Hospital",
    dateOfPerform: "28 February 2026",
    performedBy: "Dr. Sebastian",
    viewUrl:
      "https://drive.google.com/file/d/1myk8-q0dH276eGcBw2Du8QUJCc_iL1dF/view?usp=sharing",
  },
  {
    sNo: 4,
    reportName: "Creatinine Report",
    performedAt: "Leobuild Hospital",
    dateOfPerform: "2 March 2026",
    performedBy: "Dr. Ravi Verma",
    viewUrl:
      "https://drive.google.com/file/d/1SE9eiiCjOoglMWj64RLNWMEaD4AwjGSi/view?usp=sharing",
  },
  {
    sNo: 5,
    reportName: "Cardiac Troponin",
    performedAt: "Medisafe Hospital",
    dateOfPerform: "12 March 2026",
    performedBy: "Dr. Aryan",
    viewUrl:
      "https://drive.google.com/file/d/1kV32UrpoGU8QUKm3AkC0SeU5KqPmtuI1/view?usp=sharing",
  },
  {
    sNo: 6,
    reportName: "ECG",
    performedAt: "Arpit Hospital",
    dateOfPerform: "21 March 2026",
    performedBy: "Dr. Palak Garg",
    viewUrl:
      "https://drive.google.com/file/d/1gCrYKCaeyLj5Ir5w2vsGdaho1QPEqKdK/view?usp=sharing",
  },
];

export default function PatientMedicalReportHistory() {
  return (
    <GlassLayout>
      <div className="min-h-[100dvh] px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 lg:flex-none" />
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-400/40 hover:bg-white/15"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </header>

        <h1 className="mb-8 text-center text-xl font-bold text-white sm:text-2xl md:text-3xl">
          Arvi Sharma&apos;s Medical Report History
        </h1>

        <div className={`${glass} overflow-hidden p-0`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 bg-white/5 text-xs uppercase tracking-wider text-cyan-200/80">
                  <th className="px-4 py-3 font-semibold">S.no</th>
                  <th className="px-4 py-3 font-semibold">Report Name</th>
                  <th className="px-4 py-3 font-semibold">Performed at</th>
                  <th className="px-4 py-3 font-semibold">Date of perform</th>
                  <th className="px-4 py-3 font-semibold">Performed by</th>
                  <th className="px-4 py-3 font-semibold">View Report</th>
                </tr>
              </thead>
              <tbody>
                {REPORTS.map((r) => (
                  <tr
                    key={r.sNo}
                    className="border-b border-white/10 transition hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3 font-mono text-cyan-100/90">
                      {r.sNo}
                    </td>
                    <td className="px-4 py-3 font-medium text-cyan-50">
                      {r.reportName}
                    </td>
                    <td className="px-4 py-3 text-cyan-100/90">{r.performedAt}</td>
                    <td className="px-4 py-3 text-cyan-100/90">{r.dateOfPerform}</td>
                    <td className="px-4 py-3 text-cyan-100/90">{r.performedBy}</td>
                    <td className="px-4 py-3">
                      <a
                        href={r.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-50 transition hover:border-cyan-300/55 hover:bg-cyan-500/25 sm:text-sm"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        View
                        <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-cyan-200/50">
          Report files open in Google Drive in a new tab.
        </p>
      </div>
    </GlassLayout>
  );
}
