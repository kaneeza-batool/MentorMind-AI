import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Home from '@/pages/Home'
import Onboarding from '@/pages/Onboarding'
import Learning from '@/pages/Learning'
import Quiz from '@/pages/Quiz'

// Lazy-load heavy pages to reduce initial bundle size
const Reflection     = lazy(() => import('@/pages/Reflection'))
const Resources      = lazy(() => import('@/pages/Resources'))
const MissionControl = lazy(() => import('@/pages/MissionControl'))
const JourneyComplete = lazy(() => import('@/pages/JourneyComplete'))

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center gap-2.5">
      <Loader2 size={20} className="text-primary-300 animate-spin" aria-hidden="true" />
      <span className="text-sm text-text-muted">Loading…</span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"           element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* App shell — sidebar + header */}
        <Route element={<AppShell />}>
          <Route path="/learn"   element={<Learning />} />
          <Route path="/quiz"    element={<Quiz />} />
          <Route path="/reflection" element={
            <Suspense fallback={<PageLoader />}>
              <Reflection />
            </Suspense>
          } />
          <Route path="/resources" element={
            <Suspense fallback={<PageLoader />}>
              <Resources />
            </Suspense>
          } />
          <Route path="/mission-control" element={
            <Suspense fallback={<PageLoader />}>
              <MissionControl />
            </Suspense>
          } />
          <Route path="/journey-complete" element={
            <Suspense fallback={<PageLoader />}>
              <JourneyComplete />
            </Suspense>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
