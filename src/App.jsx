import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Layout from './components/Layout'
import ViendoPage from './pages/ViendoPage'
import BDPage from './pages/BDPage'
import EntradaDatosPage from './pages/EntradaDatosPage'
import HorarioPage from './pages/HorarioPage'

function AppContent() {
  const { user, loading, recoveryMode } = useAuth()
  const [activeTab, setActiveTab] = useState('horario')
  const [showLogin, setShowLogin] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-anime-bg">
        <div className="text-white/30 text-sm animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (recoveryMode) {
    return <ResetPasswordPage />
  }

  // Not logged in — show Horario publicly, with optional login overlay
  if (!user) {
    return (
      <>
        <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogin={() => setShowLogin(true)}>
          <HorarioPage />
        </Layout>
        {showLogin && <LoginPage onCancel={() => setShowLogin(false)} />}
      </>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'viendo':  return <ViendoPage />
      case 'horario': return <HorarioPage />
      case 'bd':      return <BDPage />
      case 'entrada': return <EntradaDatosPage />
      default:        return <HorarioPage />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
