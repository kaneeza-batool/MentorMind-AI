import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import Home from '@/pages/Home'
import Onboarding from '@/pages/Onboarding'
import Learning from '@/pages/Learning'
import Quiz from '@/pages/Quiz'
import Reflection from '@/pages/Reflection'
import Resources from '@/pages/Resources'
import MissionControl from '@/pages/MissionControl'
import JourneyComplete from '@/pages/JourneyComplete'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"           element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* App shell — sidebar + header */}
        <Route element={<AppShell />}>
          <Route path="/learn"             element={<Learning />} />
          <Route path="/quiz"              element={<Quiz />} />
          <Route path="/reflection"        element={<Reflection />} />
          <Route path="/resources"         element={<Resources />} />
          <Route path="/mission-control"   element={<MissionControl />} />
          <Route path="/journey-complete"  element={<JourneyComplete />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
