"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartConfig = {
  type: "bar" | "line" | "pie";
  title?: string;
  data: any[];
  keys?: string[];
  colors?: string[];
};

const DEFAULT_COLORS = ["#3f6df6", "#ff5f56", "#ffbd2e", "#27c93f", "#8a8a8a"];

export default function RichChart({ configStr }: { configStr: string }) {
  const config = useMemo<ChartConfig | null>(() => {
    try {
      return JSON.parse(configStr);
    } catch (e) {
      return null;
    }
  }, [configStr]);

  if (!config || !config.data || !config.type) {
    return (
      <div className="my-6 overflow-hidden rounded-2xl border border-brand-coral/20 bg-brand-coral/10 p-5 text-sm font-bold text-brand-coral shadow-sm">
        <div className="mb-2 font-black uppercase tracking-wider text-brand-coral-deep">⚠ Chart Config Error</div>
        <div>Invalid JSON configuration for chart.</div>
      </div>
    );
  }

  const { type, title, data, keys = ["value"], colors = DEFAULT_COLORS } = config;

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              />
              <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }} />
              {keys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              />
              <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }} />
              {keys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        // For pie, we just use the first key
        const pieKey = keys[0];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
              <Pie
                data={data}
                dataKey={pieKey}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="my-6 rounded-2xl border border-hairline bg-white p-6 shadow-[0_14px_32px_rgba(38,31,27,0.04)]">
      {title && <h3 className="mb-4 text-center text-lg font-bold text-ink">{title}</h3>}
      {renderChart()}
    </div>
  );
}
