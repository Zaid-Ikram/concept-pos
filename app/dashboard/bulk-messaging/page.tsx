"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Plus, CreditCard, Trash2, Minus, User, MessageCircle,
  Calendar, X, Edit, Droplets, ShoppingCart, Car, History, FileDown
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CheckPriceModal from "@/components/modals/CheckPriceModal";
import jsPDF from "jspdf";

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerType, setCustomerType] = useState<"walk-in" | "saved">("walk-in");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);

  const [isCheckPriceOpen, setIsCheckPriceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [paymentType, setPaymentType] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState<number | "">("");
  const [discount, setDiscount] = useState<number | "">("");
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [payLaterDate, setPayLaterDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {});

    const stored = localStorage.getItem("concept_autos_customers");
    if (stored) {
      try { setCustomers(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem("concept_autos_customers", JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target as Node)) setShowVehicleDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const p = () => setIsCheckPriceOpen(true);
    const h = () => setIsHistoryOpen(true);
    window.addEventListener("open-check-price", p);
    window.addEventListener("open-invoice-history", h);
    return () => {
      window.removeEventListener("open-check-price", p);
      window.removeEventListener("open-invoice-history", h);
    };
  }, []);

  const isOilProduct = (p: any) => p.category?.toLowerCase().includes("oil") || p.stock_ml > 0;

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.includes(searchQuery)
  );

  const allVehicles = customers.flatMap(c =>
    (c.vehicles || []).map((v: any) => ({ ...v, customer: c }))
  );

  const filteredVehicles = vehicleSearch.length > 0
    ? allVehicles.filter(v => v.reg_no?.toLowerCase().includes(vehicleSearch.toLowerCase()))
    : [];

  const allInvoices: any[] = (() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("concept_autos_invoices");
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  })();

  const filteredInvoices = historySearch.length > 0
    ? allInvoices.filter(inv =>
        inv.customerName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.vehicle?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.invoiceNo?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : allInvoices;

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item =>
        item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
      );
      return [...prev, { product, qty: 1, unitPrice: Number(product.sale_price), oilUsedL: "", mileage: "", interval: "5000" }];
    });
    setSearchQuery("");
    setShowDropdown(false);
    toast.success(`${product.name} added`);
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const updateOilField = (id: number, field: string, value: string) => {
    setCart(prev => prev.map(item => item.product.id === id ? { ...item, [field]: value } : item));
  };

  const updateUnitPrice = (id: number, price: number) => {
    setCart(prev => prev.map(item => item.product.id === id ? { ...item, unitPrice: price } : item));
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.product.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + Number(item.unitPrice || 0) * item.qty, 0);
  const discountAmount = discount === "" ? 0 : Number(discount);
  const newInvoiceTotal = Math.max(0, subtotal - discountAmount);
  const previousPending = customerType === "saved" && selectedCustomer ? Number(selectedCustomer.total_pending || 0) : 0;
  const grandTotal = newInvoiceTotal + previousPending;
  const remainingBalance = amountReceived === "" ? grandTotal : grandTotal - Number(amountReceived);

  const buildMessage = (template: string, data: Record<string, string>) => {
    let msg = template;
    Object.entries(data).forEach(([k, v]) => {
      msg = msg.replace(new RegExp(`{${k}}`, "g"), v || "-");
    });
    return msg;
  };

  const normalizePhone = (phone: string) => {
    let p = (phone || "").replace(/\D/g, "");
    if (p.startsWith("0")) p = "92" + p.slice(1);
    if (!p.startsWith("92")) p = "92" + p;
    return p;
  };

  // ---- PDF generator ----
  const downloadInvoicePDF = (invoice: any) => {
    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Concept Autos & Oil Change Point", pw / 2, 20, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Main Boulevard Gulberg III, Lahore", pw / 2, 26, { align: "center" });
      doc.text("Phone: 0317.80.81.82.1  |  WhatsApp: 03394303099", pw / 2, 31, { align: "center" });

      doc.setDrawColor(200);
      doc.line(14, 36, pw - 14, 36);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Invoice: ${invoice.invoiceNo}`, 14, 44);
      doc.text(`CAI: ${invoice.caiInvoiceNo}`, 14, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${invoice.date}`, pw - 14, 44, { align: "right" });
      doc.text(`Payment: ${invoice.paymentType}`, pw - 14, 50, { align: "right" });

      doc.text(`Customer: ${invoice.customerName || "Walk-in"}`, 14, 60);
      if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 14, 66);
      if (invoice.vehicle) doc.text(`Vehicle: ${invoice.vehicle}`, 14, invoice.customerPhone ? 72 : 66);

      const itemsY = invoice.customerPhone ? 84 : 78;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 245);
      doc.rect(14, itemsY - 5, pw - 28, 8, "F");
      doc.text("Item", 16, itemsY);
      doc.text("Qty", 110, itemsY);
      doc.text("Price", 130, itemsY);
      doc.text("Total", pw - 16, itemsY, { align: "right" });

      doc.setFont("helvetica", "normal");
      let y = itemsY + 8;
      invoice.items.forEach((item: any) => {
        doc.text(String(item.name).slice(0, 45), 16, y);
        doc.text(String(item.qty), 110, y);
        doc.text(`Rs. ${Number(item.price).toLocaleString()}`, 130, y);
        doc.text(`Rs. ${Number(item.total).toLocaleString()}`, pw - 16, y, { align: "right" });
        y += 6;
        if (item.oilUsedL || item.mileage) {
          doc.setFontSize(8);
          doc.setTextColor(100);
          const parts = [];
          if (item.oilUsedL) parts.push(`Oil Used: ${item.oilUsedL}L`);
          if (item.mileage) parts.push(`ODO: ${Number(item.mileage).toLocaleString()} km`);
          if (item.nextChange) parts.push(`Next: ${Number(item.nextChange).toLocaleString()} km`);
          doc.text(parts.join("  |  "), 18, y);
          doc.setTextColor(0);
          doc.setFontSize(10);
          y += 5;
        }
      });

      y += 8;
      doc.line(14, y, pw - 14, y);
      y += 6;
      const lx = pw - 80;
      const vx = pw - 16;

      doc.text("Subtotal", lx, y);
      doc.text(`Rs. ${Number(invoice.subtotal).toLocaleString()}`, vx, y, { align: "right" });
      y += 6;

      if (Number(invoice.discount) > 0) {
        doc.setTextColor(220, 40, 60);
        doc.text("Discount", lx, y);
        doc.text(`- Rs. ${Number(invoice.discount).toLocaleString()}`, vx, y, { align: "right" });
        doc.setTextColor(0);
        y += 6;
      }

      if (Number(invoice.previousPending) > 0) {
        doc.setTextColor(200, 120, 0);
        doc.text("Previous Pending", lx, y);
        doc.text(`+ Rs. ${Number(invoice.previousPending).toLocaleString()}`, vx, y, { align: "right" });
        doc.setTextColor(0);
        y += 6;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Grand Total", lx, y);
      doc.text(`Rs. ${Number(invoice.total).toLocaleString()}`, vx, y, { align: "right" });
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 140, 80);
      doc.text("Paid", lx, y);
      doc.text(`Rs. ${Number(invoice.paid).toLocaleString()}`, vx, y, { align: "right" });
      y += 6;

      if (Number(invoice.pending) > 0) {
        doc.setTextColor(220, 40, 60);
        doc.setFont("helvetica", "bold");
        doc.text("Pending", lx, y);
        doc.text(`Rs. ${Number(invoice.pending).toLocaleString()}`, vx, y, { align: "right" });
        doc.setTextColor(0);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text("Thank you for visiting us!", pw / 2, 275, { align: "center" });

      doc.save(`Invoice-${invoice.invoiceNo}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("PDF generation failed");
    }
  };

  const sendWhatsApp = (data: any) => {
    const stored = localStorage.getItem("concept_autos_settings");
    const settings = stored ? JSON.parse(stored) : {};

    const fallback = `🚗 *Concept Autos & Oil Change Point – Haroonabad*

Assalam-o-Alaikum *{name}*,

Thank you for your purchase from *Concept Autos*! 🙏

🧾 Invoice No: *{invoice_no}*
🚘 Vehicle: *{vehicle}*
🛒 Purchase Amount: *Rs. {amount}*
📅 Date: *{date}*

We appreciate your trust and look forward to serving you again.

*Concept Autos & Oil Change Point* 🔧

📎 Your invoice PDF is attached below.`;

    const template = settings.purchaseTemplate || fallback;
    const customerPhone = data.customerPhone?.trim();
    if (!customerPhone) return;

    const message = buildMessage(template, {
      name: data.customerName || "Customer",
      vehicle: data.vehicle || "-",
      model: data.vehicleModel || "-",
      amount: Number(data.total).toLocaleString(),
      invoice_no: data.invoiceNo,
      invoice_date: data.date,
      date: data.date,
      phone: settings.whatsapp || "03394303099",
      last_date: "-",
      due_date: "-",
    });

    const url = `https://api.whatsapp.com/send?phone=${normalizePhone(customerPhone)}&text=${encodeURIComponent(message)}`;
    setTimeout(() => window.open(url, "_blank"), 1200);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setIsSubmitting(true);

    const caiInvoiceNo = selectedVehicle?.cai_no || `CAI-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const invoiceForPrint = {
      invoiceNo,
      caiInvoiceNo,
      date: today,
      customerName: customerType === "walk-in" ? "Walk-in Customer" : selectedCustomer?.name,
      customerPhone: customerType === "walk-in" ? "" : (selectedCustomer?.whatsapp || selectedCustomer?.phone),
      vehicle: selectedVehicle ? selectedVehicle.reg_no : null,
      vehicleModel: selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : null,
      items: cart.map(item => ({
        name: item.product.name,
        qty: item.qty,
        price: item.unitPrice,
        total: Number(item.unitPrice) * item.qty,
        oilUsedL: item.oilUsedL,
        mileage: item.mileage,
        interval: item.interval,
        nextChange: item.mileage ? Number(item.mileage) + Number(item.interval) : null,
      })),
      subtotal,
      discount: discountAmount,
      serviceCharges: 0,
      previousPending,
      total: grandTotal,
      paid: amountReceived === "" ? 0 : Number(amountReceived),
      pending: Math.max(0, remainingBalance),
      paymentType,
      payLaterDate: payLaterDate || null,
    };

    localStorage.setItem("last_invoice", JSON.stringify(invoiceForPrint));

    // Save to history
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); } catch { return []; }
    })();
    existing.unshift(invoiceForPrint);
    localStorage.setItem("concept_autos_invoices", JSON.stringify(existing.slice(0, 500)));

    // Try API (optional)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_no: invoiceNo,
          cai_invoice_no: caiInvoiceNo,
          customer_id: customerType === "walk-in" ? null : selectedCustomer?.id,
          vehicle_id: selectedVehicle?.id || null,
          total_amount: grandTotal,
          discount: discountAmount,
          paid_amount: amountReceived || 0,
          pending_amount: Math.max(0, remainingBalance),
          payment_method: paymentType,
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.qty,
            unit_price: item.unitPrice,
            total: item.unitPrice * item.qty,
          }))
        })
      });
    } catch {}

    // Update customer
    if (customerType === "saved" && selectedCustomer) {
      const updated = {
        ...selectedCustomer,
        cai_numbers: [...(selectedCustomer.cai_numbers || []), caiInvoiceNo],
        total_purchases: Number(selectedCustomer.total_purchases || 0) + newInvoiceTotal,
        total_pending: Math.max(0, remainingBalance),
        payment_history: [
          ...(selectedCustomer.payment_history || []),
          ...(amountReceived && Number(amountReceived) > 0 ? [{
            id: Date.now(),
            date: today,
            invoiceNo,
            amount: Number(amountReceived),
            method: paymentType,
            type: "Invoice Payment",
            notes: "Auto-recorded at checkout",
          }] : []),
        ],
      };
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? updated : c));
    }

    const hasWhatsApp = customerType === "saved" && (selectedCustomer?.whatsapp || selectedCustomer?.phone);
    const printData = { ...invoiceForPrint };

    // 1. Auto-download PDF
    downloadInvoicePDF(printData);

    // 2. Open print preview in new tab
    setTimeout(() => window.open("/dashboard/pos/print", "_blank"), 400);

    toast.success("Invoice generated!", {
      description: hasWhatsApp ? "PDF downloaded. Print + WhatsApp opening..." : "PDF downloaded. Print opening...",
    });

    // Reset state
    setCart([]);
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setAmountReceived("");
    setDiscount("");
    setShowDiscountInput(false);
    setPayLaterDate("");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setVehicleSearch("");
    setCustomerType("walk-in");
    setIsSubmitting(false);

    // 3. Auto-open WhatsApp
    if (hasWhatsApp) sendWhatsApp(printData);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-3 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCheckPriceOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg cursor-pointer">
            <Search className="w-4 h-4" /> Check Price
          </button>
          <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer" title="Ctrl+H">
            <History className="w-4 h-4" /> History
          </button>
          <button onClick={() => { setCustomerType("walk-in"); setSelectedCustomer(null); setSelectedVehicle(null); setVehicleSearch(""); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium ${customerType === 'walk-in' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>
            <User className="w-4 h-4" /> Walk-in
          </button>
        </div>

        <div className="flex-1 max-w-md relative" ref={vehicleDropdownRef}>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <input
              type="text"
              placeholder="Search by Vehicle No..."
              value={selectedVehicle ? selectedVehicle.reg_no : vehicleSearch}
              onChange={(e) => {
                setVehicleSearch(e.target.value);
                setSelectedVehicle(null);
                setSelectedCustomer(null);
                setCustomerType("walk-in");
                setShowVehicleDropdown(true);
              }}
              onFocus={() => setShowVehicleDropdown(true)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
            />
            {selectedVehicle && (
              <button onClick={() => { setSelectedVehicle(null); setSelectedCustomer(null); setVehicleSearch(""); setCustomerType("walk-in"); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-danger cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showVehicleDropdown && filteredVehicles.length > 0 && !selectedVehicle && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {filteredVehicles.map((v: any) => (
                <div key={`${v.customer.id}-${v.id}`} onClick={() => {
                  setSelectedVehicle(v);
                  setSelectedCustomer(v.customer);
                  setCustomerType("saved");
                  setVehicleSearch("");
                  setShowVehicleDropdown(false);
                }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 font-digit">{v.reg_no}</p>
                      <p className="text-xs text-zinc-500">{v.make} {v.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-primary font-medium">{v.customer.name}</p>
                      <p className="text-[10px] text-zinc-400 font-digit">{v.customer.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedVehicle && (
          <div className="flex items-center gap-2 bg-success/10 border border-success/20 px-3 py-2 rounded-lg">
            <Car className="w-4 h-4 text-success" />
            <div>
              <p className="text-xs font-bold text-success font-digit">{selectedVehicle.reg_no}</p>
              <p className="text-[10px] text-success/80">{selectedCustomer?.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm relative" ref={dropdownRef}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-zinc-700">Items Description</h2>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500">Invoice #:</label>
                <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-28 px-2 py-1 text-xs border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search item by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
                />
                {showDropdown && searchQuery.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-sm text-zinc-500 text-center">No product found</div>
                    ) : filteredProducts.map((product) => (
                      <div key={product.id} onClick={() => addToCart(product)} className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{product.name}</p>
                          <p className="text-xs text-zinc-500 font-digit">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary font-digit">Rs. {product.sale_price}</p>
                          <p className={`text-xs font-medium font-digit ${product.stock_qty > 5 ? 'text-success' : 'text-danger'}`}>{product.stock_qty} in stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => {
                if (searchQuery.length === 0) return toast.error("Search for an item first");
                const first = filteredProducts[0];
                if (first) addToCart(first);
                else toast.error("No product found");
              }} className="flex items-center gap-2 px-6 py-2.5 bg-success hover:bg-success-hover text-white font-semibold rounded-lg cursor-pointer shadow-sm">
                <ShoppingCart className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>

          {customerType === "saved" && selectedCustomer && previousPending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <span className="font-medium">⚠ Previous Pending:</span>
                <span className="font-bold font-digit">Rs. {previousPending.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-amber-700">Auto-added</span>
            </div>
          )}

          <div className="flex-1 bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Unit Price</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {cart.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-400">No items added yet.</td></tr>
                  ) : cart.map((item) => (
                    <>
                      <tr key={item.product.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900 flex items-center gap-2">
                          {item.product.name}
                          {isOilProduct(item.product) && <Droplets className="w-4 h-4 text-primary" />}
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={item.unitPrice} onChange={(e) => updateUnitPrice(item.product.id, Number(e.target.value))} className="w-24 px-2 py-1 text-sm border border-zinc-200 rounded font-digit" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.product.id, -1)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 cursor-pointer"><Minus className="w-3 h-3" /></button>
                            <span className="w-6 text-center font-medium font-digit">{item.qty}</span>
                            <button onClick={() => updateQty(item.product.id, 1)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 cursor-pointer"><Plus className="w-3 h-3" /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-zinc-900 text-right font-digit">
                          Rs. {(Number(item.unitPrice) * item.qty).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                      {isOilProduct(item.product) && (
                        <tr key={`${item.product.id}-oil`} className="bg-primary/5">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="grid grid-cols-5 gap-3">
                              <div>
                                <label className="block text-[10px] font-medium text-primary mb-1">Oil Used (L)</label>
                                <input type="number" step="0.1" value={item.oilUsedL} onChange={(e) => updateOilField(item.product.id, "oilUsedL", e.target.value)} placeholder="3.5" className="w-full px-2 py-1.5 text-xs border border-primary/30 rounded font-digit bg-white" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-primary mb-1">Current ODO (km)</label>
                                <input type="number" value={item.mileage} onChange={(e) => updateOilField(item.product.id, "mileage", e.target.value)} placeholder="80000" className="w-full px-2 py-1.5 text-xs border border-primary/30 rounded font-digit bg-white" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-primary mb-1">Interval</label>
                                <select value={item.interval} onChange={(e) => updateOilField(item.product.id, "interval", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-primary/30 rounded font-digit bg-white cursor-pointer">
                                  <option value="3500">+3,500</option>
                                  <option value="4000">+4,000</option>
                                  <option value="4500">+4,500</option>
                                  <option value="5000">+5,000</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-primary mb-1">Next Change</label>
                                <input type="number" value={item.mileage ? Number(item.mileage) + Number(item.interval) : ""} readOnly className="w-full px-2 py-1.5 text-xs border border-primary/30 rounded bg-primary/5 font-digit font-bold text-primary" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-primary mb-1">Brand</label>
                                <input type="text" value={item.product.name} readOnly className="w-full px-2 py-1.5 text-xs border border-primary/30 rounded bg-primary/5" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Payment */}
        <div className="w-80 bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col p-4">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Payment Details</h2>

          <div className="space-y-3 flex-1">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="font-medium font-digit">Rs. {subtotal.toLocaleString()}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-danger">Discount</span><span className="font-medium text-danger font-digit">- Rs. {discountAmount.toLocaleString()}</span></div>}
            {previousPending > 0 && <div className="flex justify-between text-sm"><span className="text-amber-600">Previous Pending</span><span className="font-medium text-amber-600 font-digit">+ Rs. {previousPending.toLocaleString()}</span></div>}
            <div className="border-t border-zinc-200 pt-3 flex justify-between">
              <span className="font-bold text-zinc-900">Grand Total</span>
              <span className="font-bold text-xl text-primary font-digit">Rs. {grandTotal.toLocaleString()}</span>
            </div>
            {!showDiscountInput ? (
              <button onClick={() => setShowDiscountInput(true)} className="text-xs text-primary hover:underline cursor-pointer">+ Add Discount</button>
            ) : (
              <div className="flex items-center gap-2">
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Discount" className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit" />
                <button onClick={() => { setDiscount(""); setShowDiscountInput(false); }} className="p-2 text-zinc-400 hover:text-danger cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Payment Method</label>
              <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm cursor-pointer font-digit">
                <option>Cash</option>
                <option>JazzCash</option>
                <option>JazzCash Business</option>
                <option>EasyPaisa</option>
                <option>DIB</option>
                <option>Meezan Bank</option>
                <option>Pay Later (Credit)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Amount Received</label>
              <input type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit" />
            </div>
            {paymentType === "Pay Later (Credit)" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <label className="block text-xs font-medium text-amber-700 mb-1"><Calendar className="w-3 h-3 inline" /> Reminder Date</label>
                <input type="date" value={payLaterDate} onChange={e => setPayLaterDate(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white font-digit" />
              </div>
            )}
            <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-200">
              <span className="text-xs font-medium text-zinc-500">Remaining</span>
              <span className={`font-bold font-digit ${remainingBalance > 0 ? 'text-danger' : 'text-success'}`}>Rs. {remainingBalance.toLocaleString()}</span>
            </div>
            {customerType === "saved" && selectedCustomer && (selectedCustomer.whatsapp || selectedCustomer.phone) && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-2 text-[11px] text-success flex items-center gap-1.5">
                <FileDown className="w-3 h-3" /> PDF downloads + WhatsApp opens
              </div>
            )}
            <button onClick={handleCheckout} disabled={isSubmitting || cart.length === 0} className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-medium rounded-lg cursor-pointer">
              <CreditCard className="w-5 h-5" /> {isSubmitting ? "Processing..." : "Checkout & Print"}
            </button>
          </div>
        </div>
      </div>

      <CheckPriceModal isOpen={isCheckPriceOpen} onClose={() => setIsCheckPriceOpen(false)} products={products} />

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Previous Invoices ({allInvoices.length})
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-zinc-200">
              <input autoFocus type="text" placeholder="Search by customer, vehicle, invoice no..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="w-full px-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg font-digit" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredInvoices.length === 0 ? (
                <div className="p-10 text-center text-zinc-500 text-sm">No invoices found.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 font-medium">Invoice #</th>
                      <th className="px-5 py-3 font-medium">CAI #</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Vehicle</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium text-right">Total</th>
                      <th className="px-5 py-3 font-medium text-right">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredInvoices.map((inv, i) => (
                      <tr key={i} className="hover:bg-zinc-50">
                        <td className="px-5 py-3 font-medium text-zinc-900 font-digit">{inv.invoiceNo}</td>
                        <td className="px-5 py-3 text-primary font-digit">{inv.caiInvoiceNo}</td>
                        <td className="px-5 py-3 text-zinc-900">{inv.customerName}</td>
                        <td className="px-5 py-3 text-zinc-600 font-digit">{inv.vehicle || "-"}</td>
                        <td className="px-5 py-3 text-zinc-500 font-digit">{inv.date}</td>
                        <td className="px-5 py-3 text-right font-bold text-zinc-900 font-digit">Rs. {Number(inv.total).toLocaleString()}</td>
                        <td className={`px-5 py-3 text-right font-bold font-digit ${Number(inv.pending) > 0 ? "text-danger" : "text-success"}`}>Rs. {Number(inv.pending || 0).toLocaleString()}</td>
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