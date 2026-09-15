import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { Box, Typography } from '@mui/material'
import type { Signal } from '../types'

interface Props {
  signals: Signal[]
  topN?: number
}

const SIGNAL_COLORS: Record<string, string> = {
  signal: '#C62828',
  weak_signal: '#F57C00',
  no_signal: '#78909C',
}

export default function PRRChart({ signals, topN = 15 }: Props) {
  const data = signals
    .filter((s) => s.prr !== null)
    .sort((a, b) => (b.prr ?? -Infinity) - (a.prr ?? -Infinity))
    .slice(0, topN)
    .map((s) => ({
      name: s.adverse_event.length > 20 ? s.adverse_event.slice(0, 20) + '…' : s.adverse_event,
      prr: s.prr,
      level: s.signal_level,
    }))

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Typography variant="body2">No PRR data to display.</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Top {data.length} adverse events by PRR · signal criterion PRR &gt; 2
      </Typography>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 28)}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 32, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, _name: string, item) => [
              `${value.toFixed(2)} · ${item.payload.level.replace('_', ' ')}`,
              'PRR',
            ]}
            labelStyle={{ fontWeight: 600 }}
          />
          <ReferenceLine x={2} stroke="#C62828" strokeDasharray="4 2" label={{ value: 'PRR > 2', position: 'top', fontSize: 10, fill: '#C62828' }} />
          <Bar dataKey="prr" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={SIGNAL_COLORS[entry.level] ?? '#546E7A'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
