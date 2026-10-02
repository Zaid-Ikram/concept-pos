"use client";

import { useState, useEffect } from "react";
import { Search, Eye, ShoppingCart, AlertTriangle, AlertCircle, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";

export default function LowStockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("concept_autos_products");
    if (stored) { try { setProducts(JSON.parse(stored)); } catch {} }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {});
  }, []);

  // Classify each product
  const classify = (p: any) => {
    const stock = Number(p.stock_qty || 0);
    const min = Number(p.min_stock_level || 5);
    if (stock <= 0) return "critical";
    if (stock < min) return "warning";
    if (stock <= min * 1.2) return "near"; // within 20% above min
    return "ok";
  };

  const lowStockProducts = products
    .filter(p => classify(p) !== "ok")
    .filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.includes(search) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
    );

  const criticalCount = lowStockProducts.filter(p => classify(p) === "critical").length;
  const warningCount = lowStockProducts.filter(p => classify(p) === "warning").length;
  const nearCount = lowStockProducts.filter(p => classify(p) === "near").length;

  const suggestedRestock = lowStockProducts.reduce((sum, p) => {
    const min = Number(p.min_stock_level || 5);
    const current = Number(p.stock_qty || 0);
    return sum + Math.max(0, min * 2 - current);
  }, 0);

  const handleExport = () => {
    const csv = [
      ["SKU", "Name", "Brand", "Current Stock", "Minimum", "Suggested Order", "Status"],
      ...lowStockProducts.map(p => [
        p.sku || "", p.name || "", p.brand || "",
        p.stock_qty || 0, p.min_stock_level || 5,
        Math.max(0, Number(p.min_stock_level || 5) * 2 - Number(p.stock_qty || 0)),
        classify(p),
      ]),
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `low-stock-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported!");
  };

  const statusBadge = (s: string) => {
    if (s === "critical") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>;
    if (s === "warning") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Warning</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Near Min</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Low Stock Alerts</h1>
          <p className="text-sm text-zinc-500">Items at, below, or nearing minimum stock</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer">
            <Download className="w-4 h-4" /> Export
          </button>
          <a href="/inventory" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
            Full Inventory
          </a>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Attention Required</p>
              <p className="text-xs text-amber-700">{lowStockProducts.length} item(s) need attention</p>
            </div>
          </div>
          <button onClick={() => toast.info("Purchase order feature coming soon")} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg cursor-pointer">
            <ShoppingCart className="w-4 h-4" /> Create Purchase
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Critical / OOS</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-3xl font-bold font-digit text-zinc-900">{criticalCount}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-bold font-digit text-zinc-900">{warningCount}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Near Min</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-3xl font-bold font-digit text-zinc-900">{nearCount}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Suggested Restock</span>
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold font-digit text-zinc-900">{suggestedRestock}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[760px]">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Part Name</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Current</th>
                <th className="px-4 py-3 font-medium">Minimum</th>
                <th className="px-4 py-3 font-medium">Suggested</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {lowStockProducts.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  {products.length === 0 ? "No products yet." : "✅ All products are above minimum stock levels."}
                </td></tr>
              ) : lowStockProducts.map((item) => {
                const s = classify(item);
                const current = Number(item.stock_qty || 0);
                const min = Number(item.min_stock_level || 5);
                const suggested = Math.max(0, min * 2 - current);
                const location = [item.rack, item.shelf].filter(Boolean).join(" → ") || "-";
                return (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500 font-digit">{item.sku || "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-zinc-600 font-digit">{item.brand || "-"}</td>
                    <td className="px-4 py-4 text-zinc-600 font-digit">{location}</td>
                    <td className="px-4 py-4 font-bold font-digit text-zinc-900">{current} pcs</td>
                    <td className="px-4 py-4 text-zinc-600 font-digit">{min}</td>
                    <td className="px-4 py-4 font-medium text-primary font-digit">{suggested}</td>
                    <td className="px-4 py-4">{statusBadge(s)}</td>
                    <td className="px-4 py-4 text-right">
                      <a href="/inventory" className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Open
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}