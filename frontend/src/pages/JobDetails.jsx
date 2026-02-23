import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistance } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import api from '../services/api'

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function JobDetails() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [dataPage, setDataPage] = useState(0)

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.getJob(jobId),
    refetchInterval: (data) => data?.status === 'running' ? 2000 : false,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['jobStats', jobId],
    queryFn: () => api.getJobStats(jobId),
    enabled: !!job && job.status === 'completed',
  })

  const { data: extractedData, isLoading: dataLoading } = useQuery({
    queryKey: ['jobData', jobId, dataPage],
    queryFn: () => api.getJobData(jobId, dataPage * 20, 20),
    enabled: !!job && job.status === 'completed',
  })

  const stopMutation = useMutation({
    mutationFn: api.stopJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['job', jobId])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteJob,
    onSuccess: () => {
      navigate('/jobs')
    },
  })

  const handleStop = async () => {
    if (window.confirm('Are you sure you want to stop this job?')) {
      stopMutation.mutate(jobId)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(jobId)
    }
  }

  const handleDownload = async (format = 'jsonl') => {
    try {
      await api.downloadDataset(jobId, format)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 48 }} />
      case 'running':
        return <TimelineIcon sx={{ color: 'info.main', fontSize: 48 }} />
      case 'failed':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 48 }} />
      case 'pending':
        return <PendingIcon sx={{ color: 'warning.main', fontSize: 48 }} />
      default:
        return null
    }
  }

  if (jobLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    )
  }

  if (jobError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading job: {jobError.message}
      </Alert>
    )
  }

  if (!job) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Job not found
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/jobs')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600, flex: 1 }}>
          Job Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {job.status === 'running' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStop}
            >
              Stop
            </Button>
          )}
          {job.status === 'completed' && (
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('jsonl')}
              >
                JSONL
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('parquet')}
              >
                Parquet
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Status Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
            {getStatusIcon(job.status)}
            <Typography variant="h6" sx={{ mt: 1, textTransform: 'capitalize' }}>
              {job.status}
            </Typography>
          </Grid>
          <Grid item xs={12} md={10}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography color="textSecondary" variant="body2">
                  Job ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {job.job_id}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography color="textSecondary" variant="body2">
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(job.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography color="textSecondary" variant="body2">
                  Pages Crawled
                </Typography>
                <Typography variant="body1">
                  {job.pages_crawled || 0} / {job.total_pages || 100}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography color="textSecondary" variant="body2">
                  Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={((job.pages_crawled || 0) / (job.total_pages || 100)) * 100}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="textSecondary">
                      {Math.round(((job.pages_crawled || 0) / (job.total_pages || 100)) * 100)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Extracted Data" />
          <Tab label="Configuration" />
          <Tab label="Logs" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {stats && (
              <>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Statistics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">Pages Processed</Typography>
                          <Typography variant="h5">{stats.pages_processed}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">Chunks Created</Typography>
                          <Typography variant="h5">{stats.chunks_created}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">Unique Content</Typography>
                          <Typography variant="h5">{stats.unique_content_percentage}%</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">Avg Trust Score</Typography>
                          <Typography variant="h5">{stats.avg_trust_score}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Topics Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={Object.entries(stats.topics_distribution).map(([name, value]) => ({
                              name,
                              value,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {Object.entries(stats.topics_distribution).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Extracted Data Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search in extracted data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source URL</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Topic</TableCell>
                  <TableCell>Trust Score</TableCell>
                  <TableCell>Words</TableCell>
                  <TableCell>Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : extractedData?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data extracted yet
                    </TableCell>
                  </TableRow>
                ) : (
                  extractedData
                    ?.filter(item => 
                      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.title.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Tooltip title={item.source_url}>
                            <Typography variant="body2" sx={{ maxWidth: 200, truncate: true }}>
                              {new URL(item.source_url).pathname}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{item.title.substring(0, 50)}...</TableCell>
                        <TableCell>
                          <Chip label={item.topic} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.trust_score}
                            color={item.trust_score > 0.7 ? 'success' : item.trust_score > 0.4 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{item.word_count}</TableCell>
                        <TableCell>
                          <Tooltip title={item.text.substring(0, 200)}>
                            <Typography variant="body2">
                              {item.text.substring(0, 50)}...
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Configuration Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Seed URLs
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {job.seed_urls?.map((url, i) => (
                  <Chip key={i} label={url} variant="outlined" />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Max Depth
              </Typography>
              <Typography variant="body1">{job.config?.max_depth}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Max Pages
              </Typography>
              <Typography variant="body1">{job.config?.max_pages}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Output Format
              </Typography>
              <Typography variant="body1">{job.config?.output_format}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Chunk Size
              </Typography>
              <Typography variant="body1">{job.config?.chunk_size} tokens</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Features
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {job.config?.enable_deduplication && (
                  <Chip label="Deduplication" color="primary" size="small" />
                )}
                {job.config?.topic_classification && (
                  <Chip label="Topic Classification" color="primary" size="small" />
                )}
                {job.config?.privacy_filter && (
                  <Chip label="Privacy Filter" color="primary" size="small" />
                )}
                {job.config?.respect_robots && (
                  <Chip label="Respect robots.txt" color="primary" size="small" />
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Logs Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography color="textSecondary">
            Logs will be displayed here...
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default JobDetails