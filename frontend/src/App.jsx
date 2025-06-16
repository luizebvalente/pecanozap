import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import BusinessesPage from './pages/BusinessesPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/businesses" element={<BusinessesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<HomePage />} /> {/* Fallback */}
        </Routes>
      </div>
    </Router>
  )
}

export default App
