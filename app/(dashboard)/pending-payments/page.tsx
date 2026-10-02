"use client";

import { useState, useEffect } from "react";
import { Search, MessageCircle, Edit, X, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function PendingPaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "Cash",
    notes: "Payment received",
  });

  // Load invoices + customers from localStorage
  useEffect(() => {
    const storedInvoices = localStorage.getItem("concept_autos_invoices");
    if (storedInvoices) {
      try { setInvoices(JSON.parse(storedInvoices)); } catch {}
    }
    const storedCustomers = localStorage.getItem("concept_autos_customers");
    if (storedCustomers) {
      try { setCustomers(JSON.parse(storedCustomers)); } catch {}
    }
  }, []);

  // Filter: only invoices with pending > 0
  const pendingInvoices = invoices.filter(inv => Number(inv.pending || 0) > 0);

  const filtered = pendingInvoices.filter(inv =>
    !search ||
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerPhone?.includes(search) ||
    inv.vehicle?.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNo?.toLowerCase().includes(search.toLowerCase())
  );

  const sendWhatsApp = (phone: string, name: string, amount: number, invoiceNo: string) => {
    let p = (phone || "").replace(/\D/g, "");
    if (p.startsWith("0")) p = "92" + p.slice(1);
    if (!p.startsWith("92")) p = "92" + p;

    const stored = localStorage.getItem("concept_autos_settings");
    const settings = stored ? JSON.parse(stored) : {};

    const fallback = `🚗 *Concept Autos*\n\nAssalam-o-Alaikum *${name}*,\n\nThis is a friendly reminder that a payment of *Rs. ${amount.toLocaleString()}* is currently pending.\n\n🧾 Invoice: ${invoiceNo}\n💰 Pending: Rs. ${amount.toLocaleString()}\n\nKindly clear the outstanding amount at your convenience.\n\n*Concept Autos Team*`;

    let message = settings.pendingPaymentTemplate || fallback;
    message = message.replace(/{name}/g, name)
                     .replace(/{amount}/g, amount.toLocaleString())
                     .replace(/{invoice_no}/g, invoiceNo);

    window.open(`https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(message)}`, "_blank");
  };

  // ===== Open Edit Modal =====
  const openEdit = (inv: any) => {
    setEditingInvoice(inv);
    setPaymentForm({
      date: new Date().toISOString().split("T")[0],
      amount: String(inv.pending || ""),
      method: "Cash",
      notes: "Payment received",
    });
  };

  // ===== Save Payment =====
  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const amt = Number(paymentForm.amount);
    const pending = Number(editingInvoice.pending || 0);

    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > pending) return toast.error(`Amount cannot exceed pending: Rs. ${pending.toLocaleString()}`);

    // 1. Update invoice
    const updatedInvoices = invoices.map(inv => {
      if (inv.invoiceNo !== editingInvoice.invoiceNo) return inv;
      const newPaid = Number(inv.paid || 0) + amt;
      const newPending = Math.max(0, Number(inv.pending || 0) - amt);
      return { ...inv, paid: newPaid, pending: newPending };
    });
    setInvoices(updatedInvoices);
    localStorage.setItem("concept_autos_invoices", JSON.stringify(updatedInvoices));

    // 2. Add Payment entry to customer ledger
    const cust = customers.find(c => c.phone === editingInvoice.customerPhone || c.name === editingInvoice.customerName);
    if (cust) {
      const newEntry = {
        id: Date.now(),
        date: paymentForm.date,
        type: "Payment",
        invoiceNo: editingInvoice.invoiceNo,
        amount: amt,
        method: paymentForm.method,
        notes: paymentForm.notes || "Payment received",
      };

      const updatedCustomers = customers.map(c => {
        if (c.id !== cust.id) return c;
        return {
          ...c,
          total_pending: Math.max(0, Number(c.total_pending || 0) - amt),
          ledger: [...(c.ledger || []), newEntry],
        };
      });
      setCustomers(updatedCustomers);
      localStorage.setItem("concept_autos_customers", JSON.stringify(updatedCustomers));
    }

    toast.success(`Rs. ${amt.toLocaleString()} received! Remaining: Rs. ${(pending - amt).toLocaleString()}`);
    setEditingInvoice(null);
    setPaymentForm({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      method: "Cash",
      notes: "Payment received",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pending Payments</h1>
          <p className="text-sm text-zinc-500">{filtered.length} invoice(s) with outstanding balance</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer or vehicle..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-digit"
            />
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-zinc-500">
                  No pending payments. All invoices are cleared.
                </td>
              </tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.invoiceNo} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 font-digit">{inv.invoiceNo}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900">{inv.customerName}</p>
                    {inv.customerPhone && (
                      <p className="text-xs text-zinc-500 font-digit">{inv.customerPhone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-digit">{inv.vehicle || "-"}</td>
                  <td className="px-6 py-4 text-zinc-900 font-digit">
                    Rs. {Number(inv.total).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-digit">
                    Rs. {Number(inv.paid || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-danger font-digit">
                    Rs. {Number(inv.pending).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-full transition-colors cursor-pointer"
                        title="Receive payment"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() =>
                          sendWhatsApp(
                            inv.customerPhone,
                            inv.customerName,
                            Number(inv.pending),
                            inv.invoiceNo
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 hover:bg-success/20 text-success text-xs font-medium rounded-full transition-colors cursor-pointer"
                        title="Send WhatsApp reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Remind
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ============ RECEIVE PAYMENT MODAL ============ */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Receive Payment — {editingInvoice.invoiceNo}
              </h2>
              <button
                onClick={() => setEditingInvoice(null)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice summary */}
            <div className="bg-zinc-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer</span>
                <span className="font-medium text-zinc-900">{editingInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Bill</span>
                <span className="font-digit text-zinc-900">Rs. {Number(editingInvoice.total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Already Paid</span>
                <span className="font-digit text-success">Rs. {Number(editingInvoice.paid || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-1">
                <span className="text-zinc-500 font-medium">Pending</span>
                <span className="font-digit text-danger font-bold">Rs. {Number(editingInvoice.pending).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      required
                      type="date"
                      value={paymentForm.date}
                      onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Amount Received (Rs.)</label>
                  <input
                    required
                    type="number"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    max={editingInvoice.pending}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick-fill buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentForm({ ...paymentForm, amount: String(editingInvoice.pending) })}
                  className="text-xs px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded cursor-pointer"
                >
                  Full (Rs. {Number(editingInvoice.pending).toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentForm({ ...paymentForm, amount: String(Math.floor(editingInvoice.pending / 2)) })}
                  className="text-xs px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded cursor-pointer"
                >
                  Half (Rs. {Math.floor(editingInvoice.pending / 2).toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentForm({ ...paymentForm, amount: "1000" })}
                  className="text-xs px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded cursor-pointer"
                >
                  Rs. 1,000
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit cursor-pointer"
                >
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
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-success hover:bg-success-hover text-white text-sm font-medium rounded-lg cursor-pointer"
                >
                  Receive Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}