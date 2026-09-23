import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FarmProfile from './pages/FarmProfile'
import CropIntelligence from './pages/CropIntelligence'
import MarketIntelligence from './pages/MarketIntelligence'
import DemandForecast from './pages/DemandForecast'
import PriceForecast from './pages/PriceForecast'
import CropRecommendation from './pages/CropRecommendation'
import ProductionEstimation from './pages/ProductionEstimation'
import SupplyDemand from './pages/SupplyDemand'
import CultivationScheduler from './pages/CultivationScheduler'
import RiskAnalysis from './pages/RiskAnalysis'
import MarketAllocation from './pages/MarketAllocation'
import WhatIf from './pages/WhatIf'
import StrawberryDetection from './pages/StrawberryDetection'
import CCTVMonitoring from './pages/CCTVMonitoring'
import LiveMandiTracker from './pages/LiveMandiTracker'
import Marketplace from './pages/Marketplace'
import AdminPanel from './pages/AdminPanel'
import PlantHealthDetection from './pages/PlantHealthDetection'
import { LanguageProvider } from './context/LanguageContext'


function Private({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Private>
              <AppLayout />
            </Private>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="cctv" element={<CCTVMonitoring />} />
          <Route path="mandi-live" element={<LiveMandiTracker />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="farm" element={<FarmProfile />} />
          <Route path="crops" element={<CropIntelligence />} />
          <Route path="markets" element={<MarketIntelligence />} />
          <Route path="demand" element={<DemandForecast />} />
          <Route path="prices" element={<PriceForecast />} />
          <Route path="recommendations" element={<CropRecommendation />} />
          <Route path="production" element={<ProductionEstimation />} />
          <Route path="supply-demand" element={<SupplyDemand />} />
          <Route path="scheduler" element={<CultivationScheduler />} />
          <Route path="risk" element={<RiskAnalysis />} />
          <Route path="allocation" element={<MarketAllocation />} />
          <Route path="what-if" element={<WhatIf />} />
          <Route path="vision" element={<StrawberryDetection />} />
          <Route path="plant-health" element={<PlantHealthDetection />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>

      </Routes>
    </LanguageProvider>
  )
}
