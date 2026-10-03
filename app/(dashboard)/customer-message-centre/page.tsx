"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Copy, MessageCircle, Phone, RefreshCw, Search, User, Car } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  body: string;
}

const TEMPLATES: Template[] = [
  {
    id: "professional",
    name: "Professional Greeting",
    body: `Assalam-o-Alaikum *{name}*,

Warm greetings from *{store}*. We hope you and your family are doing well.

We remain available for genuine spare parts, engine oil, filters, routine maintenance and workshop support for your *{vehicle}* ({registration}).

For assistance or an appointment, reply to this message or call *{phone}*.
Location: {address}

Kind regards,
*{store}*`,
  },
  {
    id: "service",
    name: "Detailed Service Reminder",
    body: `Assalam-o-Alaikum *{name}*,

This is a courteous maintenance reminder from *{store}* for your *{vehicle}* (Registration: {registration}).

*Vehicle service information*
• Last recorded service: {last_service}
• Recommended next service date: {next_service}
• Recommended next mileage: {next_mileage} km
• Previous job reference: {last_job}

Timely oil, filter and safety inspections help protect engine performance, fuel economy and vehicle reliability. Please reply with your preferred date/time, or call *{phone}* to book your visit.

Workshop location: {address}

Regards,
*{store}*`,
  },
  {
    id: "oil",
    name: "Oil Change Reminder",
    body: `Assalam-o-Alaikum *{name}*,

Your vehicle *{vehicle}* ({registration}) is due for its next *oil change*.

Last oil change: {last_service}
Next recommended: {next_service}
Current mileage reading: {next_mileage} km

Please visit *{store}* at your earliest convenience. Call *{phone}* to book your slot.

{address}

Thank you for choosing *{store}*! 🔧`,
  },
  {
    id: "payment",
    name: "Professional Payment Reminder",
    body: `Assalam-o-Alaikum *{name}*,

This is a polite reminder regarding your outstanding balance of *Rs. {balance}* with *{store}*.

Open invoices: {open_invoices}
Days overdue: {days_overdue}

Kindly clear the pending amount at your convenience. If you have any questions, please call *{phone}*.

Thank you for your business.

Regards,
*{store}*`,
  },
  {
    id: "ready",
    name: "Vehicle Ready for Collection",
    body: `Assalam-o-Alaikum *{name}*,

Your vehicle *{vehicle}* ({registration}) is ready for collection at *{store}*.

Please visit us during working hours. For any clarification, call *{phone}*.

{address}

Thank you! 🔧`,
  },
  {
    id: "thanks",
    name: "Detailed Thank You",
    body: `Assalam-o-Alaikum *{name}*,

Thank you for choosing *{store}* for your *{vehicle}* ({registration})!

Your visit on {last_service} is highly appreciated. We hope everything is running smoothly.

Looking forward to serving you again.

Regards,
*{store}*
{phone}`,
  },
  {
    id: "feedback",
    name: "Professional Feedback Request",
    body: `Assalam-o-Alaikum *{name}*,

We value your feedback! How was your recent experience at *{store}*?

Please reply with your thoughts or rate us. Your input helps us improve.

Regards,
*{store}*`,
  },
];

const STORE = {
  name: "Concept Autos",
  phone: "0306-2876599",
  whatsapp: "0339-4303099",
  address: "Site No 39,40 Old Nadra Office Road Zia Shaheed Chowk Haroonabad",
};

export default function CustomerMessageCentre() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("professional");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live search
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============ LOAD DATA ============
  const loadData = async () => {
    setIsLoading(true);

    let loadedCustomers: any[] = [];
    const storedCustomers = localStorage.getItem("concept_autos_customers");
    if (storedCustomers) {
      try { loadedCustomers = JSON.parse(storedCustomers); } catch {}
    }
    if (loadedCustomers.length === 0) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers.php`);
        const data = await res.json();
        if (Array.isArray(data)) loadedCustomers = data;
      } catch {}
    }
    setCustomers(loadedCustomers);

    let loadedInvoices: any[] = [];
    const storedInvoices = localStorage.getItem("concept_autos_invoices");
    if (storedInvoices) {
      try { loadedInvoices = JSON.parse(storedInvoices); } catch {}
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices.php`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const seen = new Set(loadedInvoices.map((i: any) => i.invoiceNo));
        data.forEach((inv: any) => {
          if (!seen.has(inv.invoiceNo)) loadedInvoices.push(inv);
        });
      }
    } catch {}
    setInvoices(loadedInvoices);

    if (loadedCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(loadedCustomers[0].id);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside
  useEffect(() => {
    function h(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId);

  // ============ LIVE SEARCH ============
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    // Return both customer matches and vehicle matches
    const results: any[] = [];

    customers.forEach(c => {
      const nameMatch = c.name?.toLowerCase().includes(q);
      const phoneMatch = c.phone?.includes(q) || c.whatsapp?.includes(q);

      // Match by customer name or phone
      if (nameMatch || phoneMatch) {
        results.push({
          type: "customer",
          customer: c,
          label: c.name,
          sub: c.phone,
        });
      }

      // Match by vehicle
      (c.vehicles || []).forEach((v: any) => {
        if (
          v.reg_no?.toLowerCase().includes(q) ||
          v.make?.toLowerCase().includes(q) ||
          v.model?.toLowerCase().includes(q)
        ) {
          results.push({
            type: "vehicle",
            customer: c,
            vehicle: v,
            label: `${v.reg_no} — ${c.name}`,
            sub: `${v.make || ""} ${v.model || ""}`.trim() || c.phone,
          });
        }
      });
    });

    return results.slice(0, 10);
  }, [searchQuery, customers]);

  // ============ COMPUTE CUSTOMER STATS ============
  const customerStats = useMemo(() => {
    if (!selectedCustomer) {
      return {
        last_service: "Not recorded",
        next_service: "Not scheduled",
        next_mileage: "Not recorded",
        last_job: "Not recorded",
        visits: "0",
        balance: "0",
        open_invoices: "0",
        days_overdue: "0",
      };
    }

    const customerInvoices = invoices
      .filter(inv =>
        inv.customerName?.toLowerCase() === selectedCustomer.name?.toLowerCase() ||
        inv.customerPhone === selectedCustomer.phone ||
        inv.customerPhone === selectedCustomer.whatsapp
      )
      .sort((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return db - da;
      });

    const lastOilChangeInvoice = customerInvoices.find(inv => {
      const hasOil = (inv.items || []).some((it: any) => it.oilUsedL);
      return inv.nextOilChange || inv.currentOdometer || hasOil;
    });

    let last_service = "Not recorded";
    let next_service = "Not scheduled";
    let next_mileage = "Not recorded";
    let last_job = "Not recorded";

    if (lastOilChangeInvoice) {
      last_service = lastOilChangeInvoice.date || "Not recorded";
      last_job = lastOilChangeInvoice.invoiceNo || "Not recorded";

      if (lastOilChangeInvoice.nextOilChange) {
        next_mileage = `${Number(lastOilChangeInvoice.nextOilChange).toLocaleString()} km`;
        next_service = `When odometer reaches ${next_mileage}`;
      }
      if (!lastOilChangeInvoice.nextOilChange && lastOilChangeInvoice.currentOdometer) {
        next_mileage = `${Number(lastOilChangeInvoice.currentOdometer).toLocaleString()} km (current)`;
      }
    }

    const balance = Number(selectedCustomer.total_pending || 0);
    const openInvoices = customerInvoices.filter(inv => Number(inv.pending || 0) > 0);

    let days_overdue = "0";
    if (openInvoices.length > 0) {
      const oldest = openInvoices.reduce((oldest, inv) => {
        const d = new Date(inv.date).getTime() || Infinity;
        return d < (new Date(oldest.date).getTime() || Infinity) ? inv : oldest;
      }, openInvoices[0]);
      const days = Math.floor(
        (Date.now() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      days_overdue = days > 0 ? String(days) : "0";
    }

    return {
      last_service,
      next_service,
      next_mileage,
      last_job,
      visits: String(customerInvoices.length),
      balance: balance.toLocaleString(),
      open_invoices: String(openInvoices.length),
      days_overdue,
    };
  }, [selectedCustomer, invoices]);

  // ============ BUILD MESSAGE ============
  const buildMessage = (customer: any, template: Template, vehicle: any): string => {
    if (!customer) return template.body;

    const values: Record<string, string> = {
      name: customer.name || "Valued Customer",
      vehicle: vehicle
        ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Vehicle"
        : "Vehicle",
      registration: vehicle?.reg_no || customer.vehicles?.[0]?.reg_no || "Not recorded",
      last_service: customerStats.last_service,
      next_service: customerStats.next_service,
      next_mileage: customerStats.next_mileage,
      last_job: customerStats.last_job,
      visits: customerStats.visits,
      balance: customerStats.balance,
      open_invoices: customerStats.open_invoices,
      days_overdue: customerStats.days_overdue,
      today: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      store: STORE.name,
      phone: STORE.whatsapp,
      address: STORE.address,
    };

    let result = template.body;
    Object.entries(values).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{${k}}`, "g"), v);
    });
    return result;
  };

  useEffect(() => {
    if (selectedTemplate) {
      const vehicle = selectedVehicleId
        ? (selectedCustomer?.vehicles || []).find((v: any) => v.id === selectedVehicleId)
        : selectedCustomer?.vehicles?.[0];
      setMessage(buildMessage(selectedCustomer, selectedTemplate, vehicle));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, selectedVehicleId, selectedTemplateId, customerStats]);

  // ============ HANDLERS ============
  const selectCustomer = (customer: any, vehicle?: any) => {
    setSelectedCustomerId(customer.id);
    setSelectedVehicleId(vehicle?.id || (customer.vehicles?.[0]?.id ?? null));
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success("Message copied!");
  };

  const normalizePhone = (phone: string) => {
    let p = (phone || "").replace(/\D/g, "");
    if (p.startsWith("0")) p = "92" + p.slice(1);
    if (!p.startsWith("92")) p = "92" + p;
    return p;
  };

  const handleCopyWaLink = () => {
    if (!selectedCustomer) return toast.error("Select a customer first");
    const phone = selectedCustomer.whatsapp || selectedCustomer.phone;
    if (!phone) return toast.error("Customer has no phone");
    const url = `https://api.whatsapp.com/send?phone=${normalizePhone(phone)}&text=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(url);
    toast.success("WhatsApp link copied!");
  };

  const handleOpenWhatsApp = () => {
    if (!selectedCustomer) return toast.error("Select a customer first");
    const phone = selectedCustomer.whatsapp || selectedCustomer.phone;
    if (!phone) return toast.error("Customer has no phone");
    window.open(
      `https://api.whatsapp.com/send?phone=${normalizePhone(phone)}&text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const selectedVehicle = selectedVehicleId
    ? selectedCustomer?.vehicles?.find((v: any) => v.id === selectedVehicleId)
    : selectedCustomer?.vehicles?.[0];

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <span className="text-2xl">📣</span> Customer Message Centre
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-lg cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => history.back()}
            className="p-2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-500">
          Loading customers and invoices...
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-6">
          {/* ============ RECIPIENT — LIVE SEARCH ============ */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">
              Select Recipient (search by name, phone, or vehicle)
            </h2>
            <div className="relative" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search customer name, mobile, or vehicle no..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-digit"
              />

              {/* Live search dropdown */}
              {showDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500 text-center">
                      No matches for "{searchQuery}"
                    </div>
                  ) : (
                    searchResults.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => selectCustomer(r.customer, r.vehicle)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0 flex items-center gap-3"
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            r.type === "customer"
                              ? "bg-primary/10 text-primary"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {r.type === "customer" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Car className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {r.label}
                          </p>
                          <p className="text-xs text-zinc-500 font-digit truncate">
                            {r.sub}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Currently selected customer/vehicle chip */}
            {selectedCustomer && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {selectedCustomer.name}
                  </span>
                  <span className="text-xs text-primary/70 font-digit">
                    {selectedCustomer.phone}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCustomerId(null);
                      setSelectedVehicleId(null);
                      setSearchQuery("");
                    }}
                    className="text-primary/60 hover:text-primary cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedVehicle && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
                    <Car className="w-3.5 h-3.5 text-success" />
                    <span className="text-sm font-medium text-success font-digit">
                      {selectedVehicle.reg_no}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle selector (if customer has multiple vehicles) */}
            {selectedCustomer && (selectedCustomer.vehicles || []).length > 1 && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Vehicle (for message placeholders)
                </label>
                <select
                  value={selectedVehicleId || ""}
                  onChange={e => setSelectedVehicleId(Number(e.target.value))}
                  className="w-full sm:w-64 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit cursor-pointer"
                >
                  {(selectedCustomer.vehicles || []).map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.reg_no} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Stats preview */}
            {selectedCustomer && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                  <p className="text-zinc-500">Last Service</p>
                  <p className="font-semibold text-zinc-900 font-digit mt-0.5">
                    {customerStats.last_service}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                  <p className="text-zinc-500">Next Due</p>
                  <p className="font-semibold text-zinc-900 font-digit mt-0.5 truncate">
                    {customerStats.next_service}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                  <p className="text-zinc-500">Visits</p>
                  <p className="font-semibold text-zinc-900 font-digit mt-0.5">
                    {customerStats.visits}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                  <p className="text-zinc-500">Pending</p>
                  <p
                    className={`font-semibold font-digit mt-0.5 ${
                      Number(selectedCustomer.total_pending) > 0
                        ? "text-danger"
                        : "text-success"
                    }`}
                  >
                    Rs. {Number(selectedCustomer.total_pending || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ============ TEMPLATES ============ */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">
              Professional Message Templates
            </h2>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    selectedTemplateId === t.id
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic fields info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800 flex items-start gap-2">
            <span className="font-mono text-blue-600">ℹ</span>
            <span>
              <strong>Dynamic fields:</strong>{" "}
              <code className="font-mono">{`{name}`}</code>,{" "}
              <code className="font-mono">{`{vehicle}`}</code>,{" "}
              <code className="font-mono">{`{registration}`}</code>,{" "}
              <code className="font-mono">{`{last_service}`}</code>,{" "}
              <code className="font-mono">{`{next_service}`}</code>,{" "}
              <code className="font-mono">{`{next_mileage}`}</code>,{" "}
              <code className="font-mono">{`{last_job}`}</code>,{" "}
              <code className="font-mono">{`{visits}`}</code>,{" "}
              <code className="font-mono">{`{balance}`}</code>,{" "}
              <code className="font-mono">{`{open_invoices}`}</code>,{" "}
              <code className="font-mono">{`{days_overdue}`}</code>,{" "}
              <code className="font-mono">{`{today}`}</code>,{" "}
              <code className="font-mono">{`{store}`}</code>,{" "}
              <code className="font-mono">{`{phone}`}</code>,{" "}
              <code className="font-mono">{`{address}`}</code>
            </span>
          </div>

          {/* Editable message */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">Editable Message</h2>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono"
            />
            <p className="text-xs text-zinc-400 mt-1 font-digit">
              {message.length} characters · {message.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">Customer Preview</h2>
            <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-lg p-4 text-sm whitespace-pre-wrap text-zinc-700 max-h-64 overflow-y-auto">
              {message}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              onClick={() => history.back()}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer"
            >
              <Copy className="w-4 h-4" /> Copy Message
            </button>
            <button
              onClick={handleCopyWaLink}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" /> Copy WhatsApp Link
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer"
            >
              <Phone className="w-4 h-4" /> Open WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}