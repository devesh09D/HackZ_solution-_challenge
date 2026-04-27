import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import FieldWorker from './pages/FieldWorker'
import NGODashboard from './pages/NGODashboard'
import VolunteerApp from './pages/VolunteerApp'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050d1a] font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/field-worker" element={<FieldWorker />} />
          <Route path="/ngo-dashboard" element={<NGODashboard />} />
          <Route path="/volunteer" element={<VolunteerApp />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
