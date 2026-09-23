"use client";

import { useState } from "react";
import { Search, Plus, Edit, Trash2, X, CreditCard, History, Calendar } from "lucide-react";
import { toast } from "sonner";

const emptySupplier = { name: "", contact: "", totalPurchases: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([
    {
      id: 1, name: "Guard Filter", contact: "0300-1234567", totalPurchases: 150000,
      payments: [
        { id: 1, date: "2026-09-01", amount: 50000, method: "Cash", notes: "Opening payment" },
        { id: 2, date: "2026-09-15", amount: 50000, method: "Cash", notes: "Weekly payment" },
      ]
    },
    {
      id: 2, name: "Shell Pakistan", contact: "0321-7654321", totalPurchases: 500000,
      payments: [
        { id: 1, date: "2026-08-20", amount: 250000, method: "Bank", notes: "Bulk purchase" },
        { id: 2, date: "2026-09-10", amount: 200000, method: "Cheque", notes: "Partial payment" },
      ]
    },
    {
      id: 3, name: "7CF Distributors", contact: "0333-1112223", totalPurchases: 80000,
      payments: [
        { id: 1, date: "2026-09-01", amount: 80000, method: "Cash", notes: "Full payment" },
      ]
    },
  ]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptySupplier);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ date: new Date().toISOString().split("T")[0], amount: "", method: "Cash", notes: "" });

  const paidOf = (s: any) => (s.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const pendingOf = (s: any) => Math.max(0, Number(s.totalPurchases) - paidOf(s));

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      contact: form.contact,
      totalPurchases: Number(form.totalPurchases) || 0,
    };
    if (editing) {
      setSuppliers(suppliers.map(s => s.id === editing.id ? { ...s, ...payload } : s));
      toast.success("Supplier updated!");
    } else {
      setSuppliers([{ ...payload, id: Date.now(), payments: [] }, ...suppliers]);
      toast.success("Supplier added!");
    }
    closeModal();
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, contact: s.contact, totalPurchases: s.totalPurchases.toString() });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this supplier? All payment history will be lost.")) return;
    setSuppliers(suppliers.filter(s => s.id !== id));
    toast.success("Supplier deleted.");
  };

  const openPayment = (s: any) => {
    setPayingSupplier(s);
    setPaymentForm({ date: new Date().toISOString().split("T")[0], amount: "", method: "Cash", notes: "" });
    setIsPaymentOpen(true);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    const pending = pendingOf(payingSupplier);
    if (amt > pending) return toast.error(`Amount exceeds pending (Rs. ${pending.toLocaleString()})`);

    const newPayment = {
      id: Date.now(),
      date: paymentForm.date,
      amount: amt,
      method: paymentForm.method,
      notes: paymentForm.notes,
    };

    setSuppliers(suppliers.map(s =>
      s.id === payingSupplier.id ? { ...s, payments: [...(s.payments || []), newPayment] } : s
    ));

    toast.success(`Rs. ${amt.toLocaleString()} paid to ${payingSupplier.name}`);
    setIsPaymentOpen(false);
    setPayingSupplier(null);
  };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setForm(emptySupplier); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Supplier / Vendor Payments</h1>
        <button
          onClick={() => { setEditing(null); setForm(emptySupplier); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
            />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Supplier Name</th>
              <th className="px-6 py-3 font-medium">Contact</th>
              <th className="px-6 py-3 font-medium">Total Purchases</th>
              <th className="px-6 py-3 font-medium">Paid</th>
              <th className="px-6 py-3 font-medium text-danger">Pending</th>
              <th className="px-6 py-3 font-medium text-center">Payments</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-zinc-500">No suppliers. Click "Add Supplier" to start.</td></tr>
            ) : filtered.map((supplier) => {
              const paid = paidOf(supplier);
              const pending = pendingOf(supplier);
              return (
                <tr key={supplier.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900">{supplier.name}</td>
                  <td className="px-6 py-4 text-zinc-600 font-digit">{supplier.contact}</td>
                  <td className="px-6 py-4 text-zinc-900 font-digit">Rs. {supplier.totalPurchases.toLocaleString()}</td>
                  <td className="px-6 py-4 text-zinc-600 font-digit">Rs. {paid.toLocaleString()}</td>
                  <td className={`px-6 py-4 font-bold font-digit ${pending > 0 ? 'text-danger' : 'text-success'}`}>
                    Rs. {pending.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs bg-zinc-100 px-2 py-1 rounded font-digit text-zinc-600">
                      {supplier.payments?.length || 0} txns
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openPayment(supplier)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-success/10 hover:bg-success/20 text-success text-xs font-medium rounded-md cursor-pointer"
                        title="Record payment / view history"
                      >
                        <CreditCard className="w-3 h-3" /> Pay / History
                      </button>
                      <button onClick={() => handleEdit(supplier)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(supplier.id)} className="p-1.5 text-zinc-400 hover:text-danger hover:bg-danger/10 rounded-md cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">{editing ? "Edit Supplier" : "Add New Supplier"}</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Supplier Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Contact</label>
                <input type="tel" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Total Purchases (Rs.)</label>
                <input required type="number" value={form.totalPurchases} onChange={e => setForm({...form, totalPurchases: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
                <p className="text-xs text-zinc-500 mt-1">Total value of goods purchased from this supplier.</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
                  {editing ? "Update Supplier" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal — with Transaction History */}
      {isPaymentOpen && payingSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-success" /> Payment — {payingSupplier.name}
              </h2>
              <button onClick={() => { setIsPaymentOpen(false); setPayingSupplier(null); }} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-50 p-4 rounded-lg">
                  <p className="text-xs text-zinc-500">Total Purchases</p>
                  <p className="text-lg font-bold text-zinc-900 font-digit mt-1">Rs. {payingSupplier.totalPurchases.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-lg">
                  <p className="text-xs text-zinc-500">Total Paid</p>
                  <p className="text-lg font-bold text-success font-digit mt-1">Rs. {paidOf(payingSupplier).toLocaleString()}</p>
                </div>
                <div className="bg-danger/5 p-4 rounded-lg">
                  <p className="text-xs text-danger">Pending</p>
                  <p className="text-lg font-bold text-danger font-digit mt-1">Rs. {pendingOf(payingSupplier).toLocaleString()}</p>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-semibold text-zinc-900">Transaction History</h3>
                </div>
                {(!payingSupplier.payments || payingSupplier.payments.length === 0) ? (
                  <div className="text-sm text-zinc-500 text-center py-6 bg-zinc-50 rounded-lg">No payments recorded yet</div>
                ) : (
                  <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 text-zinc-500 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-medium">Date</th>
                          <th className="px-4 py-2 font-medium">Method</th>
                          <th className="px-4 py-2 font-medium">Notes</th>
                          <th className="px-4 py-2 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {payingSupplier.payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-zinc-50">
                            <td className="px-4 py-2.5 text-zinc-700 font-digit flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-zinc-400" /> {p.date}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-600">{p.method}</td>
                            <td className="px-4 py-2.5 text-zinc-500 text-xs">{p.notes || "-"}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-success font-digit">Rs. {p.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add New Payment */}
              <div className="border-t border-zinc-200 pt-4">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Add New Payment</h3>
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Payment Date</label>
                      <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Amount (Rs.)</label>
                      <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder="e.g. 1000" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Payment Method</label>
                      <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer font-digit">
                        <option>Cash</option>
                        <option>JazzCash</option>
                        <option>EasyPaisa</option>
                        <option>DIB</option>
                        <option>Meezan Bank</option>
                        <option>Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Notes (optional)</label>
                      <input type="text" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="e.g. Daily 1K payment" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success-hover text-white text-sm font-medium rounded-lg cursor-pointer">
                      <CreditCard className="w-4 h-4" /> Record Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}