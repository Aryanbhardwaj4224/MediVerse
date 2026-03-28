import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Authentication from "./Authentication";
import EmergencyPage from "./EmergencyPage";
import Home from "./Home";
import Tab3Options from "./Tab3Options";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/tab3" element={<Tab3Options />} />
        <Route path="/auth/:context" element={<Authentication />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
