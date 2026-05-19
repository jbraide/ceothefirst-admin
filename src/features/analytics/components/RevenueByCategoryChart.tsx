import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getRevenueByCategory } from '../api/getRevenueByCategory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { naira, CHART_COLORS } from '../utils'
import RangeSelector from './RangeSelector'
import type { AnalyticsRange } from '@/types/api'

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: { category: string; total: number; percentage: number } }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-gray-900">{d.category}</p>
      <p className="text-xs text-gray-500">
        {naira.format(d.total)} &middot; {d.percentage.toFixed(1)}%
      </p>
    </div>
  )
}

export default function RevenueByCategoryChart() {
  const [range, setRange] = useState<AnalyticsRange>('30d')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['revenue-by-category', range],
    queryFn: () => getRevenueByCategory({ range }),
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue by Category</CardTitle>
          <RangeSelector value={range} onChange={setRange} />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue by Category</CardTitle>
          <RangeSelector value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Failed to load revenue by category data.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue by Category</CardTitle>
          <RangeSelector value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-gray-500">
            No revenue data available for this period.
          </p>
        </CardContent>
      </Card>
    )
  }

  const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 10)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Revenue by Category</CardTitle>
        <RangeSelector value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                }
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 12, fill: '#334155' }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {sorted.map((entry, idx) => (
                  <Cell
                    key={entry.category}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
