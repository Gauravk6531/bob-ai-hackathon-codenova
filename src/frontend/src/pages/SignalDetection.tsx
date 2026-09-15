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
  Divider,
  Tab,
  Tabs,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import BiotechIcon from '@mui/icons-material/Biotech'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useSignals } from '../hooks/useSignals'
import SignalTable from '../components/SignalTable'
import PRRChart from '../components/PRRChart'
import TrendChart from '../components/TrendChart'
import AIExplainer from '../components/AIExplainer'
import type { Signal } from '../types'

const EXAMPLE_DRUGS = ['aspirin', 'ibuprofen', 'metformin', 'warfarin', 'atorvastatin']

export default function SignalDetection() {
  const [drugName, setDrugName] = useState('')
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const { data, loading, error, fetch, reset } = useSignals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!drugName.trim()) return
    setSelectedSignal(null)
    await fetch({
      drug_name: drugName.trim(),
      start_year: startYear ? parseInt(startYear) : undefined,
      end_year: endYear ? parseInt(endYear) : undefined,
    })
  }

  const aiContext = data
    ? `Drug: ${data.drug_name}. Total FAERS reports: ${data.total_reports}. ` +
      `Top signals: ${data.signals
        .slice(0, 5)
        .map((s) => `${s.adverse_event} (PRR=${s.prr}, n=${s.report_count}, level=${s.signal_level})`)
        .join('; ')}.`
    : ''

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
        <strong>Important:</strong> Safety signals are statistical associations, NOT proof of causality.
        All findings require clinical expert review and further investigation before regulatory or clinical decisions.
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
                label="Drug Name"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g. aspirin, ibuprofen, warfarin"
                fullWidth
                required
                size="small"
                helperText="Enter the INN or brand name of the drug"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                label="Start Year"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                placeholder="2020"
                type="number"
                inputProps={{ min: 2000, max: 2024 }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                label="End Year"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                placeholder="2024"
                type="number"
                inputProps={{ min: 2000, max: 2024 }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                  disabled={loading || !drugName.trim()}
                  fullWidth
                >
                  {loading ? 'Analysing…' : 'Analyse'}
                </Button>
                {data && (
                  <Button variant="outlined" onClick={reset} size="small">
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
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Chip label={`Drug: ${data.drug_name}`} color="primary" />
            <Chip label={`${data.total_reports} total reports`} variant="outlined" />
            <Chip label={`${data.signals.filter((s) => s.signal_level === 'signal').length} signals`} color="error" variant="outlined" />
            <Chip label={`${data.signals.filter((s) => s.signal_level === 'weak_signal').length} weak signals`} color="warning" variant="outlined" />
          </Box>

          {data.signals.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No adverse event signals found for <strong>{data.drug_name}</strong> in the available data.
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
                      <SignalTable signals={data.signals} onSelectSignal={setSelectedSignal} />
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

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <AIExplainer mode="signals" context={aiContext} />
              </Grid>
            </Grid>
          )}
        </Box>
      )}
    </Box>
  )
}
