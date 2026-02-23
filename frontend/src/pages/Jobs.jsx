import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDistance } from 'date-fns'
import api from '../services/api'

function Jobs() {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', page, rowsPerPage],
    queryFn: () => api.getJobs(page * rowsPerPage, rowsPerPage),
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs'])
    },
  })

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(jobId)
    }
  }

  const handleDownload = async (jobId) => {
    try {
      await api.downloadDataset(jobId)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'running': return 'info'
      case 'failed': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.seed_urls.some(url => url.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading jobs: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Crawl Jobs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search jobs..."
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
          <Tooltip title="Filter">
            <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => { setStatusFilter('all'); setFilterAnchorEl(null); }}>
          All Jobs
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('running'); setFilterAnchorEl(null); }}>
          Running
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('completed'); setFilterAnchorEl(null); }}>
          Completed
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('failed'); setFilterAnchorEl(null); }}>
          Failed
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('pending'); setFilterAnchorEl(null); }}>
          Pending
        </MenuItem>
      </Menu>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job ID</TableCell>
                <TableCell>Seed URLs</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pages</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : filteredJobs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" sx={{ py: 4 }}>
                      No jobs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs?.map((job) => (
                  <TableRow key={job.job_id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
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
                      />
                    </TableCell>
                    <TableCell>
                      {job.pages_crawled || 0} / {job.total_pages || 100}
                    </TableCell>
                    <TableCell>
                      {formatDistance(new Date(job.created_at), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {job.completed_at ? 
                        formatDistance(new Date(job.completed_at), new Date(job.created_at)) : 
                        '-'
                      }
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/jobs/${job.job_id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {job.status === 'completed' && (
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownload(job.job_id)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(job.job_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={jobs?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  )
}

export default Jobs