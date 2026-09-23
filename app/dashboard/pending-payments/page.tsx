"use client";

import { MessageCircle, Search } from "lucide-react";
import { useState } from "react";

const mockPending = [
  { id: "INV-001", customer: "Ahmed", phone: "923001234567", vehicle: "ABC-123", total: 5000, paid: 3000, pending: 2000, date: "Sep 18, 2026" },
  { id: "INV-002", customer: "Khizar", phone: "923009876543", vehicle: "XYZ-789", total: 10000, paid: 6000, pending: 4000, date: "Sep 15, 2026" },
];

export default function PendingPaymentsPage() {
  const [search, setSearch] = useState("");

  const sendWhatsApp = (customer: string, phone: string, amount: number) => {
    const message = `AOA ${customer}, Concept Autos ki taraf se reminder hai ke aapke account mein Rs. ${amount.toLocaleString()} pending hain. Kindly payment clear kar dein. Thank you.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pending Payments</h1>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Search by customer or vehicle..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit" />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Invoice</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Vehicle</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Paid</th>
              <th className="px-6 py-3 font-medium text-danger">Pending</th>
              <th className="px-6 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {mockPending.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                <td className="px-6 py-4 font-medium text-zinc-900 font-digit">{item.id}</td>
                <td className="px-6 py-4 text-zinc-900">{item.customer}</td>
                <td className="px-6 py-4 text-zinc-600 font-digit">{item.vehicle}</td>
                <td className="px-6 py-4 text-zinc-900 font-digit">Rs. {item.total.toLocaleString()}</td>
                <td className="px-6 py-4 text-zinc-600 font-digit">Rs. {item.paid.toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-danger font-digit">Rs. {item.pending.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => sendWhatsApp(item.customer, item.phone, item.pending)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-full transition-colors cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" /> Remind
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}