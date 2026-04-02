import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Authentication from "./Authentication";
import CentralSystem from "./CentralSystem";
import Dashboard from "./Dashboard";
import EmergencyPage from "./EmergencyPage";
import Home from "./Home";
import SupportDashboard from "./SupportDashboard";
import Tab3Options from "./Tab3Options";
import TransferLiveForm from "./TransferLiveForm";
import TransferPredict from "./TransferPredict";
import MediShedularAuth from "./MediShedularAuth";
import MediShedularDashboard from "./MediShedularDashboard";
import PatientMedicalReportHistory from "./PatientMedicalReportHistory";
import VitalWeaveNexus from "./VitalWeaveNexus";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/support" element={<SupportDashboard />} />
        <Route path="/central" element={<CentralSystem />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/vitalweave-nexus" element={<VitalWeaveNexus />} />
        <Route path="/tab3" element={<Tab3Options />} />
        <Route path="/transfer-live" element={<TransferLiveForm />} />
        <Route path="/transfer-predict" element={<TransferPredict />} />
        <Route path="/medishedular" element={<MediShedularAuth />} />
        <Route path="/medishedular/dashboard" element={<MediShedularDashboard />} />
        <Route path="/patient-history/reports" element={<PatientMedicalReportHistory />} />
        <Route path="/auth/:context" element={<Authentication />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
