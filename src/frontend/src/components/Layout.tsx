import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Divider,
  Tooltip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import BiotechIcon from '@mui/icons-material/Biotech'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import AssessmentIcon from '@mui/icons-material/Assessment'
import MedicationIcon from '@mui/icons-material/Medication'

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: <HomeIcon /> },
  { label: 'Signal Detection', path: '/signals', icon: <BiotechIcon /> },
  { label: 'Submission Readiness', path: '/readiness', icon: <AssignmentTurnedInIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const navContent = (
    <Box sx={{ width: 240 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MedicationIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={700} color="primary.main">
          DrugSafety AI
        </Typography>
      </Box>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => {
                navigate(item.path)
                setDrawerOpen(false)
              }}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <MedicationIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            DrugSafety AI
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75, display: { xs: 'none', sm: 'block' } }}>
            Signal Detection &amp; Submission Readiness
          </Typography>

          {!isMobile && (
            <Box sx={{ ml: 4, display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {NAV_ITEMS.map((item) => (
                <Tooltip key={item.path} title={item.label}>
                  <Button
                    color="inherit"
                    startIcon={item.icon}
                    onClick={() => navigate(item.path)}
                    sx={{
                      minHeight: 40,
                      opacity: isActive(item.path) ? 1 : 0.75,
                      fontWeight: isActive(item.path) ? 700 : 400,
                      borderBottom: isActive(item.path) ? '2px solid white' : '2px solid transparent',
                      borderRadius: 0,
                      pb: 0.5,
                    }}
                  >
                    {item.label}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
      >
        {navContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
