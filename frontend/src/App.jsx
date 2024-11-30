import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import BackupStatus from './pages/BackupStatus';
import Directories from './pages/Directories';
import Servers from './pages/Servers';
import { getTheme } from './theme';
import { ColorModeContext } from './theme/ColorModeContext';
import './App.css';

function App() {
  const [mode, setMode] = useState('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
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
    </ColorModeContext.Provider>
  );
}

export default App
