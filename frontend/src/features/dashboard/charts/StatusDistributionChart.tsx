import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  inactive: '#94a3b8',
  trial: '#3b82f6',
  expired: '#ef4444',
  suspended: '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', inactive: 'Inactive', trial: 'Trial', expired: 'Expired', suspended: 'Suspended',
};

interface StatusDistributionChartProps {
  data: Array<{ status: string; count: number }>;
  loading?: boolean;
}

export function StatusDistributionChart({ data, loading }: StatusDistributionChartProps) {
  if (loading) {
    return <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />;
  }

  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-gray-400">No data</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => STATUS_LABELS[d.status] || d.status),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map(d => STATUS_COLORS[d.status] || '#94a3b8'),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 12, usePointStyle: true, font: { size: 11 }, color: '#64748b' },
      },
      tooltip: {
        backgroundColor: '#1a202c',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) => ` ${ctx.label}: ${ctx.raw}`,
        },
      },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
