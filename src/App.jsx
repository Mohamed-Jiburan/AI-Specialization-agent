import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import Roadmap from './pages/Roadmap'
import CareerProfile from './pages/CareerProfile'
import Comparison from './pages/Comparison'
import Roadmaps from './pages/Roadmaps'
import SwotRedirect from './pages/SwotRedirect'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/profile" element={<ProfileSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/swot" element={<SwotRedirect />} />
          <Route path="/roadmap/:careerId" element={<Roadmap />} />
          <Route path="/career/:careerId" element={<CareerProfile />} />
          <Route path="/compare" element={<Comparison />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
