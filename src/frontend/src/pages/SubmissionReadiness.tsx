import { useState, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useReadiness } from '../hooks/useReadiness'
import ReadinessGauge from '../components/ReadinessGauge'
import GapReport from '../components/GapReport'
import AIExplainer from '../components/AIExplainer'

export default function SubmissionReadiness() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data, loading, error, check, reset } = useReadiness()

  const handleFile = (file: File) => {
    const allowed = ['.txt', '.pdf']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext)) {
      alert('Only .txt and .pdf files are supported.')
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    await check(selectedFile)
  }

  const handleReset = () => {
    setSelectedFile(null)
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const aiContext = data
    ? `File: ${data.filename}. Overall CTD completeness: ${data.overall_completeness_pct}%. ` +
      data.module_scores
        .map((m) => `${m.module}: ${m.completeness_pct}% (${m.matched}/${m.total_required})`)
        .join('; ') +
      `. High-priority gaps: ${data.gaps
        .filter((g) => g.required)
        .slice(0, 5)
        .map((g) => g.title)
        .join(', ')}.`
    : ''

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AssignmentTurnedInIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Submission Readiness
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ICH CTD Modules 1–5 · Dossier gap analysis
          </Typography>
        </Box>
        <Chip label="Mode 2" color="secondary" sx={{ ml: 'auto' }} />
      </Box>

      {/* Upload area */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Upload Regulatory Dossier
        </Typography>

        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : selectedFile ? 'success.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragOver ? 'primary.50' : selectedFile ? 'success.50' : 'grey.50',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          {selectedFile ? (
            <Box>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="body1" fontWeight={600} color="success.main">
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(selectedFile.size / 1024).toFixed(1)} KB · Ready to analyse
              </Typography>
            </Box>
          ) : (
            <Box>
              <UploadFileIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body1" fontWeight={600} color="text.secondary">
                Drag &amp; drop your dossier here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                or click to browse · Supports .txt and .pdf · Max 50 MB
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AssignmentTurnedInIcon />}
            disabled={!selectedFile || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Analysing…' : 'Check Readiness'}
          </Button>
          {(selectedFile || data) && (
            <Button variant="outlined" onClick={handleReset}>
              Reset
            </Button>
          )}
        </Box>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress color="secondary" sx={{ borderRadius: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Extracting headings and checking against ICH CTD requirements…
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Results */}
      {data && !loading && (
        <Box>
          {/* Summary chips */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Chip label={`File: ${data.filename}`} color="secondary" />
            <Chip
              label={`${data.overall_completeness_pct}% overall completeness`}
              color={data.overall_completeness_pct >= 80 ? 'success' : data.overall_completeness_pct >= 50 ? 'warning' : 'error'}
            />
            <Chip label={`${data.matched_sections.length} sections matched`} variant="outlined" />
            <Chip
              label={`${data.gaps.filter((g) => g.required).length} required gaps`}
              color="error"
              variant="outlined"
            />
          </Box>

          {/* Readiness Gauge */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Module Completeness
            </Typography>
            <ReadinessGauge
              overallPct={data.overall_completeness_pct}
              moduleScores={data.module_scores}
            />
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Gap Report */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Gap Report
            </Typography>
            <GapReport gaps={data.gaps} />
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* AI Explainer */}
          <AIExplainer mode="readiness" context={aiContext} />
        </Box>
      )}
    </Box>
  )
}
