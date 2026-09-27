import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoadingState } from '@/components/common/LoadingState'
import { useAuthStore } from '@/stores/authStore'

const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const VehicleConfigurationsPage = lazy(() => import('@/pages/VehicleConfigurationsPage').then(m => ({ default: m.VehicleConfigurationsPage })))
const SvgPage = lazy(() => import('@/pages/SvgPage').then(m => ({ default: m.SvgPage })))
const UsersPage = lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })))
const AuditPage = lazy(() => import('@/pages/AuditPage').then(m => ({ default: m.AuditPage })))
const DealersPage = lazy(() => import('@/pages/DealersPage').then(m => ({ default: m.DealersPage })))
const SessionsPage = lazy(() => import('@/pages/SessionsPage').then(m => ({ default: m.SessionsPage })))
const BulkUploadPage = lazy(() => import('@/pages/BulkUploadPage').then(m => ({ default: m.BulkUploadPage })))
const ApprovePage = lazy(() => import('@/pages/ApprovePage').then(m => ({ default: m.ApprovePage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage').then(m => ({ default: m.ForbiddenPage })))

export const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <Suspense fallback={<LoadingState tip="Đang tải giao diện..." minHeight="80vh" />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
        </Route>

        {/* Protected Routes inside MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Admin and Agent routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'AGENT']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/svg" element={<SvgPage />} />
            </Route>

            {/* Admin only routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/dealers" element={<DealersPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/categories" element={<Navigate to="/vehicle-configurations" replace />} />
              <Route path="/vehicle-configurations" element={<VehicleConfigurationsPage />} />
              <Route path="/bulk-upload" element={<BulkUploadPage />} />
              <Route path="/approve" element={<ApprovePage />} />
              <Route path="/audit" element={<AuditPage />} />
            </Route>

            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
