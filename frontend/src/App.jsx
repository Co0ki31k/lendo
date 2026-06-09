import './App.css'
import Navbar from './components/layout/navbar/Navbar.jsx'
import HomePlaceholder from './pages/home/HomePlaceholder.jsx'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <HomePlaceholder />
    </div>
  )
}

export default App
