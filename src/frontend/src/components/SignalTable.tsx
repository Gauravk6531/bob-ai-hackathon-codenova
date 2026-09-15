import { useState, useMemo } from 'react'
import {
  Box,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Tooltip,
} from '@mui/material'
import type { Signal } from '../types'

interface Props {
  signals: Signal[]
  onSelectSignal?: (signal: Signal) => void
}

type Order = 'asc' | 'desc'
type SortKey = keyof Pick<Signal, 'adverse_event' | 'report_count' | 'prr' | 'chi_square' | 'signal_level'>

const SIGNAL_CHIP: Record<string, { label: string; color: 'error' | 'warning' | 'success' }> = {
  signal: { label: 'Signal', color: 'error' },
  weak_signal: { label: 'Weak Signal', color: 'warning' },
  no_signal: { label: 'No Signal', color: 'success' },
}

function descendingComparator<T>(a: T, b: T, key: keyof T) {
  if (b[key] < a[key]) return -1
  if (b[key] > a[key]) return 1
  return 0
}

export default function SignalTable({ signals, onSelectSignal }: Props) {
  const [order, setOrder] = useState<Order>('desc')
  const [orderBy, setOrderBy] = useState<SortKey>('prr')

  const handleSort = (key: SortKey) => {
    setOrder(orderBy === key && order === 'desc' ? 'asc' : 'desc')
    setOrderBy(key)
  }

  const sorted = useMemo(() => {
    const comparator = (a: Signal, b: Signal) =>
      order === 'desc'
        ? descendingComparator(a, b, orderBy)
        : -descendingComparator(a, b, orderBy)
    return [...signals].sort(comparator)
  }, [signals, order, orderBy])

  if (signals.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="body1">No signals found for this query.</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Try a different drug name or date range.
        </Typography>
      </Box>
    )
  }

  const col = (key: SortKey, label: string) => (
    <TableCell sortDirection={orderBy === key ? order : false}>
      <TableSortLabel
        active={orderBy === key}
        direction={orderBy === key ? order : 'asc'}
        onClick={() => handleSort(key)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  )

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
            <TableCell>#</TableCell>
            {col('adverse_event', 'Adverse Event')}
            {col('report_count', 'Reports')}
            {col('prr', 'PRR')}
            {col('chi_square', 'Chi²')}
            {col('signal_level', 'Signal Level')}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((s, i) => {
            const chip = SIGNAL_CHIP[s.signal_level] ?? SIGNAL_CHIP.no_signal
            return (
              <TableRow
                key={`${s.adverse_event}-${i}`}
                hover
                onClick={() => onSelectSignal?.(s)}
                sx={{ cursor: onSelectSignal ? 'pointer' : 'default' }}
              >
                <TableCell sx={{ color: 'text.secondary', width: 40 }}>{i + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                    {s.adverse_event}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {s.report_count}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Proportional Reporting Ratio — PRR ≥ 2 with ≥ 3 reports = signal">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={s.prr >= 2 ? 'error.main' : s.prr >= 1.5 ? 'warning.main' : 'text.primary'}
                    >
                      {s.prr.toFixed(2)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{s.chi_square.toFixed(2)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={chip.label} color={chip.color} size="small" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
