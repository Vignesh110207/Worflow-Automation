import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import WorkflowList from './pages/developer/WorkflowList'
import WorkflowCreate from './pages/developer/WorkflowCreate'
import WorkflowDetail from './pages/developer/WorkflowDetail'
import ExecutionList from './pages/developer/ExecutionList'
import ExecutionDetail from './pages/developer/ExecutionDetail'
import { AdminStats, UserManagement, AuditLogs } from './pages/admin'
import ExecutionLogs from './pages/developer/ExecutionLogs'
import { UserWorkflowList, UserExecutionList } from './pages/user'
import { Spinner } from './components/common'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
      <Spinner size={40}/>
    </div>
  )
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function RequireRole({ children, roles }) {
  const { user } = useAuth()
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff', color: '#0f172a',
            border: '1px solid #e1e6f5', borderRadius: 12,
            fontSize: 13, fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 16px rgba(15,23,42,0.1)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          duration: 3500,
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />

        {/* Protected layout */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          {/* All roles */}
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="executions/:id" element={<ExecutionDetail />} />

          {/* Developer + Admin */}
          <Route path="workflows"     element={<RequireRole roles={['admin','developer']}><WorkflowList /></RequireRole>} />
          <Route path="workflows/new" element={<RequireRole roles={['admin','developer']}><WorkflowCreate /></RequireRole>} />
          <Route path="workflows/:id" element={<RequireRole roles={['admin','developer']}><WorkflowDetail /></RequireRole>} />
          <Route path="executions"    element={<RequireRole roles={['admin','developer']}><ExecutionList /></RequireRole>} />
          <Route path="audit-logs"    element={<RequireRole roles={['admin','developer']}><AuditLogs /></RequireRole>} />
          <Route path="execution-logs" element={<RequireRole roles={['admin','developer']}><ExecutionLogs /></RequireRole>} />

          {/* Admin only */}
          <Route path="admin/users" element={<RequireRole roles={['admin']}><UserManagement /></RequireRole>} />
          <Route path="admin/stats" element={<RequireRole roles={['admin']}><AdminStats /></RequireRole>} />

          {/* User role */}
          <Route path="user/workflows"  element={<UserWorkflowList />} />
          <Route path="user/executions" element={<UserExecutionList />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
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
