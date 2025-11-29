import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

import { type DashboardMonthlySales } from '@dashboard/hooks/use-dashboard-metrics'

type OverviewProps = {
  data: DashboardMonthlySales[]
  formatTick: (value: number) => string
}

export function Overview({ data, formatTick }: OverviewProps) {
  if (!data.length) {
    return (
      <div className='text-muted-foreground flex h-[350px] items-center justify-center text-sm'>
        No sales data for the selected filters yet.
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: item.label,
    netSales: item.netSales,
    grossSales: item.grossSales,
    discounts: item.discounts,
  }))

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={chartData} margin={{ top: 24, right: 16, left: 32, bottom: 0 }}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={88}
          tickFormatter={(value) => formatTick(value as number)}
        />
        <Bar dataKey='netSales' fill='#2563eb' radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

