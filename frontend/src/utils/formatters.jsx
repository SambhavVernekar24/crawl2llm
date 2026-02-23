/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format milliseconds to human readable duration
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export const formatDuration = (ms) => {
  if (!ms) return '0s'
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A'
  
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now - then) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(date)
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
export const extractDomain = (url) => {
  if (!url) return ''
  
  try {
    const { hostname } = new URL(url)
    return hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * Get color for status
 * @param {string} status - Job status
 * @returns {string} MUI color name
 */
export const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    running: 'info',
    failed: 'error',
    pending: 'warning',
    stopped: 'default',
    cancelled: 'default',
  }
  return colors[status?.toLowerCase()] || 'default'
}

/**
 * Get icon emoji for status
 * @param {string} status - Job status
 * @returns {string} Emoji icon
 */
export const getStatusIcon = (status) => {
  const icons = {
    completed: '✅',
    running: '🔄',
    failed: '❌',
    pending: '⏳',
    stopped: '🛑',
    cancelled: '🚫',
  }
  return icons[status?.toLowerCase()] || '📝'
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total) return '0%'
  const percentage = (value / total) * 100
  return percentage.toFixed(decimals) + '%'
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  return formatBytes(bytes)
}

/**
 * Format chunk size for display
 * @param {number} tokens - Number of tokens
 * @returns {string} Formatted chunk size
 */
export const formatChunkSize = (tokens) => {
  if (tokens < 1000) return `${tokens} tokens`
  return `${(tokens / 1000).toFixed(1)}k tokens`
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Parse error message from API response
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
export const parseApiError = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'An unknown error occurred'
}

export default {
  formatBytes,
  formatDuration,
  formatDate,
  formatRelativeTime,
  truncateText,
  extractDomain,
  getStatusColor,
  getStatusIcon,
  formatNumber,
  formatPercentage,
  capitalize,
  formatFileSize,
  formatChunkSize,
  isValidUrl,
  parseApiError,
}