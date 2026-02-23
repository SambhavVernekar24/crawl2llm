import React, { useState, useEffect } from 'react'
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import {
  AreaChart,
  Area,
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
import { useQuery } from '@tanstack/react-query'
import { formatDistance } from 'date-fns'
import api from '../services/api'

const COLORS = ['#00bcd4', '#ff4081', '#4caf50', '#ffc107', '#9c27b0']

function Dashboard() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalPages: 0,
    successRate: 0,
    storageUsed: '0 GB',
  })

  const { data: jobsData, isLoading, error, refetch } = useQuery({
    queryKey: ['recentJobs'],
    queryFn: () => api.getJobs(0, 10),
    refetchInterval: 5000,
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'running':
        return 'info'
      case 'failed':
        return 'error'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />
      case 'running':
        return <TimelineIcon fontSize="small" />
      case 'failed':
        return <ErrorIcon fontSize="small" />
      default:
        return null
    }
  }

  const handleStopJob = async (jobId) => {
    try {
      await api.stopJob(jobId)
      refetch()
    } catch (error) {
      console.error('Failed to stop job:', error)
    }
  }

  const handleDownload = async (jobId) => {
    try {
      await api.downloadDataset(jobId)
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  // Sample chart data - replace with real data from API
  const activityData = [
    { name: 'Mon', jobs: 4 },
    { name: 'Tue', jobs: 3 },
    { name: 'Wed', jobs: 7 },
    { name: 'Thu', jobs: 5 },
    { name: 'Fri', jobs: 6 },
    { name: 'Sat', jobs: 2 },
    { name: 'Sun', jobs: 1 },
  ]

  const topicData = [
    { name: 'Technology', value: 45 },
    { name: 'Business', value: 25 },
    { name: 'Science', value: 15 },
    { name: 'Health', value: 10 },
    { name: 'Other', value: 5 },
  ]

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading dashboard data: {error.message}
      </Alert>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            href="/new-crawl"
            sx={{
              background: 'linear-gradient(45deg, #00bcd4 30%, #2196f3 90%)',
              boxShadow: '0 3px 5px 2px rgba(0, 188, 212, .3)',
            }}
          >
            New Crawl
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Total Jobs
                </Typography>
              </Box>
              {isLoading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h3" component="div" sx={{ fontWeight: 600 }}>
                  {jobsData?.length || 0}
                </Typography>
              )}
              <Typography color="textSecondary" variant="caption">
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Pages Crawled
                </Typography>
              </Box>
              {isLoading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h3" component="div" sx={{ fontWeight: 600 }}>
                  {jobsData?.reduce((acc, job) => acc + (job.pages_crawled || 0), 0) || 0}
                </Typography>
              )}
              <Typography color="textSecondary" variant="caption">
                Total across all jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Success Rate
                </Typography>
              </Box>
              {isLoading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h3" component="div" sx={{ fontWeight: 600 }}>
                  {Math.round((jobsData?.filter(j => j.status === 'completed').length / 
                    (jobsData?.length || 1)) * 100)}%
                </Typography>
              )}
              <Typography color="textSecondary" variant="caption">
                Completed vs total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Storage Used
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 600 }}>
                2.3 GB
              </Typography>
              <Typography color="textSecondary" variant="caption">
                Of 10 GB allocated
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Crawl Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00bcd4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', border: 'none' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="jobs" 
                  stroke="#00bcd4" 
                  fillOpacity={1} 
                  fill="url(#colorJobs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Content Topics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topicData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Jobs Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Crawl Jobs
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job ID</TableCell>
                    <TableCell>Seed URLs</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pages</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <LinearProgress />
                      </TableCell>
                    </TableRow>
                  ) : jobsData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary" sx={{ py: 4 }}>
                          No jobs yet. Start your first crawl!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobsData?.map((job) => (
                      <TableRow key={job.job_id} hover>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                            }}
                          >
                            {job.job_id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {job.seed_urls?.slice(0, 2).map((url, i) => (
                              <Chip
                                key={i}
                                label={new URL(url).hostname}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {job.seed_urls?.length > 2 && (
                              <Chip
                                label={`+${job.seed_urls.length - 2}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={job.status}
                            color={getStatusColor(job.status)}
                            size="small"
                            icon={getStatusIcon(job.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {job.pages_crawled || 0} / {job.total_pages || 100}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={((job.pages_crawled || 0) / (job.total_pages || 100)) * 100}
                            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDistance(new Date(job.created_at), new Date(), { addSuffix: true })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              href={`/jobs/${job.job_id}`}
                              sx={{ mr: 0.5 }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {job.status === 'running' && (
                            <Tooltip title="Stop Job">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleStopJob(job.job_id)}
                                sx={{ mr: 0.5 }}
                              >
                                <StopIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {job.status === 'completed' && (
                            <Tooltip title="Download Dataset">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownload(job.job_id)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard