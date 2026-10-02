"use client";

import { useState, useEffect } from "react";
import { Search, X, Calendar, CreditCard, Plus, TrendingUp, TrendingDown, Printer } from "lucide-react";
import { toast } from "sonner";
import PrintInvoiceModal from "@/components/modals/PrintInvoiceModal";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid">("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ date: new Date().toISOString().split("T")[0], amount: "", method: "Cash", notes: "" });
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState<any>(null);

  const load = () => {
    const data = (() => { try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); } catch { return []; } })();
    setInvoices(data);
  };

  useEffect(() => { load(); }, []);

  const filtered = invoices
    .filter(inv => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        inv.customerName?.toLowerCase().includes(q) ||
        inv.vehicle?.toLowerCase().includes(q) ||
        inv.invoiceNo?.toLowerCase().includes(q)
      );
    })
    .filter(inv => {
      if (filterStatus === "all") return true;
      if (filterStatus === "pending") return Number(inv.pending || 0) > 0;
      return Number(inv.pending || 0) === 0;
    });

  const totalSales = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid || 0), 0);
  const totalPending = invoices.reduce((s, i) => s + Number(i.pending || 0), 0);

  const openPayment = (inv: any) => {
    setPayingInvoice(inv);
    setPaymentForm({ date: new Date().toISOString().split("T")[0], amount: "", method: "Cash", notes: "" });
    setIsPaymentModalOpen(true);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) return toast.error("Enter amount");
    const currentPending = Number(payingInvoice.pending || 0);
    if (amt > currentPending) return toast.error(`Max pending: Rs. ${currentPending.toLocaleString()}`);

    const updated = {
      ...payingInvoice,
      paid: Number(payingInvoice.paid || 0) + amt,
      pending: Math.max(0, currentPending - amt),
      payments: [
        ...(payingInvoice.payments || []),
        { id: Date.now(), date: paymentForm.date, amount: amt, method: paymentForm.method, notes: paymentForm.notes },
      ],
    };

    // Update invoices in localStorage
    const allInvoices = (() => { try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); } catch { return []; } })();
    const newInvoices = allInvoices.map((inv: any) =>
      inv.invoiceNo === payingInvoice.invoiceNo ? updated : inv
    );
    localStorage.setItem("concept_autos_invoices", JSON.stringify(newInvoices));

    // Update customer's ledger + pending
    const customers = (() => { try { return JSON.parse(localStorage.getItem("concept_autos_customers") || "[]"); } catch { return []; } })();
    const cust = customers.find((c: any) => c.name === payingInvoice.customerName);
    if (cust) {
      const updatedCust = {
        ...cust,
        total_pending: Math.max(0, Number(cust.total_pending || 0) - amt),
        ledger: [
          ...(cust.ledger || []),
          {
            id: Date.now(),
            date: paymentForm.date,
            type: "Payment",
            invoiceNo: payingInvoice.invoiceNo,
            amount: amt,
            method: paymentForm.method,
            notes: paymentForm.notes || `Against ${payingInvoice.invoiceNo}`,
          },
        ],
      };
      localStorage.setItem(
        "concept_autos_customers",
        JSON.stringify(customers.map((c: any) => c.id === cust.id ? updatedCust : c))
      );
    }

    toast.success(`Rs. ${amt.toLocaleString()} recorded`);
    setIsPaymentModalOpen(false);
    setPayingInvoice(null);
    load();
  };

  const openPrint = (inv: any) => {
    setPrintingInvoice(inv);
    setIsPrintOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">All Invoices</h1>
          <p className="text-sm text-zinc-500">Search, view, and record payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Total Invoices</p>
          <p className="text-2xl font-bold font-digit text-zinc-900 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Total Sales</p>
          <p className="text-2xl font-bold font-digit text-zinc-900 mt-1">Rs. {totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Total Paid</p>
          <p className="text-2xl font-bold font-digit text-success mt-1">Rs. {totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Total Pending</p>
          <p className="text-2xl font-bold font-digit text-danger mt-1">Rs. {totalPending.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by customer, vehicle, invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "paid"] as const).map(t => (
              <button key={t} onClick={() => setFilterStatus(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${filterStatus === t ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                {t === "all" ? "All" : t === "pending" ? "Pending" : "Paid"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium text-right text-success">Paid</th>
                <th className="px-5 py-3 font-medium text-right text-danger">Pending</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-zinc-500">No invoices found.</td></tr>
              ) : filtered.map((inv, i) => (
                <tr key={i} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 text-zinc-600 font-digit">{inv.date}</td>
                  <td className="px-5 py-3 font-medium text-zinc-900 font-digit">{inv.invoiceNo}</td>
                  <td className="px-5 py-3 text-zinc-800">{inv.customerName}</td>
                  <td className="px-5 py-3 text-zinc-600 font-digit">{inv.vehicle || "-"}</td>
                  <td className="px-5 py-3 text-right font-bold font-digit text-zinc-900">Rs. {Number(inv.total).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-digit text-success">Rs. {Number(inv.paid || 0).toLocaleString()}</td>
                  <td className={`px-5 py-3 text-right font-bold font-digit ${Number(inv.pending || 0) > 0 ? "text-danger" : "text-success"}`}>
                    Rs. {Number(inv.pending || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {Number(inv.pending || 0) > 0 && (
                        <button onClick={() => openPayment(inv)} className="p-1.5 text-zinc-400 hover:text-success hover:bg-success/10 rounded cursor-pointer" title="Record Payment">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openPrint(inv)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded cursor-pointer" title="View / Print">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && payingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Record Payment — {payingInvoice.invoiceNo}</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-zinc-50 p-3 rounded-lg mb-4 text-sm space-y-1">
              <p className="text-zinc-600">Customer: <span className="font-medium text-zinc-900">{payingInvoice.customerName}</span></p>
              <p className="text-zinc-600">Total: <span className="font-digit text-zinc-900">Rs. {Number(payingInvoice.total).toLocaleString()}</span></p>
              <p className="text-zinc-600">Already Paid: <span className="font-digit text-success">Rs. {Number(payingInvoice.paid || 0).toLocaleString()}</span></p>
              <p className="text-zinc-600">Pending: <span className="font-digit text-danger font-bold">Rs. {Number(payingInvoice.pending || 0).toLocaleString()}</span></p>
            </div>

            <form onSubmit={handlePayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                  <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Amount</label>
                  <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Method</label>
                <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm cursor-pointer">
                  <option>Cash</option><option>JazzCash</option><option>EasyPaisa</option><option>DIB</option><option>Meezan Bank</option><option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                <input type="text" value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-success hover:bg-success-hover text-white text-sm rounded-lg">Save Payment</button>
              </div>
            </form>

            {/* Payment History */}
            {payingInvoice.payments && payingInvoice.payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <h3 className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Payment History</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {payingInvoice.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center bg-zinc-50 rounded p-2 text-xs">
                      <div className="flex items-center gap-2 text-zinc-600 font-digit">
                        <Calendar className="w-3 h-3" /> {p.date} · {p.method}
                      </div>
                      <span className="font-bold text-success font-digit">Rs. {Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <PrintInvoiceModal isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} invoice={printingInvoice} />
    </div>
  );
}