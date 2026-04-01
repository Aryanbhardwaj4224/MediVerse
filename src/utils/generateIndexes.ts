/**
 * Clinical index scoring from a single sensor snapshot.
 * Ported from your Python `generate_indexes` logic.
 */
export type SensorSnapshot = {
  spo2?: number;
  heart_rate?: number;
  map?: number;
  resp_rate?: number;
  temperature?: number;
  cardiac_index?: number;
  timestamp?: string;
  [key: string]: unknown;
};

export type IndexSummary = {
  critical_status: "HIGH RISK" | "MODERATE" | "STABLE";
  airlift_status: "NOT RECOMMENDED" | "CAUTION" | "SAFE";
  transfer_status: "NOT SAFE" | "CAUTION" | "SAFE";
};

export type IndexResult = {
  critical_index: number;
  airlift_index: number;
  transfer_index: number;
  summary: IndexSummary;
};

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function generateIndexes(data: SensorSnapshot): IndexResult {
  const spo2 = num(data.spo2, 0);
  const hr = num(data.heart_rate, 0);
  const mapVal = num(data.map, 0);
  const rr = num(data.resp_rate, 0);
  const temp = num(data.temperature, 0);
  const ci = num(data.cardiac_index, 0);

  let critical = 0;

  if (spo2 < 85) critical += 30;
  else if (spo2 < 90) critical += 20;
  else if (spo2 < 95) critical += 10;

  if (hr > 130 || hr < 50) critical += 25;
  else if (hr > 110) critical += 15;

  if (mapVal < 60) critical += 25;
  else if (mapVal < 70) critical += 15;

  if (rr > 30) critical += 10;
  else if (rr > 22) critical += 5;

  if (temp > 39 || temp < 35) critical += 10;

  if (ci < 2.0) critical += 10;

  critical = Math.min(critical, 100);

  let airlift = 100;

  if (spo2 < 90) airlift -= 30;
  else if (spo2 < 95) airlift -= 15;

  if (hr > 120 || hr < 50) airlift -= 20;

  if (mapVal < 65) airlift -= 20;

  if (rr > 25) airlift -= 10;

  if (temp > 38.5 || temp < 35) airlift -= 5;

  if (ci < 2.2) airlift -= 15;

  airlift = Math.max(airlift, 0);

  let transfer = 100;

  if (spo2 < 85) transfer -= 40;
  else if (spo2 < 92) transfer -= 20;

  if (hr > 130 || hr < 50) transfer -= 25;
  else if (hr > 110) transfer -= 10;

  if (mapVal < 60) transfer -= 25;
  else if (mapVal < 70) transfer -= 10;

  if (rr > 30) transfer -= 10;

  if (temp > 39 || temp < 35) transfer -= 5;

  if (ci < 2.0) transfer -= 10;

  transfer = Math.max(transfer, 0);

  const summary: IndexSummary = {
    critical_status:
      critical > 70 ? "HIGH RISK" : critical > 40 ? "MODERATE" : "STABLE",
    airlift_status:
      airlift < 40 ? "NOT RECOMMENDED" : airlift < 70 ? "CAUTION" : "SAFE",
    transfer_status:
      transfer < 40 ? "NOT SAFE" : transfer < 70 ? "CAUTION" : "SAFE",
  };

  return {
    critical_index: critical,
    airlift_index: airlift,
    transfer_index: transfer,
    summary,
  };
}

/** Paren label for Critical row — highlights very high scores as EXTREME */
export function criticalParenLabel(
  criticalIndex: number,
  summaryStatus: IndexSummary["critical_status"]
): string {
  if (criticalIndex >= 90) return "EXTREME";
  if (summaryStatus === "HIGH RISK") return "HIGH RISK";
  if (summaryStatus === "MODERATE") return "MODERATE";
  return "STABLE";
}
