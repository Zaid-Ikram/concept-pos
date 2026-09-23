"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Plus, CreditCard, Trash2, Minus, User, MessageCircle,
  Calendar, X, Edit, Droplets, ShoppingCart, Car, History, Printer, Tag
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

  // Customer info fields
  const [customerForm, setCustomerForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
  });

  // Vehicle info fields
  const [vehicleForm, setVehicleForm] = useState({
    reg_no: "",
    make_model: "",
  });

  // Oil change preferences
  const [oilChangeForm, setOilChangeForm] = useState({
    currentOdometer: "",
    oilChangeAfter: "",
    dailyMileage: "",
    dockStation: "",
    serviceMan1: "",
    serviceMan2: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);

  const [isCheckPriceOpen, setIsCheckPriceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [regInvoiceNo, setRegInvoiceNo] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState<number | "">("");
  const [discount, setDiscount] = useState<number | "">("");
  const [serviceCharges, setServiceCharges] = useState<number | "">("");
  const [showDiscountInput, setShowDiscountInput] = useState(true);
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

  // When vehicle is selected, auto-fill customer form and vehicle form
  const selectVehicle = (v: any) => {
    setSelectedVehicle(v);
    setSelectedCustomer(v.customer);
    setCustomerType("saved");
    setVehicleSearch("");
    setShowVehicleDropdown(false);

    setCustomerForm({
      name: v.customer.name || "",
      mobile: v.customer.phone || "",
      email: v.customer.email || "",
      address: v.customer.address || "",
    });
    setVehicleForm({
      reg_no: v.reg_no || "",
      make_model: `${v.make || ""} ${v.model || ""}`.trim(),
    });
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item =>
        item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
      );
      return [...prev, {
        product, qty: 1,
        unitPrice: Number(product.sale_price),
        discountedPrice: Number(product.sale_price),
        oilUsedL: "",
        mileage: "",
        interval: "5000",
      }];
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
    setCart(prev => prev.map(item => item.product.id === id ? { ...item, unitPrice: price, discountedPrice: price } : item));
  };

  const updateDiscountedPrice = (id: number, price: number) => {
    setCart(prev => prev.map(item => item.product.id === id ? { ...item, discountedPrice: price } : item));
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.product.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + Number(item.discountedPrice || item.unitPrice || 0) * item.qty, 0);
  const discountAmount = discount === "" ? 0 : Number(discount);
  const serviceChargesAmount = serviceCharges === "" ? 0 : Number(serviceCharges);
  const newInvoiceTotal = Math.max(0, subtotal - discountAmount + serviceChargesAmount);
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

  const downloadInvoicePDF = (invoice: any) => {
    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Concept Autos", pw / 2, 20, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("An Authentic Lubricant in Town", pw / 2, 26, { align: "center" });
      doc.text("Main Boulevard Gulberg III, Lahore", pw / 2, 31, { align: "center" });
      doc.text("0317.80.81.82.1", pw / 2, 36, { align: "center" });

      doc.line(14, 42, pw - 14, 42);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`INVOICE: ${invoice.invoiceNo}`, 14, 50);
      doc.text(`DATE: ${invoice.date}`, pw - 14, 50, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${invoice.customerName || "Walk-in"}`, 14, 58);
      if (invoice.customerPhone) doc.text(`${invoice.customerPhone}`, 14, 63);
      if (invoice.regInvoiceNo) doc.text(`Dock Station: ${invoice.regInvoiceNo}`, 14, 68);

      // Vehicle
      if (invoice.vehicle) {
        doc.setFont("helvetica", "bold");
        doc.text("VEHICLE NUMBER", 14, 76);
        doc.text("VEHICLE MODEL", pw / 2 + 10, 76);
        doc.setFont("helvetica", "normal");
        doc.rect(14, 78, pw / 2 - 20, 7);
        doc.rect(pw / 2 + 10, 78, pw / 2 - 24, 7);
        doc.text(`${invoice.vehicle}`, 17, 83);
        doc.text(`${invoice.vehicleModel || ""}`, pw / 2 + 13, 83);
      }

      // Oil change info
      if (invoice.currentOdometer || invoice.nextOilChange) {
        doc.setFont("helvetica", "bold");
        doc.text("THIS OIL CHANGE", 14, 92);
        doc.text("NEXT OIL CHANGE", pw / 2 + 10, 92);
        doc.setFont("helvetica", "normal");
        doc.rect(14, 94, pw / 2 - 20, 7);
        doc.rect(pw / 2 + 10, 94, pw / 2 - 24, 7);
        doc.text(`${invoice.currentOdometer || ""}`, 17, 99);
        doc.text(`${invoice.nextOilChange || ""}`, pw / 2 + 13, 99);
      }

      // Items table
      let y = 110;
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 245);
      doc.rect(14, y - 5, pw - 28, 7, "F");
      doc.text("Items", 16, y);
      doc.text("Qty", 130, y);
      doc.text("Price", 145, y);
      doc.text("Total", pw - 16, y, { align: "right" });

      doc.setFont("helvetica", "normal");
      y += 7;
      invoice.items.forEach((item: any) => {
        doc.text(String(item.name).slice(0, 50), 16, y);
        doc.text(String(item.qty), 130, y);
        doc.text(String(item.discountedPrice || item.price), 145, y);
        doc.text(String(Number(item.discountedPrice || item.price) * item.qty), pw - 16, y, { align: "right" });
        y += 6;
      });

      y += 4;
      doc.line(14, y, pw - 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text("Total Bill:", pw - 80, y);
      doc.text(`Rs. ${Number(invoice.subtotal).toLocaleString()}`, pw - 16, y, { align: "right" });
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Net Payable:", pw - 80, y);
      doc.text(`Rs. ${Number(invoice.total).toLocaleString()}`, pw - 16, y, { align: "right" });
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text("Payment Received:", pw - 80, y);
      doc.text(`Rs. ${Number(invoice.paid).toLocaleString()}`, pw - 16, y, { align: "right" });
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("REMAINING BALANCE:", pw - 80, y);
      doc.text(`Rs. ${Number(invoice.pending).toLocaleString()}`, pw - 16, y, { align: "right" });

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Keep headlights clean for night driving", pw / 2, 275, { align: "center" });
      doc.text("Thank you for shopping with us!", pw / 2, 281, { align: "center" });
      doc.text("Concept Autos Team", pw / 2, 287, { align: "center" });

      doc.save(`Invoice-${invoice.invoiceNo}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  const sendWhatsAppAfterCheckout = (data: any) => {
    const stored = localStorage.getItem("concept_autos_settings");
    const settings = stored ? JSON.parse(stored) : {};
    const fallback = `🚗 *Concept Autos*

Assalam-o-Alaikum *{name}*,

Your invoice for order *{invoice_no}* is attached.

Vehicle Number: {vehicle}
Current Oil Change: {current_odo}
Next Oil Change: {next_odo}

Thank you for shopping with us!
*Concept Autos Team*`;

    const template = settings.purchaseTemplate || fallback;
    const customerPhone = data.customerPhone?.trim();
    if (!customerPhone) return;

    const message = buildMessage(template, {
      name: data.customerName || "Customer",
      vehicle: data.vehicle || "-",
      invoice_no: data.invoiceNo,
      current_odo: data.currentOdometer || "-",
      next_odo: data.nextOilChange || "-",
      amount: Number(data.total).toLocaleString(),
      date: data.date,
      phone: settings.whatsapp || "03394303099",
    });

    const url = `https://api.whatsapp.com/send?phone=${normalizePhone(customerPhone)}&text=${encodeURIComponent(message)}`;
    setTimeout(() => window.open(url, "_blank"), 1200);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setIsSubmitting(true);

    const caiInvoiceNo = selectedVehicle?.cai_no || `CAI-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    // Calculate next oil change (from oil product fields)
    const oilItem = cart.find(i => isOilProduct(i.product) && i.mileage);
    const currentOdometer = oilItem?.mileage || oilChangeForm.currentOdometer;
    const nextOilChange = oilItem?.mileage ? Number(oilItem.mileage) + Number(oilItem.interval) : "";

    const invoiceForPrint = {
      invoiceNo,
      regInvoiceNo,
      caiInvoiceNo,
      date: today,
      customerName: customerForm.name || (customerType === "walk-in" ? "Walk-in Customer" : selectedCustomer?.name),
      customerPhone: customerForm.mobile || (customerType === "walk-in" ? "" : (selectedCustomer?.whatsapp || selectedCustomer?.phone)),
      customerEmail: customerForm.email,
      customerAddress: customerForm.address,
      vehicle: vehicleForm.reg_no || selectedVehicle?.reg_no || null,
      vehicleModel: vehicleForm.make_model || (selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : null),
      currentOdometer,
      nextOilChange,
      oilChangeAfter: oilChangeForm.oilChangeAfter,
      dailyMileage: oilChangeForm.dailyMileage,
      dockStation: oilChangeForm.dockStation,
      serviceMan1: oilChangeForm.serviceMan1,
      serviceMan2: oilChangeForm.serviceMan2,
      items: cart.map(item => ({
        name: item.product.name,
        qty: item.qty,
        price: item.unitPrice,
        discountedPrice: item.discountedPrice,
        total: Number(item.discountedPrice || item.unitPrice) * item.qty,
      })),
      subtotal,
      discount: discountAmount,
      serviceCharges: serviceChargesAmount,
      previousPending,
      total: grandTotal,
      paid: amountReceived === "" ? 0 : Number(amountReceived),
      pending: Math.max(0, remainingBalance),
      paymentType,
      payLaterDate: payLaterDate || null,
    };

    localStorage.setItem("last_invoice", JSON.stringify(invoiceForPrint));

    const existing = (() => {
      try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); } catch { return []; }
    })();
    existing.unshift(invoiceForPrint);
    localStorage.setItem("concept_autos_invoices", JSON.stringify(existing.slice(0, 500)));

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_no: invoiceNo,
          cai_invoice_no: caiInvoiceNo,
          customer_id: selectedCustomer?.id || null,
          total_amount: grandTotal,
          discount: discountAmount,
          paid_amount: amountReceived || 0,
          pending_amount: Math.max(0, remainingBalance),
          payment_method: paymentType,
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.qty,
            unit_price: item.unitPrice,
            total: item.discountedPrice * item.qty,
          }))
        })
      });
    } catch {}

    if (selectedCustomer) {
      const updated = {
        ...selectedCustomer,
        name: customerForm.name,
        phone: customerForm.mobile,
        email: customerForm.email,
        address: customerForm.address,
        cai_numbers: [...(selectedCustomer.cai_numbers || []), caiInvoiceNo],
        total_purchases: Number(selectedCustomer.total_purchases || 0) + newInvoiceTotal,
        total_pending: Math.max(0, remainingBalance),
      };
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? updated : c));
    }

    const hasWhatsApp = customerForm.mobile || selectedCustomer?.whatsapp;
    const printData = { ...invoiceForPrint };

    downloadInvoicePDF(printData);
    setTimeout(() => window.open("/dashboard/pos/print", "_blank"), 400);

    toast.success("Invoice generated!", {
      description: hasWhatsApp ? "PDF + Print + WhatsApp opening..." : "PDF + Print opening...",
    });

    // Reset
    setCart([]);
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setRegInvoiceNo("");
    setCustomerForm({ name: "", mobile: "", email: "", address: "" });
    setVehicleForm({ reg_no: "", make_model: "" });
    setOilChangeForm({ currentOdometer: "", oilChangeAfter: "", dailyMileage: "", dockStation: "", serviceMan1: "", serviceMan2: "" });
    setAmountReceived("");
    setDiscount("");
    setServiceCharges("");
    setPayLaterDate("");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCustomerType("walk-in");
    setIsSubmitting(false);

    if (hasWhatsApp) sendWhatsAppAfterCheckout(printData);
  };

  const handlePrintInvoice = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    handleCheckout();
  };

  const handlePrintSticker = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const stickerData = {
      invoiceNo,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      customerName: customerForm.name,
      vehicle: vehicleForm.reg_no,
      currentOdometer: oilChangeForm.currentOdometer,
      nextOilChange: oilChangeForm.oilChangeAfter,
    };
    localStorage.setItem("last_sticker", JSON.stringify(stickerData));
    window.open("/dashboard/pos/sticker", "_blank");
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setIsCheckPriceOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2a7ab8] hover:bg-[#1f5d8f] text-white text-sm font-semibold rounded-l-lg cursor-pointer"
          >
            <Search className="w-4 h-4" /> Check Price
          </button>
          <button
            onClick={() => { setCustomerType("walk-in"); setSelectedCustomer(null); setSelectedVehicle(null); }}
            className="flex items-center justify-center w-14 h-10 bg-[#c9302c] hover:bg-[#a02622] text-white cursor-pointer"
            title="Walk-in"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCustomerType("saved")}
            className="flex items-center justify-center w-14 h-10 bg-[#4cae4c] hover:bg-[#3d8b3d] text-white rounded-r-lg cursor-pointer"
            title="Saved Customer"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="ml-3 flex items-center gap-2 px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer"
            title="Previous Invoices (Ctrl+H)"
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>

        <div className="flex-1 max-w-md relative" ref={vehicleDropdownRef}>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <input
              type="text"
              placeholder="Search by mobile, name or vehicle..."
              value={selectedVehicle ? selectedVehicle.reg_no : vehicleSearch}
              onChange={(e) => {
                setVehicleSearch(e.target.value);
                setSelectedVehicle(null);
                setSelectedCustomer(null);
                setShowVehicleDropdown(true);
              }}
              onFocus={() => setShowVehicleDropdown(true)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit"
            />
          </div>
          {showVehicleDropdown && filteredVehicles.length > 0 && !selectedVehicle && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {filteredVehicles.map((v: any) => (
                <div
                  key={`${v.customer.id}-${v.id}`}
                  onClick={() => selectVehicle(v)}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0"
                >
                  <p className="text-sm font-bold text-zinc-900 font-digit">{v.reg_no}</p>
                  <p className="text-xs text-zinc-500">{v.make} {v.model} • {v.customer.name} ({v.customer.phone})</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[#25D366] hover:bg-green-50 cursor-pointer" title="WhatsApp">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* ============ Customer Information ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700">Customer Information</span>
            <div className="flex gap-2">
              <span className="text-[10px] bg-success text-white px-2 py-0.5 rounded font-medium">Owner</span>
              <span className="text-[10px] bg-success text-white px-2 py-0.5 rounded font-medium">Owner</span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Full Name"
              value={customerForm.name}
              onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Mobile Number"
              value={customerForm.mobile}
              onChange={e => setCustomerForm({ ...customerForm, mobile: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={customerForm.email}
              onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="px-4 pb-3">
            <input
              type="text"
              placeholder="Address"
              value={customerForm.address}
              onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
              className="w-1/2 px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Vehicle Registration number"
              value={vehicleForm.reg_no}
              onChange={e => setVehicleForm({ ...vehicleForm, reg_no: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
            <input
              type="text"
              placeholder="Vehicle Make & Model"
              value={vehicleForm.make_model}
              onChange={e => setVehicleForm({ ...vehicleForm, make_model: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* ============ Oil Change Preferences ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Oil Change Preferences</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Current Odometer Reading"
              value={oilChangeForm.currentOdometer}
              onChange={e => setOilChangeForm({ ...oilChangeForm, currentOdometer: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
            <input
              type="text"
              placeholder="Oil Change After"
              value={oilChangeForm.oilChangeAfter}
              onChange={e => setOilChangeForm({ ...oilChangeForm, oilChangeAfter: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
            <input
              type="text"
              placeholder="Daily Mileage"
              value={oilChangeForm.dailyMileage}
              onChange={e => setOilChangeForm({ ...oilChangeForm, dailyMileage: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
            <select
              value={oilChangeForm.dockStation}
              onChange={e => setOilChangeForm({ ...oilChangeForm, dockStation: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="">- Select Dock Station -</option>
              <option value="001">Dock Station: 001</option>
              <option value="002">Dock Station: 002</option>
            </select>
            <div className="col-span-2 flex gap-3">
              <input
                type="text"
                placeholder="Select Service Man (Upto 2)"
                value={oilChangeForm.serviceMan1}
                onChange={e => setOilChangeForm({ ...oilChangeForm, serviceMan1: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Service Man 2"
                value={oilChangeForm.serviceMan2}
                onChange={e => setOilChangeForm({ ...oilChangeForm, serviceMan2: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ============ Items Description ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Items Description</span>
          </div>
          <div className="p-4">
            <div className="relative" ref={dropdownRef}>
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3 relative">
                  <input
                    type="text"
                    placeholder="Item Name"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
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
                          <span className="text-sm font-bold text-primary font-digit">Rs. {product.sale_price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input type="text" placeholder="Unit Price" readOnly className="col-span-2 px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit" />
                <input type="text" placeholder="Discounted Price" readOnly className="col-span-2 px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit" />
                <input type="text" placeholder="Quantity" readOnly value="0" className="col-span-2 px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded text-center font-digit" />
                <input type="text" value="0" readOnly className="col-span-2 px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded text-center font-digit" />
                <button
                  onClick={() => {
                    if (searchQuery.length === 0) return toast.error("Search for an item first");
                    const first = filteredProducts[0];
                    if (first) addToCart(first);
                    else toast.error("No product found");
                  }}
                  className="col-span-1 flex items-center justify-center w-full h-10 bg-success hover:bg-success-hover text-white rounded cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart table */}
            {cart.length > 0 && (
              <div className="mt-4 border border-zinc-200 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Item</th>
                      <th className="px-3 py-2 text-center font-medium">Unit Price</th>
                      <th className="px-3 py-2 text-center font-medium">Discounted Price</th>
                      <th className="px-3 py-2 text-center font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {cart.map((item) => (
                      <>
                        <tr key={item.product.id}>
                          <td className="px-3 py-2 font-medium">{item.product.name}</td>
                          <td className="px-3 py-2">
                            <input type="number" value={item.unitPrice} onChange={(e) => updateUnitPrice(item.product.id, Number(e.target.value))} className="w-24 px-2 py-1 text-sm border border-zinc-200 rounded font-digit" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" value={item.discountedPrice} onChange={(e) => updateDiscountedPrice(item.product.id, Number(e.target.value))} className="w-24 px-2 py-1 text-sm border border-zinc-200 rounded font-digit" />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 justify-center">
                              <button onClick={() => updateQty(item.product.id, -1)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 cursor-pointer"><Minus className="w-3 h-3" /></button>
                              <span className="w-6 text-center font-digit">{item.qty}</span>
                              <button onClick={() => updateQty(item.product.id, 1)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 cursor-pointer"><Plus className="w-3 h-3" /></button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-bold font-digit">
                            Rs. {(Number(item.discountedPrice) * item.qty).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                        {isOilProduct(item.product) && (
                          <tr className="bg-primary/5">
                            <td colSpan={6} className="px-3 py-2">
                              <div className="grid grid-cols-4 gap-2">
                                <input type="number" step="0.1" value={item.oilUsedL} onChange={(e) => updateOilField(item.product.id, "oilUsedL", e.target.value)} placeholder="Oil Used (L)" className="px-2 py-1 text-xs border border-primary/30 rounded font-digit" />
                                <input type="number" value={item.mileage} onChange={(e) => updateOilField(item.product.id, "mileage", e.target.value)} placeholder="Current ODO (km)" className="px-2 py-1 text-xs border border-primary/30 rounded font-digit" />
                                <select value={item.interval} onChange={(e) => updateOilField(item.product.id, "interval", e.target.value)} className="px-2 py-1 text-xs border border-primary/30 rounded font-digit">
                                  <option value="3500">+3,500</option>
                                  <option value="4000">+4,000</option>
                                  <option value="4500">+4,500</option>
                                  <option value="5000">+5,000</option>
                                </select>
                                <input type="number" value={item.mileage ? Number(item.mileage) + Number(item.interval) : ""} readOnly placeholder="Next Change" className="px-2 py-1 text-xs border border-primary/30 rounded bg-primary/10 font-digit" />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============ Other Information ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Other Information</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <input
                type="number"
                placeholder="Discount"
                value={discount}
                onChange={e => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
              />
              <input
                type="text"
                placeholder="Reg. Invoice Number"
                value={regInvoiceNo}
                onChange={e => setRegInvoiceNo(e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
              />
              <input
                type="text"
                placeholder="Total Amount"
                value={subtotal.toLocaleString()}
                readOnly
                className="px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit font-bold"
              />
              <input
                type="number"
                placeholder="Service Charges"
                value={serviceCharges}
                onChange={e => setServiceCharges(e.target.value === "" ? "" : Number(e.target.value))}
                className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-digit"
                >
                  <option>Cash</option>
                  <option>JazzCash</option>
                  <option>EasyPaisa</option>
                  <option>DIB</option>
                  <option>Meezan Bank</option>
                  <option>Pay Later (Credit)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Amount Received</label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Remaining Balance</label>
                <input
                  type="text"
                  value={remainingBalance.toLocaleString()}
                  readOnly
                  className={`w-full px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit font-bold ${remainingBalance > 0 ? 'text-danger' : 'text-success'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============ Action Buttons ============ */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            onClick={handlePrintInvoice}
            disabled={isSubmitting || cart.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-[#2a7ab8] hover:bg-[#1f5d8f] disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <button
            onClick={handlePrintSticker}
            disabled={cart.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-[#4cae4c] hover:bg-[#3d8b3d] disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            <Tag className="w-4 h-4" /> Print Sticker
          </button>
          <button
            onClick={() => router.push("/dashboard/pos")}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" /> Close
          </button>
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
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-500 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-medium">Invoice #</th>
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
                      <td className="px-5 py-3 font-medium font-digit">{inv.invoiceNo}</td>
                      <td className="px-5 py-3">{inv.customerName}</td>
                      <td className="px-5 py-3 text-zinc-600 font-digit">{inv.vehicle || "-"}</td>
                      <td className="px-5 py-3 text-zinc-500 font-digit">{inv.date}</td>
                      <td className="px-5 py-3 text-right font-bold font-digit">Rs. {Number(inv.total).toLocaleString()}</td>
                      <td className={`px-5 py-3 text-right font-bold font-digit ${Number(inv.pending) > 0 ? "text-danger" : "text-success"}`}>Rs. {Number(inv.pending || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}