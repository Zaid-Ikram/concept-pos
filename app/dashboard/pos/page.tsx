"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Plus, Trash2, Minus, MessageCircle, Save,
  X, Droplets, History, FileDown, Printer, Tag, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CheckPriceModal from "@/components/modals/CheckPriceModal";
import PrintInvoiceModal from "@/components/modals/PrintInvoiceModal";

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerType, setCustomerType] = useState<"walk-in" | "saved">("walk-in");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const [customerNameSearch, setCustomerNameSearch] = useState("");
  const [showCustomerSuggest, setShowCustomerSuggest] = useState(false);
  const [vehicleRegSearch, setVehicleRegSearch] = useState("");
  const [showVehicleSuggest, setShowVehicleSuggest] = useState(false);
  const customerSuggestRef = useRef<HTMLDivElement>(null);
  const vehicleSuggestRef = useRef<HTMLDivElement>(null);

  const [customerForm, setCustomerForm] = useState({
    name: "", mobile: "", email: "", address: "", oilGrade: "", vehicleName: "",
  });
  const [vehicleForm, setVehicleForm] = useState({ reg_no: "", make_model: "" });
  const [oilChangeForm, setOilChangeForm] = useState({
    currentOdometer: "", oilChangeAfter: "", dailyMileage: "",
    dockStation: "", serviceMan1: "", serviceMan2: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isCheckPriceOpen, setIsCheckPriceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [regInvoiceNo, setRegInvoiceNo] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState<number | "">("");
  const [discount, setDiscount] = useState<number | "">("");
  const [serviceCharges, setServiceCharges] = useState<number | "">("");
  const [payLaterDate, setPayLaterDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [lastInvoiceForModal, setLastInvoiceForModal] = useState<any>(null);

  useEffect(() => {
    const storedProducts = localStorage.getItem("concept_autos_products");
    if (storedProducts) { try { setProducts(JSON.parse(storedProducts)); } catch {} }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {});

    const stored = localStorage.getItem("concept_autos_customers");
    if (stored) try { setCustomers(JSON.parse(stored)); } catch {}
  }, []);

  useEffect(() => {
    if (customers.length > 0) localStorage.setItem("concept_autos_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
      if (customerSuggestRef.current && !customerSuggestRef.current.contains(event.target as Node)) setShowCustomerSuggest(false);
      if (vehicleSuggestRef.current && !vehicleSuggestRef.current.contains(event.target as Node)) setShowVehicleSuggest(false);
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

  const customerSuggestions = customerNameSearch.length > 0
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(customerNameSearch.toLowerCase()) ||
        c.phone?.includes(customerNameSearch)
      ).slice(0, 6)
    : [];

  const vehicleSuggestions = vehicleRegSearch.length > 0
    ? customers.flatMap(c => (c.vehicles || []).map((v: any) => ({ ...v, customer: c })))
        .filter(v => v.reg_no?.toLowerCase().includes(vehicleRegSearch.toLowerCase()))
        .slice(0, 6)
    : [];

  const allInvoices: any[] = (() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); } catch { return []; }
  })();

  const filteredInvoices = historySearch.length > 0
    ? allInvoices.filter(inv =>
        inv.customerName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.vehicle?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.invoiceNo?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : allInvoices;

  // ============ RED BUTTON — Walk-in with DEMO data auto-fill ============
  const handleWalkIn = () => {
    setCustomerType("walk-in");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCart([]);
    setCustomerNameSearch("Walk-in");
    setVehicleRegSearch("");
    setCustomerForm({
      name: "Walk-in",
      mobile: "0000000000",
      email: "walkin@conceptautos.pk",
      address: "Walk-in Customer",
      oilGrade: "",
      vehicleName: "",
    });
    setVehicleForm({
      reg_no: "WALK-IN",
      make_model: "Walk-in Vehicle",
    });
    setOilChangeForm({
      currentOdometer: "0",
      oilChangeAfter: "5000",
      dailyMileage: "0",
      dockStation: "001",
      serviceMan1: "",
      serviceMan2: "",
    });
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    toast.success("Walk-in Customer — details auto-filled. Update as needed.");
  };

  // ============ GREEN BUTTON — Saved Customer ============
  const handleSavedCustomer = () => {
    setCustomerType("saved");
    setCustomerForm({ name: "", mobile: "", email: "", address: "", oilGrade: "", vehicleName: "" });
    setVehicleForm({ reg_no: "", make_model: "" });
    setCustomerNameSearch("");
    setVehicleRegSearch("");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    toast.info("Search a saved customer or vehicle below");
    setTimeout(() => {
      const el = document.getElementById("customer-name-input");
      if (el) (el as HTMLInputElement).focus();
    }, 100);
  };

  // ============ BLUE BUTTON — New Invoice ============
  const handleNewInvoice = () => {
    setCart([]);
    setCustomerType("walk-in");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCustomerNameSearch("");
    setVehicleRegSearch("");
    setCustomerForm({ name: "", mobile: "", email: "", address: "", oilGrade: "", vehicleName: "" });
    setVehicleForm({ reg_no: "", make_model: "" });
    setOilChangeForm({ currentOdometer: "", oilChangeAfter: "", dailyMileage: "", dockStation: "", serviceMan1: "", serviceMan2: "" });
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setRegInvoiceNo("");
    setDiscount("");
    setServiceCharges("");
    setAmountReceived("");
    setPayLaterDate("");
    setPaymentType("Cash");
    setTimeout(() => {
      const el = document.getElementById("customer-name-input");
      if (el) (el as HTMLInputElement).focus();
    }, 100);
    toast.success("New invoice started — blank form ready");
  };

  const fillFromCustomer = (c: any) => {
    setSelectedCustomer(c);
    setCustomerType("saved");
    setCustomerForm({
      name: c.name || "", mobile: c.phone || "", email: c.email || "",
      address: c.address || "", oilGrade: c.oilGrade || "", vehicleName: c.vehicleName || "",
    });
    setCustomerNameSearch(c.name || "");
    setShowCustomerSuggest(false);
    if (c.vehicles?.length > 0) {
      const v = c.vehicles[0];
      setSelectedVehicle({ ...v, customer: c });
      setVehicleForm({
        reg_no: v.reg_no || "",
        make_model: `${v.make || ""} ${v.model || ""}`.trim(),
      });
      setVehicleRegSearch(v.reg_no || "");
    }
  };

  const fillFromVehicle = (v: any) => {
    const c = v.customer;
    setSelectedVehicle(v);
    setSelectedCustomer(c);
    setCustomerType("saved");
    setCustomerForm({
      name: c.name || "", mobile: c.phone || "", email: c.email || "",
      address: c.address || "", oilGrade: c.oilGrade || "", vehicleName: c.vehicleName || v.make || "",
    });
    setVehicleForm({
      reg_no: v.reg_no || "",
      make_model: `${v.make || ""} ${v.model || ""}`.trim(),
    });
    setCustomerNameSearch(c.name || "");
    setVehicleRegSearch(v.reg_no || "");
    setShowVehicleSuggest(false);
  };

  // ============ SAVE / UPDATE CUSTOMER ============
  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) return toast.error("Customer name required");
    if (!customerForm.mobile.trim()) return toast.error("Mobile number required");

    setIsSavingCustomer(true);
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const newVehicle = vehicleForm.reg_no
      ? {
          id: selectedVehicle?.id || Date.now(),
          reg_no: vehicleForm.reg_no,
          make: vehicleForm.make_model.split(" ")[0] || "",
          model: vehicleForm.make_model.split(" ").slice(1).join(" ") || "",
          year: selectedVehicle?.year || "",
          cai_no: selectedVehicle?.cai_no || `CAI-${Date.now().toString().slice(-6)}`,
        }
      : null;

    try {
      if (selectedCustomer) {
        const updated = {
          ...selectedCustomer,
          name: customerForm.name,
          phone: customerForm.mobile,
          whatsapp: customerForm.mobile,
          email: customerForm.email,
          address: customerForm.address,
          oilGrade: customerForm.oilGrade,
          vehicleName: customerForm.vehicleName,
          vehicles: newVehicle
            ? (selectedCustomer.vehicles || []).some((v: any) => v.reg_no === newVehicle.reg_no)
              ? selectedCustomer.vehicles.map((v: any) => v.reg_no === newVehicle.reg_no ? newVehicle : v)
              : [...(selectedCustomer.vehicles || []), newVehicle]
            : selectedCustomer.vehicles || [],
        };

        setCustomers(customers.map(c => c.id === selectedCustomer.id ? updated : c));
        setSelectedCustomer(updated);

        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers.php`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: updated.id, ...updated })
          });
        } catch {}

        toast.success("✅ Customer updated!");
      } else {
        const newCustomer = {
          id: Date.now(),
          name: customerForm.name,
          phone: customerForm.mobile,
          whatsapp: customerForm.mobile,
          email: customerForm.email,
          address: customerForm.address,
          city: "",
          oilGrade: customerForm.oilGrade,
          vehicleName: customerForm.vehicleName,
          vehicles: newVehicle ? [newVehicle] : [],
          total_purchases: 0,
          total_pending: 0,
          cai_numbers: [],
          payment_history: [],
          loyalty: "Standard",
          status: "Active",
          createdAt: today,
        };

        setCustomers([newCustomer, ...customers]);
        setSelectedCustomer(newCustomer);
        setCustomerType("saved");

        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCustomer)
          });
        } catch {}

        toast.success("✅ New customer saved!");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save customer");
    } finally {
      setIsSavingCustomer(false);
    }
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
        oilUsedL: "", mileage: "", interval: "5000",
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

  const subtotal = cart.reduce((s, i) => s + Number(i.discountedPrice || i.unitPrice || 0) * i.qty, 0);
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

  const sendWhatsAppAfterCheckout = (data: any) => {
    const stored = localStorage.getItem("concept_autos_settings");
    const settings = stored ? JSON.parse(stored) : {};
    const fallback = `🚗 *Concept Autos*\n\nAssalam-o-Alaikum *{name}*,\n\nYour invoice for order *{invoice_no}* is attached.\n\nVehicle Number: {vehicle}\nCurrent Oil Change: {current_odo}\nNext Oil Change: {next_odo}\n\nThank you for shopping with us!\n*Concept Autos Team*`;
    const template = settings.purchaseTemplate || fallback;
    const customerPhone = data.customerPhone?.trim();
    if (!customerPhone || customerPhone === "0000000000") return;
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
    setTimeout(() => window.open(`https://api.whatsapp.com/send?phone=${normalizePhone(customerPhone)}&text=${encodeURIComponent(message)}`, "_blank"), 1200);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setIsSubmitting(true);

    const caiInvoiceNo = selectedVehicle?.cai_no || `CAI-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const oilItem = cart.find(i => isOilProduct(i.product) && i.mileage);
    const currentOdometer = oilItem?.mileage || oilChangeForm.currentOdometer;
    const nextOilChange = oilItem?.mileage
      ? Number(oilItem.mileage) + Number(oilItem.interval)
      : oilChangeForm.oilChangeAfter;

    const invoiceForPrint = {
      invoiceNo, regInvoiceNo, caiInvoiceNo, date: today,
      customerName: customerForm.name || (customerType === "walk-in" ? "Walk-in Customer" : selectedCustomer?.name),
      customerPhone: customerForm.mobile || (customerType === "walk-in" ? "" : (selectedCustomer?.whatsapp || selectedCustomer?.phone)),
      customerEmail: customerForm.email,
      customerAddress: customerForm.address,
      oilGrade: customerForm.oilGrade,
      vehicleName: customerForm.vehicleName,
      vehicle: vehicleForm.reg_no || selectedVehicle?.reg_no || null,
      vehicleModel: vehicleForm.make_model || null,
      currentOdometer, nextOilChange,
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

    const updatedProducts = products.map(p => {
      const cartItem = cart.find(ci => ci.product.id === p.id);
      if (!cartItem) return p;
      const newStock = Math.max(0, Number(p.stock_qty || 0) - cartItem.qty);
      const newStockMl = p.stock_ml
        ? Math.max(0, Number(p.stock_ml) - (Number(cartItem.oilUsedL || 0) * 1000))
        : p.stock_ml;
      return { ...p, stock_qty: newStock, stock_ml: newStockMl };
    });
    setProducts(updatedProducts);
    localStorage.setItem("concept_autos_products", JSON.stringify(updatedProducts));

    try {
      for (const item of cart) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.product.id,
            quantity_sold: item.qty,
            oil_used_ml: item.oilUsedL ? Number(item.oilUsedL) * 1000 : 0
          })
        });
      }
    } catch {}

    if (selectedCustomer) {
      const updated = {
        ...selectedCustomer,
        name: customerForm.name || selectedCustomer.name,
        phone: customerForm.mobile || selectedCustomer.phone,
        email: customerForm.email || selectedCustomer.email,
        address: customerForm.address || selectedCustomer.address,
        oilGrade: customerForm.oilGrade || selectedCustomer.oilGrade,
        vehicleName: customerForm.vehicleName || selectedCustomer.vehicleName,
        cai_numbers: [...(selectedCustomer.cai_numbers || []), caiInvoiceNo],
        total_purchases: Number(selectedCustomer.total_purchases || 0) + newInvoiceTotal,
        total_pending: Math.max(0, remainingBalance),
        payment_history: [
          ...(selectedCustomer.payment_history || []),
          ...(amountReceived && Number(amountReceived) > 0 ? [{
            id: Date.now(), date: today, invoiceNo,
            amount: Number(amountReceived), method: paymentType,
            type: "Invoice Payment", notes: "Auto-recorded at checkout",
          }] : []),
        ],
      };
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? updated : c));
    }

    const hasWhatsApp = customerForm.mobile && customerForm.mobile !== "0000000000";
    const printData = { ...invoiceForPrint };

    // Show print modal instead of opening a new page
    setLastInvoiceForModal(printData);
    setIsPrintModalOpen(true);

    toast.success("Invoice generated!", {
      description: hasWhatsApp ? "WhatsApp opening..." : "Ready to print.",
    });

    setCart([]);
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setRegInvoiceNo("");
    setCustomerForm({ name: "", mobile: "", email: "", address: "", oilGrade: "", vehicleName: "" });
    setVehicleForm({ reg_no: "", make_model: "" });
    setOilChangeForm({ currentOdometer: "", oilChangeAfter: "", dailyMileage: "", dockStation: "", serviceMan1: "", serviceMan2: "" });
    setCustomerNameSearch("");
    setVehicleRegSearch("");
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

  const handlePrintSticker = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const oilItem = cart.find(i => isOilProduct(i.product) && i.mileage);
    const stickerData = {
      invoiceNo,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      customerName: customerForm.name,
      vehicle: vehicleForm.reg_no,
      currentOdometer: oilItem?.mileage || oilChangeForm.currentOdometer,
      nextOilChange: oilItem?.mileage
        ? Number(oilItem.mileage) + Number(oilItem.interval)
        : oilChangeForm.oilChangeAfter,
    };
    localStorage.setItem("last_sticker", JSON.stringify(stickerData));
    window.open("/dashboard/pos/sticker", "_blank");
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-0">
          <button onClick={() => setIsCheckPriceOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#2a7ab8] hover:bg-[#1f5d8f] text-white text-sm font-semibold rounded-l-lg cursor-pointer">
            <Search className="w-4 h-4" /> Check Price
          </button>
          <button onClick={handleWalkIn} className="flex items-center justify-center w-14 h-10 bg-[#c9302c] hover:bg-[#a02622] text-white cursor-pointer" title="Walk-in Customer (auto-fill demo)">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={handleSavedCustomer} className="flex items-center justify-center w-14 h-10 bg-[#4cae4c] hover:bg-[#3d8b3d] text-white cursor-pointer" title="Saved / New Customer">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={handleNewInvoice} className="flex items-center justify-center w-14 h-10 bg-[#2a7ab8] hover:bg-[#1f5d8f] text-white rounded-r-lg cursor-pointer" title="New Invoice (blank form)">
            <FileDown className="w-5 h-5" />
          </button>
          <button onClick={() => setIsHistoryOpen(true)} className="ml-3 flex items-center gap-2 px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer">
            <History className="w-4 h-4" /> History
          </button>
        </div>

        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
          customerType === "saved" ? "bg-[#4cae4c]/10 text-[#3d8b3d]" : "bg-[#c9302c]/10 text-[#a02622]"
        }`}>
          {customerType === "saved" ? "👤 Saved Customer" : "🚶 Walk-in Customer"}
        </div>

        <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[#25D366] hover:bg-green-50 cursor-pointer">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700">Customer Information</span>
            <button
              onClick={handleSaveCustomer}
              disabled={isSavingCustomer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4cae4c] hover:bg-[#3d8b3d] disabled:bg-zinc-300 text-white text-xs font-semibold rounded cursor-pointer"
            >
              {selectedCustomer ? (
                <><Save className="w-3.5 h-3.5" /> {isSavingCustomer ? "Updating..." : "Update Customer"}</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> {isSavingCustomer ? "Saving..." : "Save Customer"}</>
              )}
            </button>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="relative" ref={customerSuggestRef}>
              <input
                id="customer-name-input"
                type="text"
                placeholder="Full Name (type to search saved)"
                value={customerForm.name}
                onChange={e => { setCustomerForm({ ...customerForm, name: e.target.value }); setCustomerNameSearch(e.target.value); setShowCustomerSuggest(true); }}
                onFocus={() => { setCustomerNameSearch(customerForm.name); setShowCustomerSuggest(true); }}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
              />
              {showCustomerSuggest && customerSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {customerSuggestions.map(c => (
                    <div key={c.id} onClick={() => fillFromCustomer(c)} className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0">
                      <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                      <p className="text-xs text-zinc-500 font-digit">{c.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input type="tel" placeholder="Mobile Number" value={customerForm.mobile} onChange={e => setCustomerForm({ ...customerForm, mobile: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
            <input type="email" placeholder="Email Address" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>
          <div className="px-4 pb-3 grid grid-cols-3 gap-3">
            <input type="text" placeholder="Address" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
            <input type="text" placeholder="Oil Grade (e.g. 5W-30, 10W-40)" value={customerForm.oilGrade} onChange={e => setCustomerForm({ ...customerForm, oilGrade: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
            <input type="text" placeholder="Vehicle Name (e.g. Grande, Civic, Alto)" value={customerForm.vehicleName} onChange={e => setCustomerForm({ ...customerForm, vehicleName: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>
          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
            <div className="relative" ref={vehicleSuggestRef}>
              <input
                type="text"
                placeholder="Vehicle Registration (type to search saved)"
                value={vehicleForm.reg_no}
                onChange={e => { setVehicleForm({ ...vehicleForm, reg_no: e.target.value }); setVehicleRegSearch(e.target.value); setShowVehicleSuggest(true); }}
                onFocus={() => { setVehicleRegSearch(vehicleForm.reg_no); setShowVehicleSuggest(true); }}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
              />
              {showVehicleSuggest && vehicleSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {vehicleSuggestions.map(v => (
                    <div key={`${v.customer.id}-${v.id}`} onClick={() => fillFromVehicle(v)} className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0">
                      <p className="text-sm font-bold text-zinc-900 font-digit">🚗 {v.reg_no}</p>
                      <p className="text-xs text-zinc-500">{v.make} {v.model} • {v.customer.name} ({v.customer.phone})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="text" placeholder="Vehicle Make & Model" value={vehicleForm.make_model} onChange={e => setVehicleForm({ ...vehicleForm, make_model: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Oil Change Preferences</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <input type="text" placeholder="Current Odometer Reading" value={oilChangeForm.currentOdometer} onChange={e => setOilChangeForm({ ...oilChangeForm, currentOdometer: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
            <input type="text" placeholder="Oil Change After" value={oilChangeForm.oilChangeAfter} onChange={e => setOilChangeForm({ ...oilChangeForm, oilChangeAfter: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
            <input type="text" placeholder="Daily Mileage" value={oilChangeForm.dailyMileage} onChange={e => setOilChangeForm({ ...oilChangeForm, dailyMileage: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
            <select value={oilChangeForm.dockStation} onChange={e => setOilChangeForm({ ...oilChangeForm, dockStation: e.target.value })} className="px-3 py-2 text-sm border border-zinc-200 rounded cursor-pointer">
              <option value="">- Select Dock Station -</option>
              <option value="001">Dock Station: 001</option>
              <option value="002">Dock Station: 002</option>
            </select>
            <div className="col-span-2 flex gap-3">
              <input type="text" placeholder="Select Service Man (Upto 2)" value={oilChangeForm.serviceMan1} onChange={e => setOilChangeForm({ ...oilChangeForm, serviceMan1: e.target.value })} className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
              <input type="text" placeholder="Service Man 2" value={oilChangeForm.serviceMan2} onChange={e => setOilChangeForm({ ...oilChangeForm, serviceMan2: e.target.value })} className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Items Description</span>
          </div>
          <div className="p-4">
            <div className="relative" ref={dropdownRef}>
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3 relative">
                  <input type="text" placeholder="Item Name" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit" />
                  {showDropdown && searchQuery.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-sm text-zinc-500 text-center">No product found</div>
                      ) : filteredProducts.map((product) => (
                        <div key={product.id} onClick={() => addToCart(product)} className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{product.name}</p>
                            <p className="text-xs text-zinc-500 font-digit">SKU: {product.sku} • Stock: {product.stock_qty || 0}</p>
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
                <button onClick={() => { if (searchQuery.length === 0) return toast.error("Search for an item first"); const first = filteredProducts[0]; if (first) addToCart(first); else toast.error("No product found"); }} className="col-span-1 flex items-center justify-center w-full h-10 bg-success hover:bg-success-hover text-white rounded cursor-pointer">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

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
                          <td className="px-3 py-2 font-medium flex items-center gap-2">
                            {item.product.name}
                            {isOilProduct(item.product) && <Droplets className="w-4 h-4 text-primary" />}
                          </td>
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
                          <td className="px-3 py-2 text-right font-bold font-digit">Rs. {(Number(item.discountedPrice) * item.qty).toLocaleString()}</td>
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

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Other Information</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <input type="number" placeholder="Discount" value={discount} onChange={e => setDiscount(e.target.value === "" ? "" : Number(e.target.value))} className="px-3 py-2 text-sm border border-zinc-200 rounded font-digit" />
              <input type="text" placeholder="Reg. Invoice Number" value={regInvoiceNo} onChange={e => setRegInvoiceNo(e.target.value)} className="px-3 py-2 text-sm border border-zinc-200 rounded font-digit" />
              <input type="text" placeholder="Total Amount" value={subtotal.toLocaleString()} readOnly className="px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit font-bold" />
              <input type="number" placeholder="Service Charges" value={serviceCharges} onChange={e => setServiceCharges(e.target.value === "" ? "" : Number(e.target.value))} className="px-3 py-2 text-sm border border-zinc-200 rounded font-digit" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Payment Type</label>
                <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded cursor-pointer font-digit">
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
                <input type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value === "" ? "" : Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded font-digit" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Remaining Balance</label>
                <input type="text" value={remainingBalance.toLocaleString()} readOnly className={`w-full px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit font-bold ${remainingBalance > 0 ? "text-danger" : "text-success"}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-4">
          <button onClick={handleCheckout} disabled={isSubmitting || cart.length === 0} className="flex items-center gap-2 px-6 py-3 bg-[#2a7ab8] hover:bg-[#1f5d8f] disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg cursor-pointer">
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <button onClick={handlePrintSticker} disabled={cart.length === 0} className="flex items-center gap-2 px-6 py-3 bg-[#4cae4c] hover:bg-[#3d8b3d] disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg cursor-pointer">
            <Tag className="w-4 h-4" /> Print Sticker
          </button>
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-lg cursor-pointer">
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>

      <CheckPriceModal isOpen={isCheckPriceOpen} onClose={() => setIsCheckPriceOpen(false)} products={products} />

      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={lastInvoiceForModal}
      />

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