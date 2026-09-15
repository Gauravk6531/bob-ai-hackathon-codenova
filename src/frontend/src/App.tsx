import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SignalDetection from './pages/SignalDetection'
import SubmissionReadiness from './pages/SubmissionReadiness'
import Reports from './pages/Reports'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
    },
    secondary: {
      main: '#00695C',
      light: '#00897B',
      dark: '#004D40',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    error: {
      main: '#C62828',
    },
    warning: {
      main: '#F57C00',
    },
    success: {
      main: '#2E7D32',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'signals', element: <SignalDetection /> },
      { path: 'readiness', element: <SubmissionReadiness /> },
      { path: 'reports', element: <Reports /> },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
