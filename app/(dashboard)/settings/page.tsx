"use client";

import { useState, useEffect } from "react";
import { Save, Store, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Settings {
  businessName: string;
  phone: string;
  contactPerson: string;
  contactPhone: string;
  whatsapp: string;
  address: string;
  paymentTemplate: string;
  oilTemplate1: string;
  oilTemplate2: string;
  pendingPaymentTemplate: string;
  purchaseTemplate: string;
  wasteMethod: string;
  wastePercent: string;
}

const defaultSettings: Settings = {
  businessName: "Concept Autos",
  phone: "0317.80.81.82.1",
  contactPerson: "Khalil ur Rehman",
  contactPhone: "03062876599",
  whatsapp: "03394303099",
  address: "Main Boulevard Gulberg III, Lahore",
  paymentTemplate: `AOA {name}, Concept Autos ki taraf se reminder hai ke aapke account mein Rs. {amount} pending hain. Kindly payment clear kar dein. Thank you.

📞 Contact: Khalil ur Rehman 03062876599`,
  oilTemplate1: `🚗 *Concept Autos – Haroonabad*

Hi *{name}*, your vehicle *{vehicle}* is due for an oil change.

🛢️ Last Change: {last_date}
📅 Due: {due_date}

Please visit *Concept Autos & Oil Change Point* for your next service.

📞 {phone}

Thank you for choosing us! 🔧`,
  oilTemplate2: `🚗 *Concept Autos & Oil Change Point*

Assalam-o-Alaikum *{name}*,

Your vehicle *{vehicle}* is due for its next *oil change/service*.

🛢️ Last Oil Change: *{last_date}*
📅 Recommended Next Change: *{due_date}*
🚘 Vehicle: *{model}*

Please visit *Concept Autos & Oil Change Point, Haroonabad* for your next oil change.

📞 Contact: *{phone}*

Thank you for choosing *Concept Autos*! 🔧`,
  pendingPaymentTemplate: `🚗 *Concept Autos & Oil Change Point – Haroonabad*

Assalam-o-Alaikum *{name}*,

This is a friendly reminder that a payment of *Rs. {amount}* is currently pending for your vehicle *{vehicle}*.

🧾 Invoice No: *{invoice_no}*
📅 Invoice Date: *{invoice_date}*
💰 Pending Amount: *Rs. {amount}*

Please clear the outstanding amount at your convenience.

Thank you for choosing *Concept Autos*. 🔧`,
  purchaseTemplate: `🚗 *Concept Autos & Oil Change Point – Haroonabad*

Assalam-o-Alaikum *{name}*,

Thank you for your purchase from *Concept Autos*! 🙏

🧾 Invoice No: *{invoice_no}*
🚘 Vehicle: *{vehicle}*
🛒 Purchase Amount: *Rs. {amount}*
📅 Date: *{date}*

We appreciate your trust and look forward to serving you again.

*Concept Autos & Oil Change Point* 🔧

📎 Your invoice is attached below.`,
  wasteMethod: "Fixed Percentage (%)",
  wastePercent: "95",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("store");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("concept_autos_settings");
    if (stored) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }); } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("concept_autos_settings", JSON.stringify(settings));
    toast.success("Settings saved successfully!");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Settings</h1>

      <div className="flex border-b border-zinc-200 gap-6 flex-wrap">
        <button onClick={() => setActiveTab("store")} className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'store' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-900'}`}>Store Info</button>
        <button onClick={() => setActiveTab("whatsapp")} className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'whatsapp' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-900'}`}>WhatsApp Templates</button>
        <button onClick={() => setActiveTab("waste")} className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'waste' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-900'}`}>Waste Oil Rules</button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
        {activeTab === "store" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Store className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-zinc-900">Store Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Business Name</label>
                <input type="text" value={settings.businessName} onChange={e => setSettings({...settings, businessName: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Store Phone</label>
                <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Contact Person</label>
                <input type="text" value={settings.contactPerson} onChange={e => setSettings({...settings, contactPerson: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Contact Phone</label>
                <input type="text" value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">WhatsApp Number</label>
                <input type="text" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Address</label>
                <input type="text" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
                <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Info"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-zinc-900">WhatsApp Message Templates</h2>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-xs text-primary">
              <strong>Available Placeholders:</strong> Auto-replaced when sending.
              <div className="grid grid-cols-4 gap-2 mt-2 font-mono">
                <span>{`{name}`} → Customer name</span>
                <span>{`{vehicle}`} → Vehicle No.</span>
                <span>{`{model}`} → Model</span>
                <span>{`{amount}`} → Amount</span>
                <span>{`{invoice_no}`} → Invoice #</span>
                <span>{`{invoice_date}`} → Invoice date</span>
                <span>{`{date}`} → Today's date</span>
                <span>{`{last_date}`} → Last oil change</span>
                <span>{`{due_date}`} → Due date</span>
                <span>{`{phone}`} → Your WhatsApp #</span>
              </div>
            </div>

            {/* 1. Purchase Thank-You Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">1. Purchase Thank-You (Auto-sent after checkout)</label>
              </div>
              <textarea rows={12} value={settings.purchaseTemplate} onChange={e => setSettings({...settings, purchaseTemplate: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"></textarea>
            </div>

            {/* 2. Pending Payment Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">2. Pending Payment Reminder</label>
              </div>
              <textarea rows={12} value={settings.pendingPaymentTemplate} onChange={e => setSettings({...settings, pendingPaymentTemplate: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"></textarea>
            </div>

            {/* 3. Oil Template 1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">3. Oil Change Reminder — Short</label>
              </div>
              <textarea rows={10} value={settings.oilTemplate1} onChange={e => setSettings({...settings, oilTemplate1: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"></textarea>
            </div>

            {/* 4. Oil Template 2 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">4. Oil Change Reminder — Detailed</label>
              </div>
              <textarea rows={12} value={settings.oilTemplate2} onChange={e => setSettings({...settings, oilTemplate2: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
                <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Templates"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "waste" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-zinc-900">Waste Oil Estimation Rules</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Estimation Method</label>
                <select value={settings.wasteMethod} onChange={e => setSettings({...settings, wasteMethod: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer">
                  <option>Fixed Percentage (%)</option>
                  <option>Fixed Amount (L)</option>
                  <option>Manual Entry Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Default Percentage (%)</label>
                <input type="number" value={settings.wastePercent} onChange={e => setSettings({...settings, wastePercent: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
                <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Rules"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}