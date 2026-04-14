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
  const [activeTab, setActiveTab] = useState('viendo')

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

  if (!user) {
    return <LoginPage />
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'viendo':  return <ViendoPage />
      case 'horario': return <HorarioPage />
      case 'bd':      return <BDPage />
      case 'entrada': return <EntradaDatosPage />
      default:        return <ViendoPage />
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
