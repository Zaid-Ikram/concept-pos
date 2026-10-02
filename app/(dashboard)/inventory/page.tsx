"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, History, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const emptyProduct = {
  name: "", category: "", purchase_price: "", wholesale_price: "",
  sale_price: "", stock_qty: "", stock_ml: "", min_stock_level: "5",
  rack: "", shelf: "", unit: "pcs",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<any>(emptyProduct);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<any>(null);
  const [historyRows, setHistoryRows] = useState<any[]>([]);

  const loadProducts = () => {
    const stored = localStorage.getItem("concept_autos_products");
    if (stored) { try { setProducts(JSON.parse(stored)); } catch { } }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) { setProducts(d); localStorage.setItem("concept_autos_products", JSON.stringify(d)); } setIsLoading(false); })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockQty = Math.max(0, Number(newProduct.stock_qty) || 0);

    // Auto-generate SKU if empty
    const finalSku = newProduct.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    const payload = { ...newProduct, sku: finalSku, stock_qty: stockQty };

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/products.php`;
      const res = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct ? { id: editingProduct.id, ...payload } : payload),
      });
      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Save failed");
      }

      toast.success(editingProduct ? "Product updated!" : "Product added!");

      // Reload from API
      const fresh = await fetch(url).then(r => r.json());
      if (Array.isArray(fresh)) {
        setProducts(fresh);
        localStorage.setItem("concept_autos_products", JSON.stringify(fresh));
      }
    } catch (err: any) {
      console.error("Save product error:", err);
      toast.error(err.message || "Failed to save — check API");
      // Fallback local only
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
      } else {
        setProducts([{ ...payload, id: Date.now() }, ...products]);
      }
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setNewProduct(emptyProduct);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
setNewProduct({
  name: product.name || "",
  category: product.category || "",
  purchase_price: product.purchase_price?.toString() || "",
  wholesale_price: product.wholesale_price?.toString() || "",
  sale_price: product.sale_price?.toString() || "",
  stock_qty: product.stock_qty?.toString() || "",
  stock_ml: product.stock_ml?.toString() || "",
  min_stock_level: product.min_stock_level?.toString() || "5",
  rack: product.rack || "",
  shelf: product.shelf || "",
  unit: product.unit || "pcs",
});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { }
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product deleted.");
  };

  const openHistory = async (product: any) => {
    setHistoryProduct(product);
    setIsHistoryOpen(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock_history.php?product_id=${product.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setHistoryRows(data);
      else setHistoryRows([]);
    } catch {
      // Fallback to local
      const local = (() => { try { return JSON.parse(localStorage.getItem("concept_autos_stock_history") || "[]"); } catch { return []; } })();
      setHistoryRows(local.filter((h: any) => h.productId === product.id));
    }
  };

  const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); setNewProduct(emptyProduct); };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inventory</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Purchase</th>
                <th className="px-4 py-3 font-medium">Sale</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Min</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-zinc-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-zinc-500">No products found.</td></tr>
              ) : filtered.map((p) => {
                const stock = Number(p.stock_qty || 0);
                const min = Number(p.min_stock_level || 5);
                const isLow = stock < min;
                const location = [p.rack, p.shelf].filter(Boolean).join(" → ") || "-";
                return (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-4 text-zinc-900 font-medium">{p.name}</td>
                    <td className="px-4 py-4 text-zinc-500">{p.category}</td>
                    <td className="px-4 py-4 text-zinc-500 font-digit">{location}</td>
                    <td className="px-4 py-4 text-zinc-500 font-digit">Rs. {p.purchase_price}</td>
                    <td className="px-4 py-4 font-medium text-zinc-900 font-digit">Rs. {p.sale_price}</td>
                    <td className="px-4 py-4 text-zinc-500 font-digit">{p.unit || "pcs"}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-digit ${isLow ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                        {stock} {p.unit === "L" ? "L" : "pcs"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-zinc-500 font-digit">{min}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openHistory(p)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded cursor-pointer" title="Stock History"><History className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded cursor-pointer"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-zinc-400 hover:text-danger hover:bg-danger/10 rounded cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal — no SKU, merged rack/shelf, unit + oil grade */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg my-8">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200">
              <h2 className="text-lg font-semibold">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                />
              </div>

              {/* SKU + Category + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Engine Oil, Filter..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm cursor-pointer"
                  >
                    <option value="pcs">Piece (pcs)</option>
                    <option value="L">Liter (L)</option>
                  </select>
                </div>
              </div>

              {/* Purchase + Wholesale */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Purchase Price</label>
                  <input
                    required
                    type="number"
                    value={newProduct.purchase_price}
                    onChange={e => setNewProduct({ ...newProduct, purchase_price: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Wholesale Price</label>
                  <input
                    type="number"
                    value={newProduct.wholesale_price}
                    onChange={e => setNewProduct({ ...newProduct, wholesale_price: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
                  />
                </div>
              </div>

              {/* Sale + Min Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Sale Price</label>
                  <input
                    required
                    type="number"
                    value={newProduct.sale_price}
                    onChange={e => setNewProduct({ ...newProduct, sale_price: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Min Stock Alert</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={newProduct.min_stock_level}
                    onChange={e => setNewProduct({ ...newProduct, min_stock_level: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
                  />
                </div>
              </div>

              {/* Merged Location field — single input */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Location (Rack → Shelf)</label>
                <input
                  type="text"
                  value={newProduct.rack ? (newProduct.shelf ? `${newProduct.rack} → ${newProduct.shelf}` : newProduct.rack) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Parse "A1 → 3" or "A1-3" or "A1,3" — split into rack + shelf
                    const parts = val.split(/→|->|-|,/).map(s => s.trim());
                    setNewProduct({
                      ...newProduct,
                      rack: parts[0] || "",
                      shelf: parts[1] || "",
                    });
                  }}
                  placeholder="e.g. A1 → 3  (or A1-3)"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Type rack then shelf separated by → or -
                </p>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Stock Quantity ({newProduct.unit === "L" ? "liters" : "pieces"})
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step={newProduct.unit === "L" ? "0.01" : "1"}
                  value={newProduct.stock_qty}
                  onChange={e => setNewProduct({ ...newProduct, stock_qty: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">{editingProduct ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {isHistoryOpen && historyProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200">
              <h2 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Stock History — {historyProduct.name}</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto">
              {historyRows.length === 0 ? (
                <div className="p-10 text-center text-zinc-500 text-sm">No history yet.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Reference</th>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {historyRows.map(h => (
                      <tr key={h.id}>
                        <td className="px-4 py-3 text-zinc-600 font-digit">{h.date}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${h.qty > 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                            {h.qty > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {h.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 font-digit">{h.reference || h.ref || "-"}</td>
                        <td className="px-4 py-3 text-zinc-600">{h.user || "Admin"}</td>
                        <td className={`px-4 py-3 text-right font-bold font-digit ${h.qty > 0 ? "text-success" : "text-danger"}`}>
                          {h.qty > 0 ? "+" : ""}{h.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}