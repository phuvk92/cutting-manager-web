import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Role } from '@/types/auth'
import { LoadingState } from '@/components/common/LoadingState'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation()
  const { isAuthenticated, isInitialized, user } = useAuthStore()

  if (!isInitialized) {
    return <LoadingState tip="Initializing session..." minHeight="100vh" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
