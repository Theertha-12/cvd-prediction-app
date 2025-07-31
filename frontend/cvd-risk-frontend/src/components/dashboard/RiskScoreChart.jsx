import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RiskScoreChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [
      {
        label: 'CVD Risk Score',
        data: data.map(d => d.risk_score),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'CVD Risk Score Over Time',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 1, // Risk scores are typically between 0 and 1
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Risk Score Trend</h3>
      {data && data.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <p className="text-gray-600">No sufficient data to display chart.</p>
      )}
    </div>
  );
};

export default RiskScoreChart;