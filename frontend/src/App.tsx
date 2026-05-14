import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import ManagePage from './pages/ManagePage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import { UserProvider, useUser } from './context/UserContext'

function AuthenticatedApp() {
  const { user } = useUser()

  if (!user) return <LoginPage />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <UserProvider>
      <AuthenticatedApp />
    </UserProvider>
  )
}
