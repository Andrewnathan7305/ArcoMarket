"use client";
import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ChartDataPoint = {
  time: string;
  [key: string]: string | number;
};

type Props = {
  data: ChartDataPoint[];
  outcomes: Array<{ id: string; label: string; color: string }>;
};

type TimePeriod = "6H" | "1D" | "1W" | "1M";

export default function OutcomeChart({ data, outcomes }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1D");

  // Generate different datasets based on time period
  const getDataForPeriod = (period: TimePeriod): ChartDataPoint[] => {
    const baseData = data;
    
    switch (period) {
      case "6H":
        // Last 6 hours - more granular data
        return baseData.slice(-6).map((item, index) => ({
          ...item,
          time: `${6 - index}H ago`
        }));
      case "1D":
        // Last 24 hours
        return baseData.slice(-7).map((item, index) => ({
          ...item,
          time: `${24 - (index * 4)}H ago`
        }));
      case "1W":
        // Last week - create weekly trend data
        return baseData.slice(0, 7).map((item, index) => {
          const dayOffset = 7 - index;
          const trendFactor = 1 + (Math.sin(dayOffset * 0.5) * 0.3); // Add some trend variation
          const newItem = { ...item };
          Object.keys(newItem).forEach(key => {
            if (key !== 'time' && typeof newItem[key] === 'number') {
              newItem[key] = Math.max(0, Math.min(100, Math.round(newItem[key] * trendFactor)));
            }
          });
          return {
            ...newItem,
            time: `${dayOffset}D ago`
          };
        });
      case "1M":
        // Last month - create monthly trend data with more variation
        return baseData.slice(0, 4).map((item, index) => {
          const weekOffset = 4 - index;
          const trendFactor = 1 + (Math.sin(weekOffset * 0.8) * 0.5); // More variation for monthly view
          const volatilityFactor = 1 + (Math.random() - 0.5) * 0.4; // Add some randomness
          const newItem = { ...item };
          Object.keys(newItem).forEach(key => {
            if (key !== 'time' && typeof newItem[key] === 'number') {
              newItem[key] = Math.max(0, Math.min(100, Math.round(newItem[key] * trendFactor * volatilityFactor)));
            }
          });
          return {
            ...newItem,
            time: `${weekOffset}W ago`
          };
        });
      default:
        return baseData;
    }
  };

  const currentData = getDataForPeriod(selectedPeriod);

  return (
    <div className="rounded-xl border border-accent-600/20 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-montserrat font-bold text-white">Price History</h3>
        <div className="flex items-center gap-2">
          {(["6H", "1D", "1W", "1M"] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                selectedPeriod === period
                  ? "bg-accent-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full animate-in fade-in duration-1000">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={currentData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => value}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #4B5563",
                borderRadius: "8px",
                color: "#F9FAFB"
              }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {outcomes.map((outcome) => (
              <Line
                key={outcome.id}
                type="monotone"
                dataKey={outcome.id}
                stroke={outcome.color}
                strokeWidth={2}
                dot={false}
                name={outcome.label}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
