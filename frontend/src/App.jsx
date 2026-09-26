import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SoilInput from './pages/SoilInput.jsx'
import Recommendation from './pages/Recommendation.jsx'
import History from './pages/History.jsx'
import Login from './pages/Auth/Login.jsx'
import Register from './pages/Auth/Register.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/fields/:fieldId/soil" element={<SoilInput />} />
      <Route path="/fields/:fieldId/recommendation" element={<Recommendation />} />
      <Route path="/fields/:fieldId/history" element={<History />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
