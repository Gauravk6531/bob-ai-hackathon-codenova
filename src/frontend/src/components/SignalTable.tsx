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
  Collapse,
  IconButton,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Signal } from '../types'

interface Props {
  signals: Signal[]
  onSelectSignal?: (signal: Signal) => void
}

type Order = 'asc' | 'desc'
type SortKey = keyof Pick<
  Signal,
  'adverse_event' | 'report_count' | 'prr' | 'chi_square' | 'signal_level'
>

const SIGNAL_CHIP: Record<string, { label: string; color: 'error' | 'warning' | 'success' }> = {
  signal: { label: 'Potential Safety Signal', color: 'error' },
  weak_signal: { label: 'Weak / Emerging Potential Safety Signal', color: 'warning' },
  no_signal: { label: 'No Signal', color: 'success' },
}

function descendingComparator<T>(a: T, b: T, key: keyof T) {
  const aValue = a[key]
  const bValue = b[key]
  if (aValue == null) return 1
  if (bValue == null) return -1
  if (bValue < aValue) return -1
  if (bValue > aValue) return 1
  return 0
}

function pct(n: number) {
  return `${(n * 100).toFixed(2)}%`
}

/** Expandable row that shows contingency table + proportions on click */
function SignalRow({
  signal,
  rank,
  onSelect,
}: {
  signal: Signal
  rank: number
  onSelect?: (s: Signal) => void
}) {
  const [open, setOpen] = useState(false)
  const chip = SIGNAL_CHIP[signal.signal_level] ?? SIGNAL_CHIP.no_signal

  return (
    <>
      <TableRow
        hover
        onClick={() => onSelect?.(signal)}
        sx={{ cursor: onSelect ? 'pointer' : 'default', '& > *': { borderBottom: 'unset' } }}
      >
        {/* Expand toggle */}
        <TableCell sx={{ width: 36, p: 0 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            aria-label={open ? 'collapse row' : 'expand row'}
          >
            {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: 'text.secondary', width: 40 }}>{rank}</TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
            {signal.adverse_event}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Typography variant="body2" fontWeight={600}>
            {signal.report_count}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Tooltip
            title={
              'PRR = (a/(a+b)) / (c/(c+d)). Classification requires PRR > 2, ' +
              'Chi-square > 4, and unique report-count rules. ' +
              'These are application-configured criteria, not universal FDA thresholds, ' +
              'and are NOT proof of causality.'
            }
          >
            <Typography
              variant="body2"
              fontWeight={600}
              color={
                signal.signal_level === 'signal'
                  ? 'error.main'
                  : signal.signal_level === 'weak_signal'
                    ? 'warning.main'
                    : 'text.primary'
              }
            >
              {signal.prr === null ? 'N/A' : signal.prr.toFixed(2)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Typography variant="body2">{signal.chi_square.toFixed(2)}</Typography>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Drug-event proportion: a / (a+b)">
            <Typography variant="body2">{pct(signal.drug_event_proportion)}</Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Background proportion: c / (c+d)">
            <Typography variant="body2" color="text.secondary">
              {pct(signal.comparison_proportion)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Chip label={chip.label} color={chip.color} size="small" />
        </TableCell>
      </TableRow>

      {/* Expandable detail row — contingency table */}
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, bgcolor: 'grey.50' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                <InfoOutlinedIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                Contingency table — <strong>Statistical Association Only</strong>.
              </Typography>
              <Box
                sx={{
                  display: 'inline-grid',
                  gridTemplateColumns: 'auto auto auto',
                  gap: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  fontSize: 12,
                }}
              >
                {/* Header row */}
                <Box sx={{ p: '4px 10px', bgcolor: 'grey.100', fontWeight: 700, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }} />
                <Box sx={{ p: '4px 10px', bgcolor: 'grey.100', fontWeight: 700, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>Target event</Box>
                <Box sx={{ p: '4px 10px', bgcolor: 'grey.100', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>Other events</Box>
                {/* Drug row */}
                <Box sx={{ p: '4px 10px', fontWeight: 600, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>Target drug</Box>
                <Box sx={{ p: '4px 10px', color: 'primary.main', fontWeight: 700, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  a = {signal.a}
                </Box>
                <Box sx={{ p: '4px 10px', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>b = {signal.b}</Box>
                {/* Other-drug row */}
                <Box sx={{ p: '4px 10px', fontWeight: 600, borderRight: '1px solid', borderColor: 'divider' }}>Other drugs</Box>
                <Box sx={{ p: '4px 10px', borderRight: '1px solid', borderColor: 'divider', textAlign: 'center' }}>c = {signal.c}</Box>
                <Box sx={{ p: '4px 10px', textAlign: 'center' }}>d = {signal.d}</Box>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
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
          Try another drug name.
        </Typography>
      </Box>
    )
  }

  const col = (key: SortKey, label: string, align: 'left' | 'center' = 'center') => (
    <TableCell align={align} sortDirection={orderBy === key ? order : false}>
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
      <Table size="small" stickyHeader sx={{ minWidth: 920 }}>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
            <TableCell sx={{ width: 36 }} />
            <TableCell>#</TableCell>
            {col('adverse_event', 'Adverse Event', 'left')}
            {col('report_count', 'Target Event Reports (a)')}
            {col('prr', 'PRR')}
            {col('chi_square', 'Chi²')}
            <TableCell align="center">Drug %</TableCell>
            <TableCell align="center">Background %</TableCell>
            {col('signal_level', 'Signal Level', 'left')}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((s, i) => (
            <SignalRow
              key={`${s.adverse_event}-${i}`}
              signal={s}
              rank={i + 1}
              onSelect={onSelectSignal}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
