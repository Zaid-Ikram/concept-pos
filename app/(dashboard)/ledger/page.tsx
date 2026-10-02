"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, DollarSign, Download, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function LedgerPage() {
  const [apiEntries, setApiEntries] = useState<any[]>([]);
  const [localEntries, setLocalEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in" | "out" | "pending">("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = async () => {
    setIsLoading(true);

    // 1. API entries
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ledger.php`);
      const data = await res.json();
      if (Array.isArray(data)) setApiEntries(data);
    } catch (err) {
      console.error("Ledger API error:", err);
    }

    // 2. Local supplier payments (still in localStorage)
    const local: any[] = [];
    const suppliers = (() => { try { return JSON.parse(localStorage.getItem("concept_autos_suppliers") || "[]"); } catch { return []; } })();

    suppliers.forEach((s: any) => {
      (s.payments || []).forEach((p: any) => {
        local.push({
          id: `sup-${s.id}-${p.id}`,
          date: p.date,
          sortDate: p.date,
          type: "Supplier Payment",
          category: "Cash Out",
          description: `${s.name} — ${p.notes || p.method}`,
          ref: p.method,
          direction: "out",
          amount: Number(p.amount),
        });
      });
    });

    setLocalEntries(local);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Combine + sort
  const allEntries = [...apiEntries, ...localEntries].sort(
    (a, b) => new Date(b.sortDate || b.date).getTime() - new Date(a.sortDate || a.date).getTime()
  );

  const filtered = allEntries
    .filter(e => filterType === "all" || e.direction === filterType)
    .filter(e => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        e.description?.toLowerCase().includes(q) ||
        String(e.ref || "").toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q)
      );
    });

  const totalIn = allEntries.filter(e => e.direction === "in").reduce((s, e) => s + e.amount, 0);
  const totalOut = allEntries.filter(e => e.direction === "out").reduce((s, e) => s + e.amount, 0);
  const totalPending = allEntries.filter(e => e.direction === "pending").reduce((s, e) => s + e.amount, 0);
  const netCash = totalIn - totalOut;

  const handleExport = () => {
    const csv = [
      ["Date", "Type", "Category", "Description", "Reference", "Direction", "Amount"],
      ...filtered.map(e => [e.date, e.type, e.category, e.description, e.ref, e.direction, e.amount]),
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Ledger exported!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Cash Ledger</h1>
          <p className="text-sm text-zinc-500">All cash movements — sales, payments, waste oil, supplier payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Total Cash In</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold font-digit text-success">Rs. {totalIn.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Total Cash Out</span>
            <TrendingDown className="w-4 h-4 text-danger" />
          </div>
          <p className="text-2xl font-bold font-digit text-danger">Rs. {totalOut.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Net Cash</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className={`text-2xl font-bold font-digit ${netCash >= 0 ? "text-primary" : "text-danger"}`}>Rs. {netCash.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Pending Receivables</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-digit text-amber-600">Rs. {totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg font-digit"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "in", "out", "pending"] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${filterType === t ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                {t === "all" ? "All" : t === "in" ? "Cash In" : t === "out" ? "Cash Out" : "Pending"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[760px]">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-500">Loading ledger...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-500">No ledger entries yet.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 text-zinc-600 font-digit">{e.date}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.direction === "in" ? "bg-success/10 text-success" :
                      e.direction === "out" ? "bg-danger/10 text-danger" : "bg-amber-100 text-amber-800"
                    }`}>
                      {e.direction === "in" && <TrendingUp className="w-3 h-3" />}
                      {e.direction === "out" && <TrendingDown className="w-3 h-3" />}
                      {e.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-800">{e.description}</td>
                  <td className="px-5 py-3 text-zinc-500 font-digit">{e.ref}</td>
                  <td className={`px-5 py-3 text-right font-bold font-digit ${
                    e.direction === "in" ? "text-success" : e.direction === "out" ? "text-danger" : "text-amber-600"
                  }`}>
                    {e.direction === "in" ? "+" : e.direction === "out" ? "-" : ""} Rs. {e.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}