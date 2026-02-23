import React from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'

function ProgressBar({ value, total, showPercentage = true, height = 8 }) {
  const percentage = Math.min(100, Math.round((value / total) * 100))

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height,
            borderRadius: height / 2,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: height / 2,
            },
          }}
        />
      </Box>
      {showPercentage && (
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="textSecondary">
            {percentage}%
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ProgressBar