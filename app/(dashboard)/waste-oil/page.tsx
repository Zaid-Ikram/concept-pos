"use client";

import { Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function WasteOilPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Waste Oil Inventory</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Trash2 className="w-4 h-4" /> <span className="text-sm font-medium">Current Tank Level</span>
          </div>
          <p className="text-3xl font-bold text-zinc-900 font-digit">126.4 L</p>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-digit"><TrendingUp className="w-3 h-3" /> +15.2L today</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <TrendingDown className="w-4 h-4" /> <span className="text-sm font-medium">Total Sold/Removed</span>
          </div>
          <p className="text-3xl font-bold text-zinc-900 font-digit">50.0 L</p>
          <p className="text-xs text-zinc-500 mt-1 font-digit">Last sold: Sep 10, 2026</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <DollarSign className="w-4 h-4" /> <span className="text-sm font-medium">Est. Revenue</span>
          </div>
          <p className="text-3xl font-bold text-zinc-900 font-digit">Rs. 5,000</p>
          <p className="text-xs text-zinc-500 mt-1 font-digit">Based on Rs. 100/L rate</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Waste Oil Transactions</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Quantity</th>
              <th className="px-4 py-2 font-medium">Reference</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {[
              { date: "Sep 18, 2026", type: "Collection", qty: "+15.2L", ref: "Oil Change - ABC-123", amount: "-" },
              { date: "Sep 10, 2026", type: "Sale", qty: "-50.0L", ref: "Buyer: Recycle Co.", amount: "Rs. 5,000" },
            ].map((item, i) => (
              <tr key={i} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-600 font-digit">{item.date}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{item.type}</td>
                <td className={`px-4 py-3 font-medium font-digit ${item.type === 'Collection' ? 'text-emerald-600' : 'text-red-600'}`}>{item.qty}</td>
                <td className="px-4 py-3 text-zinc-600">{item.ref}</td>
                <td className="px-4 py-3 text-right font-medium text-zinc-900 font-digit">{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}