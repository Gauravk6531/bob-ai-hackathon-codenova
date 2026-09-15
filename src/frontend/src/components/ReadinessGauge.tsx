import { Box, Typography, LinearProgress, Grid, Paper, Tooltip } from '@mui/material'
import type { ModuleCompleteness } from '../types'

interface Props {
  overallPct: number
  moduleScores: ModuleCompleteness[]
}

function getColor(pct: number): string {
  if (pct >= 80) return '#2E7D32'
  if (pct >= 50) return '#F57C00'
  return '#C62828'
}

function CircularScore({ pct, label }: { pct: number; label: string }) {
  const color = getColor(pct)
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <Tooltip title={`${pct.toFixed(1)}% complete`}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ position: 'relative', width: 72, height: 72 }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
            />
          </svg>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color }}>
              {Math.round(pct)}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" align="center" sx={{ color: 'text.secondary', maxWidth: 80 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  )
}

export default function ReadinessGauge({ overallPct, moduleScores }: Props) {
  return (
    <Box>
      {/* Overall score */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
        <Box sx={{ position: 'relative', width: 100, height: 100 }}>
          {(() => {
            const r = 40
            const circ = 2 * Math.PI * r
            const dash = (overallPct / 100) * circ
            const color = getColor(overallPct)
            return (
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>
                  {Math.round(overallPct)}%
                </text>
              </svg>
            )
          })()}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Overall CTD Completeness
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Based on ICH CTD Modules 1–5 required sections
          </Typography>
          <LinearProgress
            variant="determinate"
            value={overallPct}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 4,
              width: 240,
              bgcolor: '#e5e7eb',
              '& .MuiLinearProgress-bar': { bgcolor: getColor(overallPct), borderRadius: 4 },
            }}
          />
        </Box>
      </Box>

      {/* Per-module scores */}
      <Grid container spacing={2}>
        {moduleScores.map((m) => (
          <Grid item xs={6} sm={4} md={2.4} key={m.module}>
            <Paper
              variant="outlined"
              sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}
            >
              <CircularScore pct={m.completeness_pct} label={m.module} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {m.matched}/{m.total_required} sections
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
