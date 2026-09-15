import { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Collapse,
  Chip,
  Divider,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { getAIExplanation } from '../services/apiClient'
import type { AIExplainResponse } from '../types'

interface Props {
  mode: 'signals' | 'readiness'
  context: string
  disabled?: boolean
}

export default function AIExplainer({ mode, context, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIExplainResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async () => {
    if (result) {
      setOpen((v) => !v)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getAIExplanation({ mode, context })
      setResult(data)
      setOpen(true)
    } catch {
      setError('Failed to get AI explanation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: 'primary.light',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: 'primary.50',
          cursor: disabled ? 'default' : 'pointer',
        }}
        onClick={disabled ? undefined : handleFetch}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={600} color="primary.main">
            AI Explanation (IBM watsonx.ai — Granite)
          </Typography>
          {result && (
            <Chip
              label={result.source === 'watsonx' ? 'watsonx.ai' : 'Fallback'}
              size="small"
              color={result.source === 'watsonx' ? 'primary' : 'default'}
              sx={{ fontSize: 10 }}
            />
          )}
        </Box>
        {loading ? (
          <CircularProgress size={18} />
        ) : (
          <Button
            size="small"
            variant="text"
            disabled={disabled}
            endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={(e) => { e.stopPropagation(); handleFetch() }}
          >
            {result ? (open ? 'Collapse' : 'Expand') : 'Explain'}
          </Button>
        )}
      </Box>

      {/* Disclaimer — always visible */}
      <Box sx={{ px: 2, py: 1, bgcolor: '#fff8e1', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <WarningAmberIcon sx={{ color: '#F57C00', fontSize: 16, mt: 0.2 }} />
        <Typography variant="caption" color="text.secondary">
          <strong>Safety signals are NOT proof of causality.</strong> All signals require clinical expert review and further investigation before regulatory or clinical decisions.
        </Typography>
      </Box>

      {/* Explanation body */}
      <Collapse in={open}>
        <Divider />
        <Box sx={{ px: 2, py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          {result && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {result.explanation}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}
