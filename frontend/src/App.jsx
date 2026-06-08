import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Spinner } from './components/UI'

const Home        = lazy(() => import('./pages/Home'))
const Login       = lazy(() => import('./pages/Login'))
const Register    = lazy(() => import('./pages/Register'))
const Dashboard   = lazy(() => import('./pages/Dashboard'))
const Mentors     = lazy(() => import('./pages/Mentors'))
const Investors   = lazy(() => import('./pages/Investors'))
const Courses     = lazy(() => import('./pages/Courses'))
const Events      = lazy(() => import('./pages/Events'))
const Funding     = lazy(() => import('./pages/Funding'))
const Community   = lazy(() => import('./pages/Community'))
const Technologies = lazy(() => import('./pages/Technologies'))
const Problems    = lazy(() => import('./pages/Problems'))
const Services    = lazy(() => import('./pages/Services'))
const Assessment  = lazy(() => import('./pages/Assessment'))
const Programs    = lazy(() => import('./pages/Programs'))
const Resources   = lazy(() => import('./pages/Resources'))
const StartupList = lazy(() => import('./pages/StartupList'))
const AdminPage   = lazy(() => import('./pages/Admin'))
const DataRoom    = lazy(() => import('./pages/DataRoom'))

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="spinner"/></div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/mentors"         element={<PrivateRoute><Mentors /></PrivateRoute>} />
        <Route path="/investors"       element={<PrivateRoute><Investors /></PrivateRoute>} />
        <Route path="/courses"         element={<PrivateRoute><Courses /></PrivateRoute>} />
        <Route path="/events"          element={<PrivateRoute><Events /></PrivateRoute>} />
        <Route path="/funding"         element={<PrivateRoute><Funding /></PrivateRoute>} />
        <Route path="/community"       element={<PrivateRoute><Community /></PrivateRoute>} />
        <Route path="/technologies"    element={<PrivateRoute><Technologies /></PrivateRoute>} />
        <Route path="/problems"        element={<PrivateRoute><Problems /></PrivateRoute>} />
        <Route path="/services"        element={<PrivateRoute><Services /></PrivateRoute>} />
        <Route path="/services-admin"  element={<PrivateRoute><Services /></PrivateRoute>} />
        <Route path="/assessment"      element={<PrivateRoute><Assessment /></PrivateRoute>} />
        <Route path="/assessments"     element={<PrivateRoute><Assessment /></PrivateRoute>} />
        <Route path="/programs"        element={<PrivateRoute><Programs /></PrivateRoute>} />
        <Route path="/resources"       element={<PrivateRoute><Resources /></PrivateRoute>} />
        <Route path="/startup"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/startups-list"   element={<PrivateRoute><StartupList /></PrivateRoute>} />
        <Route path="/admin"           element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="/dataroom"        element={<PrivateRoute><DataRoom /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
