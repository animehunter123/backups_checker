import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import BackupStatus from './pages/BackupStatus';
import Directories from './pages/Directories';
import Servers from './pages/Servers';
import './App.css';

function App() {
  return (
    <Router>
      <CssBaseline />
      <div className="app-container">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<BackupStatus />} />
            <Route path="/directories" element={<Directories />} />
            <Route path="/servers" element={<Servers />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App
