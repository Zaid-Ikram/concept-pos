"use client";

import { BarChart3, TrendingUp, Droplets, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salesData = [
  { month: "Jan", value: 40000 },
  { month: "Feb", value: 30000 },
  { month: "Mar", value: 50000 },
  { month: "Apr", value: 45000 },
  { month: "May", value: 60000 },
  { month: "Jun", value: 55000 },
  { month: "Jul", value: 70000 },
  { month: "Aug", value: 80000 },
  { month: "Sep", value: 75000 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <DollarSign className="w-4 h-4" /> <span className="text-sm font-medium">Total Sales (This Month)</span>
          </div>
          <p className="text-3xl font-bold font-digit text-zinc-900">Rs. 75,000</p>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-digit"><TrendingUp className="w-3 h-3" /> +12.5%</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <TrendingUp className="w-4 h-4" /> <span className="text-sm font-medium">Total Profit</span>
          </div>
          <p className="text-3xl font-bold font-digit text-emerald-600">Rs. 24,500</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Droplets className="w-4 h-4" /> <span className="text-sm font-medium">Oil Consumed</span>
          </div>
          <p className="text-3xl font-bold font-digit text-primary">342.5 L</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Monthly Sales Overview
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'var(--font-rajdhani)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'var(--font-rajdhani)' }} tickFormatter={(value) => `Rs. ${value / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }} 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e4e4e7', 
                    fontFamily: 'var(--font-rajdhani)', 
                    fontWeight: 500 
                  }} 
                  formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, "Amount"]}
                />
                {/* Added cursor-pointer to the Bar */}
                <Bar dataKey="value" fill="#2596ff" radius={[4, 4, 0, 0]} maxBarSize={50} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {[
              { name: "Shell Helix 4L", sales: 124, revenue: "Rs. 520,800" },
              { name: "7CF Carb Cleaner", sales: 98, revenue: "Rs. 20,090" },
              { name: "ABC Filter", sales: 76, revenue: "Rs. 10,640" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-500 font-digit">{item.sales} units sold</p>
                </div>
                <span className="text-sm font-bold text-zinc-900 font-digit">{item.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}