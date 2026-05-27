import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { TrainingPage } from './pages/TrainingPage';
import { NewMeetingPage } from './pages/NewMeetingPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/meetings/new" element={<NewMeetingPage />} />
        <Route path="/meetings" element={<HistoryPage />} />
        <Route path="/meetings/:id" element={<AnalysisPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
}
