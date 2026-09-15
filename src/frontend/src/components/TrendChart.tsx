import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Box, Typography } from '@mui/material'
import type { TrendPoint } from '../types'

interface Props {
  trend: TrendPoint[]
  drugName: string
  aeName: string
}

export default function TrendChart({ trend, drugName, aeName }: Props) {
  if (trend.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Typography variant="body2">No trend data available for this signal.</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Report Trend — <strong style={{ textTransform: 'capitalize' }}>{drugName}</strong> /{' '}
        <strong style={{ textTransform: 'capitalize' }}>{aeName}</strong>
      </Typography>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={trend} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [value, 'Reports']}
            labelFormatter={(label) => `Quarter: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            name="Reports"
            stroke="#1565C0"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
