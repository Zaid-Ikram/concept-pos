"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Package, Search, MapPin } from "lucide-react";

interface CheckPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
}

export default function CheckPriceModal({ isOpen, onClose, products }: CheckPriceModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) { setQuery(""); setSelected(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = query.length > 0
    ? products.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase()) || p.sku?.includes(query)
      ).slice(0, 6)
    : [];

  const profit = selected ? Number(selected.sale_price) - Number(selected.purchase_price) : 0;
  const profitPercent = selected && Number(selected.purchase_price) > 0
    ? ((profit / Number(selected.purchase_price)) * 100).toFixed(0)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Check Price & Profit
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Search Only */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search product by name or SKU..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
            />
            {filtered.length > 0 && !selected && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelected(p); setQuery(p.name); }}
                    className="flex items-center justify-between p-3 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-500 font-digit">SKU: {p.sku}</p>
                    </div>
                    <span className="text-xs text-primary font-digit">Rs. {p.sale_price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details of Selected Product */}
          {selected ? (
            <div className="mt-4 space-y-3">
              <div className="bg-zinc-50 p-3 rounded-lg">
                <p className="font-semibold text-zinc-900">{selected.name}</p>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <Package className="w-3 h-3" /> In stock:{" "}
                  <span className="font-digit">
                    {selected.stock_qty || `${(selected.stock_ml / 1000).toFixed(2)} L`}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 p-3 rounded-lg">
                  <p className="text-xs text-zinc-500">Purchase Price</p>
                  <p className="font-bold text-zinc-900 font-digit mt-1">
                    Rs. {Number(selected.purchase_price).toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg">
                  <p className="text-xs text-zinc-500">Sale Price</p>
                  <p className="font-bold text-zinc-900 font-digit mt-1">
                    Rs. {Number(selected.sale_price).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-xs text-success">Profit</p>
                <p className="font-bold text-success font-digit text-lg mt-1">
                  Rs. {profit.toLocaleString()} ({profitPercent}%)
                </p>
              </div>

              {selected.wholesale_price > 0 && (
                <div className="bg-zinc-50 p-3 rounded-lg">
                  <p className="text-xs text-zinc-500">Wholesale Price</p>
                  <p className="font-bold text-zinc-900 font-digit mt-1">
                    Rs. {Number(selected.wholesale_price).toLocaleString()}
                  </p>
                </div>
              )}

              {(selected.rack || selected.shelf) && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-xs text-primary flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </p>
                  <p className="font-bold text-primary font-digit mt-1">
                    Rack {selected.rack || "-"} → Shelf {selected.shelf || "-"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-6">
              {query.length === 0 ? "Start typing to search a product" : "No matching product found"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}