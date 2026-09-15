import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Tab,
  Tabs,
  Tooltip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import BiotechIcon from '@mui/icons-material/Biotech'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useSignals } from '../hooks/useSignals'
import SignalTable from '../components/SignalTable'
import PRRChart from '../components/PRRChart'
import TrendChart from '../components/TrendChart'
import type { Signal } from '../types'

const EXAMPLE_DRUGS = ['aspirin', 'ibuprofen', 'metformin', 'warfarin', 'atorvastatin']

export default function SignalDetection() {
  const [drugName, setDrugName] = useState('')
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const { data, loading, error, fetch, reset } = useSignals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!drugName.trim()) return
    setSelectedSignal(null)
    await fetch({
      drug_name: drugName.trim(),
    })
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BiotechIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Signal Detection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            FAERS adverse event data · PRR-based pharmacovigilance analysis
          </Typography>
        </Box>
        <Chip label="Mode 1" color="primary" sx={{ ml: 'auto' }} />
      </Box>

      {/* Causality disclaimer */}
      <Alert
        severity="warning"
        icon={<WarningAmberIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        <strong>Important:</strong> Safety signals are statistical associations,{' '}
        <strong>NOT proof of causality</strong>. A detected signal is a{' '}
        <strong>Potential Safety Signal</strong> only — not a confirmed adverse reaction and
        not proof that the drug caused the event. All findings require clinical expert review
        and further investigation before regulatory or clinical decisions.
      </Alert>

      {/* Search Form */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Search Parameters
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={5}>
              <TextField
                label="Drug Name *"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g. aspirin, ibuprofen, warfarin"
                fullWidth
                required
                size="small"
                helperText="Enter the INN or brand name of the drug"
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <Box className="module-action-row">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />
                  }
                  disabled={loading || !drugName.trim()}
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  {loading ? 'Analysing…' : 'Analyse'}
                </Button>
                {data && (
                  <Button variant="outlined" onClick={reset} sx={{ minWidth: 82 }}>
                    Clear
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Example drugs */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Try:
          </Typography>
          {EXAMPLE_DRUGS.map((d) => (
            <Chip
              key={d}
              label={d}
              size="small"
              variant="outlined"
              onClick={() => setDrugName(d)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Paper>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
          <CircularProgress size={48} />
          <Typography color="text.secondary">
            Fetching FAERS data and computing PRR signals…
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Results */}
      {data && !loading && (
        <Box>
          {/* Summary stats */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip label={`Drug: ${data.drug_name}`} color="primary" />
            <Chip label={`${data.total_reports} total reports`} variant="outlined" />
            <Chip
              label={`${data.signals.filter((s) => s.signal_level === 'signal').length} Potential Safety Signals`}
              color="error"
              variant="outlined"
            />
            <Chip
              label={`${data.signals.filter((s) => s.signal_level === 'weak_signal').length} Weak / Emerging Potential Safety Signals`}
              color="warning"
              variant="outlined"
            />
            <Tooltip
              title={
                'Downloaded processed FDA FAERS dataset; counts use unique report IDs'
              }
            >
              <Chip
                label="FDA FAERS dataset"
                color="success"
                variant="outlined"
                size="small"
              />
            </Tooltip>
          </Box>

          {data.signals.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No adverse event signals found for <strong>{data.drug_name}</strong> in the
              selected year range. The downloaded FAERS dataset may contain no reports for
              this drug in that period.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {/* Tabs: Table / PRR Chart */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                  <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
                  >
                    <Tab label="Signal Table" />
                    <Tab label="PRR Chart" />
                  </Tabs>
                  <Box sx={{ p: 2 }}>
                    {activeTab === 0 && (
                      <SignalTable
                        signals={data.signals}
                        onSelectSignal={setSelectedSignal}
                      />
                    )}
                    {activeTab === 1 && <PRRChart signals={data.signals} />}
                  </Box>
                </Paper>
              </Grid>

              {/* Trend chart for selected signal */}
              {selectedSignal && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      Report Trend
                    </Typography>
                    <TrendChart
                      trend={selectedSignal.trend}
                      drugName={selectedSignal.drug}
                      aeName={selectedSignal.adverse_event}
                    />
                  </Paper>
                </Grid>
              )}

              {!selectedSignal && (
                <Grid item xs={12}>
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    Click a row in the Signal Table to view its quarterly report trend.
                  </Alert>
                </Grid>
              )}

            </Grid>
          )}
        </Box>
      )}
    </Box>
  )
}
