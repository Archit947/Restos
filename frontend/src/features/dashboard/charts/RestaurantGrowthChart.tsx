import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartDataPoint } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface RestaurantGrowthChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

export function RestaurantGrowthChart({ data, loading }: RestaurantGrowthChartProps) {
  if (loading) {
    return <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />;
  }

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'New Restaurants',
      data: data.map(d => d.count),
      fill: true,
      borderColor: '#e51d1d',
      backgroundColor: 'rgba(229, 29, 29, 0.08)',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#e51d1d',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a202c',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#2d3748',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
