import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', error.response?.data || error.message)
    }
    return Promise.reject(error)
  }
)

// Job management
export const startCrawl = async (config) => {
  try {
    const response = await api.post('/crawl', config)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to start crawl')
  }
}

export const getJobs = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get(`/jobs?skip=${skip}&limit=${limit}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch jobs')
  }
}

export const getJob = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch job details')
  }
}

export const getJobStats = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}/stats`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch job stats')
  }
}

export const getJobData = async (jobId, skip = 0, limit = 100) => {
  try {
    const response = await api.get(`/jobs/${jobId}/data?skip=${skip}&limit=${limit}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch job data')
  }
}

export const stopJob = async (jobId) => {
  try {
    const response = await api.post(`/jobs/${jobId}/stop`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to stop job')
  }
}

export const deleteJob = async (jobId) => {
  try {
    const response = await api.delete(`/jobs/${jobId}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to delete job')
  }
}

export const downloadDataset = async (jobId, format = 'jsonl') => {
  try {
    const response = await api.get(`/jobs/${jobId}/download/${format}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crawl_${jobId}.${format}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to download dataset')
  }
}

export default {
  startCrawl,
  getJobs,
  getJob,
  getJobStats,
  getJobData,
  stopJob,
  deleteJob,
  downloadDataset,
}