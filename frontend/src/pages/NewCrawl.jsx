import React, { useState } from 'react'
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Slider,
  Box,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const steps = ['Configure URLs', 'Set Parameters', 'Review & Start']

function NewCrawl() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    seed_urls: [''],
    max_depth: 3,
    max_pages: 100,
    respect_robots: true,
    output_format: 'jsonl',
    enable_deduplication: true,
    chunk_size: 512,
    chunk_overlap: 50,
    enable_legal_check: true,
    privacy_filter: true,
    topic_classification: true,
    trust_score: true,
    render_javascript: false,
    same_domain_only: true,
  })

  const handleUrlChange = (index, value) => {
    const newUrls = [...formData.seed_urls]
    newUrls[index] = value
    setFormData({ ...formData, seed_urls: newUrls })
  }

  const addUrlField = () => {
    setFormData({
      ...formData,
      seed_urls: [...formData.seed_urls, '']
    })
  }

  const removeUrlField = (index) => {
    if (formData.seed_urls.length > 1) {
      const newUrls = formData.seed_urls.filter((_, i) => i !== index)
      setFormData({ ...formData, seed_urls: newUrls })
    }
  }

  const validateUrls = () => {
    const validUrls = formData.seed_urls.filter(url => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })
    return validUrls.length > 0
  }

  const handleNext = () => {
    if (activeStep === 0 && !validateUrls()) {
      setError('Please enter at least one valid URL')
      return
    }
    setError(null)
    
    if (activeStep === steps.length - 1) {
      handleSubmit()
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Filter out empty URLs
      const urls = formData.seed_urls.filter(url => url.trim() !== '')
      
      if (urls.length === 0) {
        throw new Error('At least one valid URL is required')
      }
      
      const response = await api.startCrawl({
        ...formData,
        seed_urls: urls,
      })
      
      navigate(`/jobs/${response.job_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                Enter seed URLs to start crawling from
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                These are the starting points for your crawl. The crawler will follow links from these URLs.
              </Typography>
            </Grid>
            {formData.seed_urls.map((url, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label={`URL ${index + 1}`}
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://example.com"
                    variant="outlined"
                    error={!!url && !url.match(/^https?:\/\/.+/)}
                    helperText={url && !url.match(/^https?:\/\/.+/) ? 'Must start with http:// or https://' : ''}
                  />
                  {formData.seed_urls.length > 1 && (
                    <IconButton 
                      color="error" 
                      onClick={() => removeUrlField(index)}
                      sx={{ alignSelf: 'center' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addUrlField}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Another URL
              </Button>
            </Grid>
          </Grid>
        )
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                Crawl Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Crawl Depth: <strong>{formData.max_depth}</strong>
              </Typography>
              <Slider
                value={formData.max_depth}
                onChange={(_, value) => setFormData({ ...formData, max_depth: value })}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="textSecondary">
                Number of links to follow from the seed URL
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Max Pages: <strong>{formData.max_pages}</strong>
              </Typography>
              <Slider
                value={formData.max_pages}
                onChange={(_, value) => setFormData({ ...formData, max_pages: value })}
                min={10}
                max={1000}
                step={10}
                marks={[
                  { value: 100, label: '100' },
                  { value: 500, label: '500' },
                  { value: 1000, label: '1000' },
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="textSecondary">
                Maximum number of pages to crawl
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                Output Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Output Format</InputLabel>
                <Select
                  value={formData.output_format}
                  label="Output Format"
                  onChange={(e) => setFormData({ ...formData, output_format: e.target.value })}
                >
                  <MenuItem value="jsonl">JSONL (LLM Training)</MenuItem>
                  <MenuItem value="parquet">Parquet (Analytics)</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="langchain">LangChain Documents</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Chunk Size</InputLabel>
                <Select
                  value={formData.chunk_size}
                  label="Chunk Size"
                  onChange={(e) => setFormData({ ...formData, chunk_size: e.target.value })}
                >
                  <MenuItem value={256}>256 tokens (Small - Fine-tuning)</MenuItem>
                  <MenuItem value={512}>512 tokens (Medium - RAG)</MenuItem>
                  <MenuItem value={1024}>1024 tokens (Large - Context)</MenuItem>
                  <MenuItem value={2048}>2048 tokens (XL - Documents)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                Processing Options
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enable_deduplication}
                    onChange={(e) => setFormData({ ...formData, enable_deduplication: e.target.checked })}
                  />
                }
                label="Enable Deduplication"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                Remove near-duplicate content using embeddings
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.topic_classification}
                    onChange={(e) => setFormData({ ...formData, topic_classification: e.target.checked })}
                  />
                }
                label="Topic Classification"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                Auto-tag content by topic
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.trust_score}
                    onChange={(e) => setFormData({ ...formData, trust_score: e.target.checked })}
                  />
                }
                label="Calculate Trust Score"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                Score content based on quality signals
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.privacy_filter}
                    onChange={(e) => setFormData({ ...formData, privacy_filter: e.target.checked })}
                  />
                }
                label="Privacy Filter"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                Redact PII (emails, phones, SSNs)
              </Typography>
            </Grid>
          </Grid>
        )
      
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" />
                    Configuration Summary
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Seed URLs
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {formData.seed_urls.filter(u => u).map((url, i) => {
                          try {
                            const hostname = new URL(url).hostname
                            return (
                              <Chip 
                                key={i} 
                                label={hostname} 
                                variant="outlined"
                                size="small"
                              />
                            )
                          } catch {
                            return (
                              <Chip 
                                key={i} 
                                label={url} 
                                variant="outlined"
                                size="small"
                                color="warning"
                              />
                            )
                          }
                        })}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Max Depth
                      </Typography>
                      <Typography variant="h6">
                        {formData.max_depth}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Max Pages
                      </Typography>
                      <Typography variant="h6">
                        {formData.max_pages}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Output Format
                      </Typography>
                      <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>
                        {formData.output_format}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Chunk Size
                      </Typography>
                      <Typography variant="h6">
                        {formData.chunk_size} tokens
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Features Enabled
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {formData.enable_deduplication && (
                          <Chip label="Deduplication" color="primary" size="small" />
                        )}
                        {formData.topic_classification && (
                          <Chip label="Topic Classification" color="primary" size="small" />
                        )}
                        {formData.trust_score && (
                          <Chip label="Trust Score" color="primary" size="small" />
                        )}
                        {formData.privacy_filter && (
                          <Chip label="Privacy Filter" color="primary" size="small" />
                        )}
                        {formData.respect_robots && (
                          <Chip label="Respect robots.txt" color="primary" size="small" />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" icon={<AnalyticsIcon />}>
                <Typography variant="subtitle2">Estimated Processing</Typography>
                <Typography variant="body2">
                  Based on your settings, this crawl will process approximately{' '}
                  <strong>{formData.max_pages * 5}</strong> chunks and generate{' '}
                  <strong>~{(formData.max_pages * 0.5).toFixed(1)} MB</strong> of data.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )
      
      default:
        return 'Unknown step'
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        New Crawl Job
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ my: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2, minHeight: 400 }}>
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              onClick={() => navigate('/')}
              variant="text"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              startIcon={activeStep === steps.length - 1 ? <PlayIcon /> : null}
              sx={{
                background: activeStep === steps.length - 1 
                  ? 'linear-gradient(45deg, #00bcd4 30%, #2196f3 90%)'
                  : undefined,
              }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                'Start Crawl'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default NewCrawl