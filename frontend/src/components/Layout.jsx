import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  ListAlt as ListIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'

const drawerWidth = 280

function Layout({ children }) {
  const [open, setOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleDrawerToggle = () => {
    setOpen(!open)
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'New Crawl', icon: <AddIcon />, path: '/new-crawl' },
    { text: 'Jobs', icon: <ListIcon />, path: '/jobs' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ]

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AI-Ready Web Crawler
          </Typography>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                AD
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>My account</MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 72,
            boxSizing: 'border-box',
            backgroundColor: '#1a1a1a',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'hidden' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    backgroundColor: location.pathname === item.path ? 'rgba(0, 188, 212, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: location.pathname === item.path ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      '& .MuiTypography-root': {
                        fontWeight: location.pathname === item.path ? 600 : 400,
                      },
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${open ? drawerWidth : 72}px)`,
          minHeight: '100vh',
          backgroundColor: '#121212',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}

export default Layout