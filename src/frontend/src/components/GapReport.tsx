import { useState } from 'react'
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material'
import type { GapItem } from '../types'

interface Props {
  gaps: GapItem[]
}

const MODULE_ORDER = ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5']

const PRIORITY_CHIP: Record<string, { label: string; color: 'error' | 'warning' | 'default' }> = {
  high: { label: 'Required', color: 'error' },
  medium: { label: 'Recommended', color: 'warning' },
  low: { label: 'Optional', color: 'default' },
}

export default function GapReport({ gaps }: Props) {
  const [filterModule, setFilterModule] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const filtered = gaps.filter((g) => {
    if (filterModule !== 'all' && g.module !== filterModule) return false
    if (filterPriority !== 'all' && g.priority !== filterPriority) return false
    return true
  })

  const requiredCount = gaps.filter((g) => g.required).length

  if (gaps.length === 0) {
    return (
      <Alert severity="success" sx={{ borderRadius: 2 }}>
        All required CTD sections are present. The dossier meets the ICH CTD requirements.
      </Alert>
    )
  }

  return (
    <Box>
      {requiredCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <strong>{requiredCount} required section{requiredCount !== 1 ? 's' : ''}</strong> missing.
          Address high-priority gaps before submission.
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Module</InputLabel>
          <Select value={filterModule} label="Module" onChange={(e) => setFilterModule(e.target.value)}>
            <MenuItem value="all">All Modules</MenuItem>
            {MODULE_ORDER.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="high">Required</MenuItem>
            <MenuItem value="low">Optional</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {filtered.length} gap{filtered.length !== 1 ? 's' : ''} shown
        </Typography>
      </Box>

      <List dense sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {filtered.map((gap, i) => {
          const chip = PRIORITY_CHIP[gap.priority] ?? PRIORITY_CHIP.low
          return (
            <ListItem
              key={gap.section_id}
              divider={i < filtered.length - 1}
              sx={{ py: 1 }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 48, color: 'text.secondary' }}>
                      {gap.section_id}
                    </Typography>
                    <Typography variant="body2">{gap.title}</Typography>
                    <Chip label={chip.label} color={chip.color} size="small" />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {gap.module}
                  </Typography>
                }
              />
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}
