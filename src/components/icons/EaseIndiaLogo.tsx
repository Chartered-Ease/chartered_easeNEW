import React from 'react';

export const CharteredEaseLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="48" fill="#1E3A8A" />
    <text
      x="50"
      y="55"
      fontFamily="Inter, sans-serif"
      fontSize="40"
      fontWeight="bold"
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      CE
    </text>
  </svg>
);