'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getAnnualTimeline, TimelinePoint } from '@/lib/calculator'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'

type WealthChartProps = {
  data: TimelinePoint[]
}

export function WealthChart({ data }: WealthChartProps) {
  const annualData = getAnnualTimeline(data)
    .map((point) => ({
      year: Number(point.year.toFixed(2)),
      Buying: Math.round(point.buyWealth),
      Renting: Math.round(point.rentWealth),
    }))

  return (
    <div className="chart" role="img" aria-label="Projected wealth comparison chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={annualData} margin={{ top: 8, right: 2, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9f27c" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#c9f27c" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#77c9c1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#77c9c1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.10)" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#9fb3ae', fontSize: 12 }}
            tickFormatter={(value) => `${value}y`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#9fb3ae', fontSize: 12 }}
            tickFormatter={formatCompactCurrency}
            width={66}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{
              background: '#173737',
              border: '1px solid rgba(255,255,255,.14)',
              borderRadius: 12,
              boxShadow: '0 16px 32px rgba(0,0,0,.22)',
            }}
            labelStyle={{ color: '#f4f0e7' }}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="Buying"
            stroke="#c9f27c"
            strokeWidth={2.5}
            fill="url(#buyGradient)"
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="Renting"
            stroke="#77c9c1"
            strokeWidth={2.5}
            fill="url(#rentGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
