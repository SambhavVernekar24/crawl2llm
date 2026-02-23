import React from 'react'
import { Chip, CircularProgress } from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Timeline as RunningIcon,
} from '@mui/icons-material'

function StatusChip({ status, size = 'small' }) {
  const getStatusProps = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: 'success',
          icon: <CheckCircleIcon />,
        }
      case 'running':
        return {
          label: 'Running',
          color: 'info',
          icon: <RunningIcon />,
        }
      case 'failed':
        return {
          label: 'Failed',
          color: 'error',
          icon: <ErrorIcon />,
        }
      case 'pending':
        return {
          label: 'Pending',
          color: 'warning',
          icon: <PendingIcon />,
        }
      default:
        return {
          label: status,
          color: 'default',
        }
    }
  }

  const props = getStatusProps()

  return (
    <Chip
      size={size}
      label={props.label}
      color={props.color}
      icon={props.icon}
      variant="filled"
    />
  )
}

export default StatusChip