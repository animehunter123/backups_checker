import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import Navbar from './components/Navbar';
import BackupStatus from './pages/BackupStatus';
import Directories from './pages/Directories';
import Servers from './pages/Servers';
import theme from './theme';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
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
    </ThemeProvider>
  );
}

export default App
