"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, Phone, MessageCircle, X, Edit, Trash2, Car, Plus, ArrowLeft, CreditCard, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", phone: "", altPhone: "", email: "", address: "", city: "",
    openingReceivable: "", creditLimit: "", creditDays: "", loyalty: "Standard",
    notes: "", status: "Active"
  });
  const [modalVehicles, setModalVehicles] = useState<any[]>([]);

  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ reg_no: "", make: "", model: "", year: "", cai_no: "" });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ date: new Date().toISOString().split("T")[0], amount: "", method: "Cash", type: "Pending Payment", notes: "" });

  const emptyForm = {
    name: "", phone: "", altPhone: "", email: "", address: "", city: "",
    openingReceivable: "", creditLimit: "", creditDays: "", loyalty: "Standard",
    notes: "", status: "Active"
  };

  // Load customers
  useEffect(() => {
    const stored = localStorage.getItem("concept_autos_customers");
    if (stored) {
      try { setCustomers(JSON.parse(stored)); } catch {}
    } else {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers.php`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCustomers(data); })
        .catch(() => {});
    }
  }, []);

  // Persist
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem("concept_autos_customers", JSON.stringify(customers));
    }
  }, [customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, vehicles: modalVehicles };

    if (editing) {
      const updated = { ...editing, ...payload };
      setCustomers(customers.map(c => c.id === editing.id ? updated : c));
      if (viewingCustomer?.id === editing.id) setViewingCustomer(updated);
      toast.success("Customer updated!");
    } else {
      const newCust = {
        ...payload,
        id: Date.now(),
        total_purchases: Number(form.openingReceivable) || 0,
        total_pending: Number(form.openingReceivable) || 0,
        cai_numbers: [],
        payment_history: [],
      };
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch {}
      setCustomers([newCust, ...customers]);
      toast.success("Customer added!");
    }
    closeModal();
  };

  const openVehicleForm = (index: number | null = null) => {
    if (index !== null) {
      setEditingVehicleIndex(index);
      setVehicleForm(modalVehicles[index]);
    } else {
      setEditingVehicleIndex(null);
      setVehicleForm({ reg_no: "", make: "", model: "", year: "", cai_no: "" });
    }
    setIsVehicleFormOpen(true);
  };

  const saveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.reg_no.trim()) return toast.error("Vehicle number required");

    if (editingVehicleIndex !== null) {
      const updated = [...modalVehicles];
      updated[editingVehicleIndex] = { ...vehicleForm, id: modalVehicles[editingVehicleIndex].id };
      setModalVehicles(updated);
      toast.success("Vehicle updated");
    } else {
      setModalVehicles([...modalVehicles, { ...vehicleForm, id: Date.now() }]);
      toast.success("Vehicle added");
    }
    setIsVehicleFormOpen(false);
  };

  const removeVehicleFromModal = (index: number) => {
    if (!confirm("Remove this vehicle?")) return;
    setModalVehicles(modalVehicles.filter((_, i) => i !== index));
    toast.success("Vehicle removed");
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this customer?")) return;
    setCustomers(customers.filter(c => c.id !== id));
    toast.success("Customer deleted.");
  };

  const sendWhatsApp = (phone: string, name: string) => {
    let p = (phone || "").replace(/\D/g, "");
    if (p.startsWith("0")) p = "92" + p.slice(1);
    if (!p.startsWith("92")) p = "92" + p;
    const message = `AOA ${name}, Concept Autos ki taraf se reminder. Contact: Khalil ur Rehman 03062876599`;
    window.open(`https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(message)}`, "_blank");
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalVehicles([]);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: any) => {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      altPhone: customer.altPhone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      openingReceivable: customer.openingReceivable?.toString() || "",
      creditLimit: customer.creditLimit?.toString() || "",
      creditDays: customer.creditDays?.toString() || "",
      loyalty: customer.loyalty || "Standard",
      notes: customer.notes || "",
      status: customer.status || "Active",
    });
    setModalVehicles(customer.vehicles || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setModalVehicles([]);
    setIsVehicleFormOpen(false);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingCustomer) return;
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");

    const newPayment = {
      id: Date.now(),
      date: paymentForm.date,
      invoiceNo: "-",
      amount: amt,
      method: paymentForm.method,
      type: paymentForm.type,
      notes: paymentForm.notes,
    };

    const updated = {
      ...viewingCustomer,
      payment_history: [...(viewingCustomer.payment_history || []), newPayment],
      total_pending: Math.max(0, Number(viewingCustomer.total_pending || 0) - (paymentForm.type === "Pending Payment" ? amt : 0)),
    };

    setCustomers(customers.map(c => c.id === viewingCustomer.id ? updated : c));
    setViewingCustomer(updated);
    setIsPaymentModalOpen(false);
    setPaymentForm({ date: new Date().toISOString().split("T")[0], amount: "", method: "Cash", type: "Pending Payment", notes: "" });
    toast.success(`Payment of Rs. ${amt.toLocaleString()} recorded!`);
  };

  // ============ PROFILE VIEW ============
  if (viewingCustomer) {
    const c = customers.find(x => x.id === viewingCustomer.id) || viewingCustomer;
    const history = c.payment_history || [];
    const totalPaid = history.reduce((s: number, p: any) => s + Number(p.amount), 0);

    return (
      <div className="space-y-6">
        <button onClick={() => setViewingCustomer(null)} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-primary cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </button>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{c.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600 flex-wrap">
                <span className="flex items-center gap-1 font-digit"><Phone className="w-3 h-3" /> {c.phone}</span>
                {c.altPhone && <span className="font-digit">Alt: {c.altPhone}</span>}
                {c.email && <span>{c.email}</span>}
                {c.address && <span>📍 {c.address}</span>}
                {c.city && <span>🏙 {c.city}</span>}
              </div>
              {c.notes && (
                <p className="text-xs text-zinc-500 mt-2 bg-zinc-50 px-3 py-2 rounded">📝 {c.notes}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => sendWhatsApp(c.whatsapp || c.phone, c.name)} className="flex items-center gap-1 px-3 py-2 bg-success/10 hover:bg-success/20 text-success text-sm font-medium rounded-lg cursor-pointer">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button onClick={() => openEditModal(c)} className="flex items-center gap-1 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer">
                <Edit className="w-4 h-4" /> Edit Customer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-zinc-50 p-4 rounded-lg">
              <p className="text-xs text-zinc-500">Total Spent</p>
              <p className="text-xl font-bold text-zinc-900 font-digit mt-1">Rs. {Number(c.total_purchases || 0).toLocaleString()}</p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-lg">
              <p className="text-xs text-zinc-500">Total Paid</p>
              <p className="text-xl font-bold text-success font-digit mt-1">Rs. {totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-lg">
              <p className="text-xs text-zinc-500">Pending Balance</p>
              <p className={`text-xl font-bold font-digit mt-1 ${Number(c.total_pending) > 0 ? "text-danger" : "text-success"}`}>
                Rs. {Number(c.total_pending || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-lg">
              <p className="text-xs text-zinc-500">Credit Limit</p>
              <p className="text-sm text-zinc-700 font-digit mt-1">
                Rs. {Number(c.creditLimit || 0).toLocaleString()}
                {c.creditDays && <span className="block text-xs text-zinc-500 mt-0.5">{c.creditDays} days</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" /> Vehicles ({c.vehicles?.length || 0})
            </h2>
            <button
              onClick={() => openEditModal(c)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add / Manage Vehicles
            </button>
          </div>

          {(!c.vehicles || c.vehicles.length === 0) ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No vehicles yet. Click <strong>"Add / Manage Vehicles"</strong> above.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Vehicle No</th>
                  <th className="px-6 py-3 font-medium">Make</th>
                  <th className="px-6 py-3 font-medium">Model</th>
                  <th className="px-6 py-3 font-medium">Year</th>
                  <th className="px-6 py-3 font-medium">CAI File No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {c.vehicles.map((v: any) => (
                  <tr key={v.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 font-medium text-zinc-900 font-digit">{v.reg_no}</td>
                    <td className="px-6 py-4 text-zinc-600">{v.make}</td>
                    <td className="px-6 py-4 text-zinc-600">{v.model}</td>
                    <td className="px-6 py-4 text-zinc-600 font-digit">{v.year}</td>
                    <td className="px-6 py-4 text-primary font-digit">{v.cai_no || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Payment History ({history.length})
            </h2>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-success hover:bg-success-hover text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Payment
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No payments recorded yet.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Invoice #</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium">Notes</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {history.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 text-zinc-700 font-digit flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-zinc-400" /> {p.date}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-digit">{p.invoiceNo || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.type === "Pending Payment" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{p.method}</td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">{p.notes || "-"}</td>
                    <td className="px-6 py-4 text-right font-bold text-success font-digit">Rs. {Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Payment Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-zinc-900">Add Payment — {c.name}</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                    <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Amount (Rs.)</label>
                    <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Method</label>
                    <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm cursor-pointer font-digit">
                      <option>Cash</option>
                      <option>JazzCash</option>
                      <option>EasyPaisa</option>
                      <option>DIB</option>
                      <option>Meezan Bank</option>
                      <option>Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
                    <select value={paymentForm.type} onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm cursor-pointer font-digit">
                      <option>Pending Payment</option>
                      <option>Advance Payment</option>
                      <option>Adjustment</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Notes (optional)</label>
                  <input type="text" value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-success hover:bg-success-hover text-white text-sm font-medium rounded-lg cursor-pointer">Record Payment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ LIST VIEW ============
  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.altPhone?.includes(search) ||
    c.vehicles?.some((v: any) => v.reg_no?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Customers</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or vehicle no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
            />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Customer Name</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Vehicles</th>
              <th className="px-6 py-3 font-medium">Total Spent</th>
              <th className="px-6 py-3 font-medium text-danger">Pending</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-500">No customers found.</td></tr>
            ) : filtered.map((customer) => (
              <tr key={customer.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-900">
                  <button onClick={() => setViewingCustomer(customer)} className="hover:text-primary hover:underline cursor-pointer text-left">
                    {customer.name}
                  </button>
                </td>
                <td className="px-6 py-4 text-zinc-600 flex items-center gap-2 font-digit">
                  <Phone className="w-3 h-3 text-zinc-400" /> {customer.phone}
                </td>
                <td className="px-6 py-4 text-zinc-600">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="text-xs bg-zinc-100 hover:bg-primary/10 hover:text-primary px-2.5 py-1.5 rounded font-digit cursor-pointer flex items-center gap-1"
                  >
                    <Car className="w-3 h-3" /> {customer.vehicles?.length || 0} vehicle(s)
                  </button>
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900 font-digit">
                  Rs. {Number(customer.total_purchases || 0).toLocaleString()}
                </td>
                <td className={`px-6 py-4 font-bold font-digit ${Number(customer.total_pending || 0) > 0 ? "text-danger" : "text-success"}`}>
                  Rs. {Number(customer.total_pending || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => sendWhatsApp(customer.whatsapp || customer.phone, customer.name)} className="p-1.5 text-zinc-400 hover:text-success hover:bg-success/10 rounded-md cursor-pointer" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditModal(customer)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-zinc-400 hover:text-danger hover:bg-danger/10 rounded-md cursor-pointer" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============ ADD / EDIT CUSTOMER MODAL (ILShop layout) ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl my-8">
            <div className="flex items-center gap-3 p-5 border-b border-zinc-200">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center text-orange-600">
                <UserPlus className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {editing ? "Edit Customer" : "Add Customer"}
              </h2>
              <button onClick={closeModal} className="ml-auto text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Row 1: Name + Mobile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Customer Name</label>
                  <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-orange-300 rounded focus:ring-1 focus:ring-orange-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Mobile Number</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
                </div>
              </div>

              {/* Row 2: Alt Mobile + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Alternate Mobile</label>
                  <input type="tel" value={form.altPhone} onChange={e => setForm({ ...form, altPhone: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              {/* Row 3: Address + City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">City</label>
                  <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              {/* Row 4: Opening Receivable + Credit Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Opening Receivable</label>
                  <input type="number" value={form.openingReceivable} onChange={e => setForm({ ...form, openingReceivable: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Credit Limit</label>
                  <input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
                </div>
              </div>

              {/* Row 5: Credit Days + Loyalty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Credit Days</label>
                  <input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Loyalty</label>
                  <select value={form.loyalty} onChange={e => setForm({ ...form, loyalty: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded cursor-pointer">
                    <option>Standard</option>
                    <option>Silver</option>
                    <option>Gold</option>
                    <option>Platinum</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded cursor-pointer">
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Blocked</option>
                </select>
              </div>

              {/* Vehicles Section */}
              <div className="border-t border-zinc-200 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" /> Vehicles ({modalVehicles.length})
                  </h3>
                  <button type="button" onClick={() => openVehicleForm(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Vehicle
                  </button>
                </div>

                {modalVehicles.length === 0 ? (
                  <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-lg p-6 text-center text-sm text-zinc-500">
                    No vehicles yet. Click <strong>Add Vehicle</strong>.
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 font-medium">Vehicle No</th>
                          <th className="px-4 py-2 font-medium">Make / Model</th>
                          <th className="px-4 py-2 font-medium">Year</th>
                          <th className="px-4 py-2 font-medium">CAI File No</th>
                          <th className="px-4 py-2 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {modalVehicles.map((v, idx) => (
                          <tr key={v.id}>
                            <td className="px-4 py-2.5 font-medium text-zinc-900 font-digit">{v.reg_no}</td>
                            <td className="px-4 py-2.5 text-zinc-600">{v.make} {v.model}</td>
                            <td className="px-4 py-2.5 text-zinc-600 font-digit">{v.year}</td>
                            <td className="px-4 py-2.5 text-primary font-digit">{v.cai_no || "-"}</td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => openVehicleForm(idx)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded cursor-pointer">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => removeVehicleFromModal(idx)} className="p-1.5 text-zinc-400 hover:text-danger hover:bg-danger/10 rounded cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded cursor-pointer">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded cursor-pointer">
                  <UserPlus className="w-4 h-4" /> {editing ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Sub-Modal */}
      {isVehicleFormOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                {editingVehicleIndex !== null ? "Edit Vehicle" : "Add Vehicle"}
              </h2>
              <button type="button" onClick={() => setIsVehicleFormOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Vehicle Number</label>
                <input required type="text" value={vehicleForm.reg_no} onChange={e => setVehicleForm({ ...vehicleForm, reg_no: e.target.value })} placeholder="e.g. ABC-123" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Make</label>
                  <input type="text" value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} placeholder="Toyota" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Model</label>
                  <input type="text" value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="Corolla" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Year</label>
                  <input type="text" value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })} placeholder="2020" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">CAI File No</label>
                  <input type="text" value={vehicleForm.cai_no} onChange={e => setVehicleForm({ ...vehicleForm, cai_no: e.target.value })} placeholder="e.g. CAI-001" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsVehicleFormOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer">Cancel</button>
                <button type="button" onClick={saveVehicle} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
                  {editingVehicleIndex !== null ? "Update Vehicle" : "Add Vehicle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}