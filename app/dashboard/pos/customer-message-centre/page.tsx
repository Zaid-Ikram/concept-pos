"use client";

import { useState, useEffect } from "react";
import { X, Copy, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  body: string;
}

const TEMPLATES: Template[] = [
  { id: "professional", name: "Professional Greeting", body: `Assalam-o-Alaikum *{name}*,\n\nWarm greetings from *{store}*. We hope you and your family are doing well.\n\nWe remain available for genuine spare parts, engine oil, filters, routine maintenance and workshop support for your *{vehicle}* ({registration}).\n\nFor assistance or an appointment, reply to this message or call *{phone}*.\nLocation: {address}\n\nKind regards,\n*{store}*` },
  { id: "service", name: "Detailed Service Reminder", body: `Assalam-o-Alaikum *{name}*,\n\nThis is a courteous maintenance reminder from *{store}* for your *{vehicle}* (Registration: {registration}).\n\n*Vehicle service information*\n• Last recorded service: {last_service}\n• Recommended next service date: {next_service}\n• Recommended next mileage: {next_mileage} km\n• Previous job reference: {last_job}\n\nTimely oil, filter and safety inspections help protect engine performance, fuel economy and vehicle reliability. Please reply with your preferred date/time, or call *{phone}* to book your visit.\n\nWorkshop location: {address}\n\nRegards,\n*{store}*` },
  { id: "oil", name: "Oil Change Reminder", body: `Assalam-o-Alaikum *{name}*,\n\nYour vehicle *{vehicle}* ({registration}) is due for its next *oil change*.\n\nLast oil change: {last_service}\nNext recommended: {next_service}\nCurrent mileage reading: {next_mileage} km\n\nPlease visit *{store}* at your earliest convenience. Call *{phone}* to book your slot.\n\n{address}\n\nThank you for choosing *{store}*! 🔧` },
  { id: "payment", name: "Professional Payment Reminder", body: `Assalam-o-Alaikum *{name}*,\n\nThis is a polite reminder regarding your outstanding balance of *Rs. {balance}* with *{store}*.\n\nOpen invoices: {open_invoices}\nDays overdue: {days_overdue}\n\nKindly clear the pending amount at your convenience. If you have any questions, please call *{phone}*.\n\nThank you for your business.\n\nRegards,\n*{store}*` },
  { id: "ready", name: "Vehicle Ready for Collection", body: `Assalam-o-Alaikum *{name}*,\n\nYour vehicle *{vehicle}* ({registration}) is ready for collection at *{store}*.\n\nPlease visit us during working hours. For any clarification, call *{phone}*.\n\n{address}\n\nThank you! 🔧` },
  { id: "quote", name: "Quotation Follow-up", body: `Assalam-o-Alaikum *{name}*,\n\nWe hope you received the quotation for your *{vehicle}*. Do let us know if you'd like to proceed or need any modifications.\n\nCall *{phone}* anytime for questions.\n\nRegards,\n*{store}*` },
  { id: "thanks", name: "Detailed Thank You", body: `Assalam-o-Alaikum *{name}*,\n\nThank you for choosing *{store}* for your *{vehicle}* ({registration})!\n\nYour visit on {last_service} is highly appreciated. We hope everything is running smoothly.\n\nLooking forward to serving you again.\n\nRegards,\n*{store}*\n{phone}` },
  { id: "feedback", name: "Professional Feedback Request", body: `Assalam-o-Alaikum *{name}*,\n\nWe value your feedback! How was your recent experience at *{store}*?\n\nPlease reply with your thoughts or rate us. Your input helps us improve.\n\nRegards,\n*{store}*` },
  { id: "parts", name: "Parts & Service Campaign", body: `Assalam-o-Alaikum *{name}*,\n\n*{store}* is running a special service campaign for your *{vehicle}* ({registration})!\n\nCall *{phone}* to know more.\n\n{address}` },
  { id: "ramadan", name: "Ramadan Greeting", body: `Assalam-o-Alaikum *{name}*,\n\nRamadan Mubarak from *{store}*! May this holy month bring peace and blessings to you and your family.\n\nRegards,\n*{store}*` },
  { id: "eidfitr", name: "Eid-ul-Fitr Greeting", body: `Assalam-o-Alaikum *{name}*,\n\nEid Mubarak from *{store}*! May this joyous occasion bring happiness and prosperity to your family.\n\nRegards,\n*{store}*` },
  { id: "eidadha", name: "Eid-ul-Adha Greeting", body: `Assalam-o-Alaikum *{name}*,\n\nEid-ul-Adha Mubarak from *{store}*! Wishing you and your loved ones a blessed Eid.\n\nRegards,\n*{store}*` },
  { id: "newyear", name: "New Year Greeting", body: `Assalam-o-Alaikum *{name}*,\n\nHappy New Year from *{store}*! Wishing you a prosperous year ahead.\n\nRegards,\n*{store}*` },
  { id: "pakistan", name: "Pakistan Day Greeting", body: `Assalam-o-Alaikum *{name}*,\n\nHappy Pakistan Day from *{store}*! 🇵🇰\n\nRegards,\n*{store}*` },
  { id: "independence", name: "Independence Day Greeting", body: `Assalam-o-Alaikum *{name}*,\n\nHappy Independence Day from *{store}*! 🇵🇰\n\nRegards,\n*{store}*` },
];

export default function CustomerMessageCentre() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("professional");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("concept_autos_customers");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCustomers(data);
        if (data.length > 0) setSelectedCustomerId(data[0].id);
      } catch {}
    }
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId);

  // Build dynamic message with real values
  const buildMessage = (customer: any, template: Template) => {
    if (!customer) return template.body;
    const vehicle = customer.vehicles?.[0];
    const store = "360 AUTOS";
    const phone = "03062876599";
    const address = "Main Boulevard Gulberg III, Lahore";

    const values: Record<string, string> = {
      name: customer.name || "Valued Customer",
      vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle",
      registration: vehicle?.reg_no || "Not recorded",
      last_service: customer.payment_history?.[0]?.date || "Not recorded",
      next_service: "Not scheduled",
      next_mileage: vehicle?.current_mileage || "Not recorded",
      last_job: customer.cai_numbers?.[customer.cai_numbers.length - 1] || "Not recorded",
      visits: String(customer.payment_history?.length || 0),
      balance: Number(customer.total_pending || 0).toLocaleString(),
      open_invoices: String(customer.payment_history?.filter((p: any) => p.type === "Pending Payment").length || 0),
      days_overdue: "0",
      today: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      store,
      phone,
      address,
    };

    let result = template.body;
    Object.entries(values).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{${k}}`, "g"), v);
    });
    return result;
  };

  // Update message when customer or template changes
  useEffect(() => {
    if (selectedTemplate) {
      setMessage(buildMessage(selectedCustomer, selectedTemplate));
    }
  }, [selectedCustomerId, selectedTemplateId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success("Message copied!");
  };

  const handleCopyWaLink = () => {
    if (!selectedCustomer) return toast.error("Select a customer first");
    const phone = (selectedCustomer.whatsapp || selectedCustomer.phone || "").replace(/\D/g, "");
    let p = phone;
    if (p.startsWith("0")) p = "92" + p.slice(1);
    if (!p.startsWith("92")) p = "92" + p;
    const url = `https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(url);
    toast.success("WhatsApp link copied!");
  };

  const handleOpenWhatsApp = () => {
    if (!selectedCustomer) return toast.error("Select a customer first");
    const phone = (selectedCustomer.whatsapp || selectedCustomer.phone || "").replace(/\D/g, "");
    let p = phone;
    if (p.startsWith("0")) p = "92" + p.slice(1);
    if (!p.startsWith("92")) p = "92" + p;
    window.open(`https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <span className="text-2xl">📣</span> Customer Message Centre
        </h1>
        <button onClick={() => history.back()} className="p-2 text-zinc-400 hover:text-zinc-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-6">
        {/* Recipient */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Select Recipient</h2>
          <div className="relative">
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 border-2 border-amber-300 rounded-lg bg-white text-left text-sm focus:outline-none"
            >
              {selectedCustomer ? (
                <span className="text-zinc-900">
                  <span className="font-medium">{selectedCustomer.name}</span>
                  <span className="text-zinc-500 font-digit ml-2">- {selectedCustomer.phone}</span>
                </span>
              ) : (
                <span className="text-zinc-400">Select customer</span>
              )}
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {customers.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-500 text-center">No customers. Add one first.</div>
                ) : customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedCustomerId(c.id); setShowCustomerDropdown(false); }}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0"
                  >
                    <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                    <p className="text-xs text-zinc-500 font-digit">{c.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template chips */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Professional Message Template</h2>
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
            <code className="font-mono">{`{name}`}</code>, <code className="font-mono">{`{vehicle}`}</code>, <code className="font-mono">{`{registration}`}</code>, <code className="font-mono">{`{last_service}`}</code>, <code className="font-mono">{`{next_service}`}</code>, <code className="font-mono">{`{next_mileage}`}</code>, <code className="font-mono">{`{last_job}`}</code>, <code className="font-mono">{`{visits}`}</code>, <code className="font-mono">{`{balance}`}</code>, <code className="font-mono">{`{open_invoices}`}</code>, <code className="font-mono">{`{days_overdue}`}</code>, <code className="font-mono">{`{today}`}</code>, <code className="font-mono">{`{store}`}</code>, <code className="font-mono">{`{phone}`}</code>, <code className="font-mono">{`{address}`}</code>
          </span>
        </div>

        {/* Editable Message */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Editable Message</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono"
          />
          <p className="text-xs text-zinc-400 mt-1 font-digit">{message.length} characters · {message.split(/\s+/).length} words</p>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Customer Preview</h2>
          <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-lg p-4 text-sm whitespace-pre-wrap text-zinc-700 max-h-64 overflow-y-auto">
            {message}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
          <button onClick={() => history.back()} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer">
            Cancel
          </button>
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer">
            <Copy className="w-4 h-4" /> Copy Message
          </button>
          <button onClick={handleCopyWaLink} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer">
            <MessageCircle className="w-4 h-4" /> Copy WhatsApp Link
          </button>
          <button onClick={handleOpenWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer">
            <Phone className="w-4 h-4" /> Open WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}