import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from '@mui/material'
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
} from '@mui/icons-material'

function Settings() {
  const [settings, setSettings] = useState({
    // General
    maxConcurrentRequests: 10,
    requestDelay: 1.0,
    defaultUserAgent: 'AI-Ready-Crawler/1.0',
    
    // Processing
    defaultChunkSize: 512,
    defaultChunkOverlap: 50,
    enableDeduplication: true,
    enableTopicClassification: true,
    enableTrustScore: true,
    
    // Legal & Privacy
    respectRobotsTxt: true,
    enablePrivacyFilter: true,
    enableLicenseDetection: true,
    
    // Storage
    maxStorageGB: 10,
    autoExport: true,
    defaultOutputFormat: 'jsonl',
    
    // Performance
    maxPagesPerJob: 1000,
    maxDepthPerJob: 10,
    timeoutSeconds: 30,
  })

  const [saveStatus, setSaveStatus] = useState(null)

  const handleChange = (field) => (event) => {
    setSettings({
      ...settings,
      [field]: event.target.value,
    })
  }

  const handleSwitchChange = (field) => (event) => {
    setSettings({
      ...settings,
      [field]: event.target.checked,
    })
  }

  const handleSave = () => {
    // In a real app, this would save to backend
    setSaveStatus({
      type: 'success',
      message: 'Settings saved successfully',
    })
    setTimeout(() => setSaveStatus(null), 3000)
  }

  const handleReset = () => {
    // Reset to defaults
    window.location.reload()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Settings
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            sx={{ mr: 2 }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {saveStatus && (
        <Alert severity={saveStatus.type} sx={{ mb: 3 }}>
          {saveStatus.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">General Settings</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Concurrent Requests"
                    type="number"
                    value={settings.maxConcurrentRequests}
                    onChange={handleChange('maxConcurrentRequests')}
                    InputProps={{ inputProps: { min: 1, max: 50 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Request Delay (seconds)"
                    type="number"
                    value={settings.requestDelay}
                    onChange={handleChange('requestDelay')}
                    InputProps={{ inputProps: { min: 0.1, max: 5, step: 0.1 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default User Agent"
                    value={settings.defaultUserAgent}
                    onChange={handleChange('defaultUserAgent')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Processing Settings</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Default Chunk Size: {settings.defaultChunkSize} tokens
                  </Typography>
                  <Slider
                    value={settings.defaultChunkSize}
                    onChange={(_, value) => setSettings({ ...settings, defaultChunkSize: value })}
                    min={128}
                    max={2048}
                    step={128}
                    marks={[
                      { value: 256, label: '256' },
                      { value: 512, label: '512' },
                      { value: 1024, label: '1024' },
                      { value: 2048, label: '2048' },
                    ]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Chunk Overlap: {settings.defaultChunkOverlap} tokens
                  </Typography>
                  <Slider
                    value={settings.defaultChunkOverlap}
                    onChange={(_, value) => setSettings({ ...settings, defaultChunkOverlap: value })}
                    min={0}
                    max={200}
                    step={10}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableDeduplication}
                        onChange={handleSwitchChange('enableDeduplication')}
                      />
                    }
                    label="Enable Deduplication"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableTopicClassification}
                        onChange={handleSwitchChange('enableTopicClassification')}
                      />
                    }
                    label="Topic Classification"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableTrustScore}
                        onChange={handleSwitchChange('enableTrustScore')}
                      />
                    }
                    label="Trust Score"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Legal & Privacy */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Legal & Privacy</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.respectRobotsTxt}
                        onChange={handleSwitchChange('respectRobotsTxt')}
                      />
                    }
                    label="Respect robots.txt"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enablePrivacyFilter}
                        onChange={handleSwitchChange('enablePrivacyFilter')}
                      />
                    }
                    label="Privacy Filter (PII Redaction)"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableLicenseDetection}
                        onChange={handleSwitchChange('enableLicenseDetection')}
                      />
                    }
                    label="License Detection"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Storage Settings</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Max Storage: {settings.maxStorageGB} GB
                  </Typography>
                  <Slider
                    value={settings.maxStorageGB}
                    onChange={(_, value) => setSettings({ ...settings, maxStorageGB: value })}
                    min={1}
                    max={100}
                    marks={[
                      { value: 10, label: '10GB' },
                      { value: 50, label: '50GB' },
                      { value: 100, label: '100GB' },
                    ]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Output Format</InputLabel>
                    <Select
                      value={settings.defaultOutputFormat}
                      label="Default Output Format"
                      onChange={handleChange('defaultOutputFormat')}
                    >
                      <MenuItem value="jsonl">JSONL</MenuItem>
                      <MenuItem value="parquet">Parquet</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoExport}
                        onChange={handleSwitchChange('autoExport')}
                      />
                    }
                    label="Auto-export after completion"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Settings