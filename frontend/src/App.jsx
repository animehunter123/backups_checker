import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import BackupStatus from './pages/BackupStatus';
import Directories from './pages/Directories';
import Servers from './pages/Servers';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<BackupStatus />} />
            <Route path="/directories" element={<Directories />} />
            <Route path="/servers" element={<Servers />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App
