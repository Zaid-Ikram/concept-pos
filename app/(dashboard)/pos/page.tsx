"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Plus, Trash2, Minus, MessageCircle, Save, X, Droplets,
  History, FileDown, Printer, UserPlus, TrendingUp
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

  const [customerForm, setCustomerForm] = useState({ name: "", mobile: "", address: "", oilGrade: "" });
  const [vehicleForm, setVehicleForm] = useState({ reg_no: "" });
  const [oilChangeForm, setOilChangeForm] = useState({
    currentOdometer: "",
    oilChangeAfter: "",
    dockStation: "",
    serviceMan1: "",
    serviceMan2: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isCheckPriceOpen, setIsCheckPriceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [isProfitPanelOpen, setIsProfitPanelOpen] = useState(false);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [lastInvoiceForModal, setLastInvoiceForModal] = useState<any>(null);

  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [regInvoiceNo, setRegInvoiceNo] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [amountReceived, setAmountReceived] = useState<number | "">("");
  const [discount, setDiscount] = useState<number | "">("");
  const [serviceCharges, setServiceCharges] = useState<number | "">("");
  const [payLaterDate, setPayLaterDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // ============ LOAD DATA ============
  useEffect(() => {
    const sp = localStorage.getItem("concept_autos_products");
    if (sp) { try { setProducts(JSON.parse(sp)); } catch {} }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setProducts(d); })
      .catch(() => {});

    const sc = localStorage.getItem("concept_autos_customers");
    if (sc) try { setCustomers(JSON.parse(sc)); } catch {}
  }, []);

  useEffect(() => {
    if (customers.length > 0)
      localStorage.setItem("concept_autos_customers", JSON.stringify(customers));
  }, [customers]);

  // ============ CLICK OUTSIDE ============
  useEffect(() => {
    function h(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
      if (customerSuggestRef.current && !customerSuggestRef.current.contains(e.target as Node))
        setShowCustomerSuggest(false);
      if (vehicleSuggestRef.current && !vehicleSuggestRef.current.contains(e.target as Node))
        setShowVehicleSuggest(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ============ SHORTCUTS ============
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

  // Ctrl+X → profit panel
  useEffect(() => {
    function handleProfitShortcut(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        e.preventDefault();
        if (cart.length === 0) return toast.error("Cart is empty");
        setIsProfitPanelOpen(true);
      }
    }
    window.addEventListener("keydown", handleProfitShortcut);
    return () => window.removeEventListener("keydown", handleProfitShortcut);
  }, [cart]);

  // ============ HELPERS ============
  const isOilProduct = (p: any) =>
    p.category?.toLowerCase().includes("oil") || p.stock_ml > 0;

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customerSuggestions = customerNameSearch.length > 0
    ? customers
        .filter(c =>
          c.name?.toLowerCase().includes(customerNameSearch.toLowerCase()) ||
          c.phone?.includes(customerNameSearch)
        )
        .slice(0, 6)
    : [];

  const allVehicles = customers.flatMap(c =>
    (c.vehicles || []).map((v: any) => ({ ...v, customer: c }))
  );

  const vehicleSuggestions = (() => {
    if (customerType === "saved" && selectedCustomer?.vehicles?.length > 0) {
      const custVehicles = selectedCustomer.vehicles.map((v: any) => ({
        ...v,
        customer: selectedCustomer,
      }));
      if (vehicleRegSearch.length > 0) {
        return custVehicles.filter((v: any) =>
          v.reg_no?.toLowerCase().includes(vehicleRegSearch.toLowerCase())
        );
      }
      return custVehicles;
    }
    if (vehicleRegSearch.length > 0) {
      return allVehicles
        .filter((v: any) => v.reg_no?.toLowerCase().includes(vehicleRegSearch.toLowerCase()))
        .slice(0, 8);
    }
    return [];
  })();

  const allInvoices: any[] = (() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); }
    catch { return []; }
  })();

  const filteredInvoices = historySearch.length > 0
    ? allInvoices.filter(inv =>
        inv.customerName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.vehicle?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.invoiceNo?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : allInvoices;

  // ============ BUTTON HANDLERS ============
  const handleWalkIn = () => {
    setCustomerType("walk-in");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCart([]);
    setCustomerNameSearch("Walk-in");
    setVehicleRegSearch("");
    setCustomerForm({ name: "Walk-in", mobile: "0000000000", address: "Walk-in Customer", oilGrade: "" });
    setVehicleForm({ reg_no: "WALK-IN" });
    setOilChangeForm({ currentOdometer: "0", oilChangeAfter: "", dockStation: "001", serviceMan1: "", serviceMan2: "" });
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setPaymentType("");
    toast.success("Walk-in ready");
  };

  const handleSavedCustomer = () => {
    setCustomerType("saved");
    setCustomerForm({ name: "", mobile: "", address: "", oilGrade: "" });
    setVehicleForm({ reg_no: "" });
    setCustomerNameSearch("");
    setVehicleRegSearch("");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    toast.info("Search saved customer");
    setTimeout(() => document.getElementById("customer-name-input")?.focus(), 100);
  };

  const handleNewInvoice = () => {
    setCart([]);
    setCustomerType("walk-in");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCustomerNameSearch("");
    setVehicleRegSearch("");
    setCustomerForm({ name: "", mobile: "", address: "", oilGrade: "" });
    setVehicleForm({ reg_no: "" });
    setOilChangeForm({ currentOdometer: "", oilChangeAfter: "", dockStation: "", serviceMan1: "", serviceMan2: "" });
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setRegInvoiceNo("");
    setDiscount("");
    setServiceCharges("");
    setAmountReceived("");
    setPayLaterDate("");
    setPaymentType("");
    toast.success("New invoice started");
  };

  const fillFromCustomer = (c: any) => {
    setSelectedCustomer(c);
    setCustomerType("saved");
    setCustomerForm({
      name: c.name || "",
      mobile: c.phone || "",
      address: c.address || "",
      oilGrade: c.oilGrade || "",
    });
    setCustomerNameSearch(c.name || "");
    setShowCustomerSuggest(false);

    if (c.vehicles?.length > 0) {
      const v = c.vehicles[0];
      setSelectedVehicle({ ...v, customer: c });
      setVehicleForm({ reg_no: v.reg_no || "" });
      setVehicleRegSearch(v.reg_no || "");
    } else {
      setSelectedVehicle(null);
      setVehicleForm({ reg_no: "" });
      setVehicleRegSearch("");
    }
  };

  const fillFromVehicle = (v: any) => {
    const c = v.customer;
    setSelectedVehicle(v);
    setSelectedCustomer(c);
    setCustomerType("saved");
    setCustomerForm({
      name: c.name || "",
      mobile: c.phone || "",
      address: c.address || "",
      oilGrade: v.oil_grade || c.oilGrade || "",
    });
    setVehicleForm({ reg_no: v.reg_no || "" });
    setCustomerNameSearch(c.name || "");
    setVehicleRegSearch(v.reg_no || "");
    setShowVehicleSuggest(false);
  };

  // ============ SAVE / UPDATE CUSTOMER ============
  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) return toast.error("Name required");
    if (!customerForm.mobile.trim()) return toast.error("Mobile required");
    setIsSavingCustomer(true);
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const newVehicle = vehicleForm.reg_no
      ? {
          id: selectedVehicle?.id || Date.now(),
          reg_no: vehicleForm.reg_no,
          make: selectedVehicle?.make || "",
          model: selectedVehicle?.model || "",
          year: selectedVehicle?.year || "",
          oil_grade: customerForm.oilGrade || selectedVehicle?.oil_grade || "",
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
          address: customerForm.address,
          oilGrade: customerForm.oilGrade,
          vehicles: newVehicle
            ? (selectedCustomer.vehicles || []).some((v: any) => v.reg_no === newVehicle.reg_no)
              ? selectedCustomer.vehicles.map((v: any) =>
                  v.reg_no === newVehicle.reg_no ? { ...v, ...newVehicle } : v
                )
              : [...(selectedCustomer.vehicles || []), newVehicle]
            : selectedCustomer.vehicles || [],
        };
        setCustomers(customers.map(c => (c.id === selectedCustomer.id ? updated : c)));
        setSelectedCustomer(updated);
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers.php`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: updated.id, ...updated }),
          });
        } catch {}
        toast.success("✅ Customer updated!");
      } else {
        const nc = {
          id: Date.now(),
          name: customerForm.name,
          phone: customerForm.mobile,
          whatsapp: customerForm.mobile,
          email: "",
          address: customerForm.address,
          city: "",
          oilGrade: customerForm.oilGrade,
          vehicles: newVehicle ? [newVehicle] : [],
          total_purchases: 0,
          total_pending: 0,
          cai_numbers: [],
          ledger: [],
          loyalty: "Standard",
          status: "Active",
          createdAt: today,
        };
        setCustomers([nc, ...customers]);
        setSelectedCustomer(nc);
        setCustomerType("saved");
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nc),
          });
        } catch {}
        toast.success("✅ Customer saved!");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // ============ CART OPS ============
  const addToCart = (product: any) => {
    const currentInCart = cart.find(i => i.product.id === product.id)?.qty || 0;
    const available = Number(product.stock_qty || 0);
    if (currentInCart + 1 > available) return toast.error(`Only ${available} in stock`);

    setCart(prev => {
      const ex = prev.find(item => item.product.id === product.id);
      if (ex)
        return prev.map(item =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      return [
        ...prev,
        {
          product,
          qty: 1,
          unit: "pcs",
          unitPrice: Number(product.sale_price),
          discountedPrice: Number(product.sale_price),
          oilUsedL: "",
          mileage: "",
          interval: "5000",
        },
      ];
    });
    setSearchQuery("");
    setShowDropdown(false);
    toast.success(`${product.name} added`);
  };

  const updateQtyValue = (id: number, value: string) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id !== id) return item;
        const num = Number(value);
        if (isNaN(num)) return item;
        const min = item.unit === "L" ? 0.01 : 1;
        const capped = Math.min(Math.max(min, num), Number(item.product.stock_qty || 0));
        return { ...item, qty: capped };
      })
    );
  };

  const updateUnit = (id: number, unit: string) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === id
          ? { ...item, unit, qty: unit === "L" ? 1 : Math.round(item.qty) }
          : item
      )
    );
  };

  const updateOilField = (id: number, field: string, value: string) =>
    setCart(prev =>
      prev.map(item => (item.product.id === id ? { ...item, [field]: value } : item))
    );

  const updateUnitPrice = (id: number, price: number) =>
    setCart(prev =>
      prev.map(item =>
        item.product.id === id ? { ...item, unitPrice: price, discountedPrice: price } : item
      )
    );

  const updateDiscountedPrice = (id: number, price: number) =>
    setCart(prev =>
      prev.map(item => (item.product.id === id ? { ...item, discountedPrice: price } : item))
    );

  const removeFromCart = (id: number) =>
    setCart(prev => prev.filter(item => item.product.id !== id));

  // ============ TOTALS ============
  const subtotal = cart.reduce((s, i) => s + Number(i.discountedPrice || i.unitPrice || 0) * i.qty, 0);
  const discountAmount = discount === "" ? 0 : Number(discount);
  const serviceChargesAmount = serviceCharges === "" ? 0 : Number(serviceCharges);
  const newInvoiceTotal = Math.max(0, subtotal - discountAmount + serviceChargesAmount);
  const previousPending =
    customerType === "saved" && selectedCustomer
      ? Number(selectedCustomer.total_pending || 0)
      : 0;
  const grandTotal = newInvoiceTotal + previousPending;
  const remainingBalance = amountReceived === "" ? grandTotal : grandTotal - Number(amountReceived);

  // ============ CHECKOUT ============
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!paymentType) return toast.error("Please select a Payment Type");
    if (paymentType === "Pay Later (Credit)" && !payLaterDate)
      return toast.error("Please select a payment due date");

    setIsSubmitting(true);

    const caiInvoiceNo =
      selectedVehicle?.cai_no || `CAI-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const oilItem = cart.find(i => isOilProduct(i.product) && i.mileage);
    const currentOdometer = oilItem?.mileage || oilChangeForm.currentOdometer;

    const nextOilChange = oilItem?.mileage
      ? String(Number(oilItem.mileage) + Number(oilItem.interval))
      : Number(oilChangeForm.currentOdometer) > 0 && Number(oilChangeForm.oilChangeAfter) > 0
      ? String(Number(oilChangeForm.currentOdometer) + Number(oilChangeForm.oilChangeAfter))
      : oilChangeForm.oilChangeAfter || "";

    const invoiceForPrint = {
      invoiceNo,
      regInvoiceNo,
      caiInvoiceNo,
      date: today,
      customerName:
        customerForm.name || (customerType === "walk-in" ? "Walk-in Customer" : selectedCustomer?.name),
      customerPhone:
        customerForm.mobile ||
        (customerType === "walk-in"
          ? ""
          : selectedCustomer?.whatsapp || selectedCustomer?.phone),
      customerAddress: customerForm.address,
      oilGrade: customerForm.oilGrade,
      vehicle: vehicleForm.reg_no || selectedVehicle?.reg_no || null,
      vehicleModel: selectedVehicle
        ? `${selectedVehicle.make || ""} ${selectedVehicle.model || ""}`.trim()
        : null,
      currentOdometer,
      nextOilChange,
      oilChangeAfter: oilChangeForm.oilChangeAfter,
      dockStation: oilChangeForm.dockStation,
      serviceMan1: oilChangeForm.serviceMan1,
      serviceMan2: oilChangeForm.serviceMan2,
      items: cart.map(item => ({
        name: item.product.name,
        qty: item.qty,
        unit: item.unit,
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
      payments: [],
    };

    localStorage.setItem("last_invoice", JSON.stringify(invoiceForPrint));
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); }
      catch { return []; }
    })();
    existing.unshift(invoiceForPrint);
    localStorage.setItem("concept_autos_invoices", JSON.stringify(existing.slice(0, 500)));

    // Stock deduction — never negative
    const updatedProducts = products.map(p => {
      const ci = cart.find(c => c.product.id === p.id);
      if (!ci) return p;
      const newStock = Math.max(0, Number(p.stock_qty || 0) - ci.qty);
      const newStockMl = p.stock_ml
        ? Math.max(0, Number(p.stock_ml) - (Number(ci.oilUsedL || 0) * 1000))
        : p.stock_ml;
      return { ...p, stock_qty: newStock, stock_ml: newStockMl };
    });
    setProducts(updatedProducts);
    localStorage.setItem("concept_autos_products", JSON.stringify(updatedProducts));

    // Stock history
    const history = (() => {
      try { return JSON.parse(localStorage.getItem("concept_autos_stock_history") || "[]"); }
      catch { return []; }
    })();
    cart.forEach(item => {
      history.unshift({
        id: Date.now() + Math.random(),
        productId: item.product.id,
        productName: item.product.name,
        date: today,
        type: "Sale",
        qty: -item.qty,
        ref: invoiceNo,
        user: "Admin",
      });
    });
    localStorage.setItem("concept_autos_stock_history", JSON.stringify(history.slice(0, 1000)));

    // Waste oil auto-calc (95%)
    const oilItemsForWaste = cart.filter(i => isOilProduct(i.product) && Number(i.oilUsedL) > 0);
    if (oilItemsForWaste.length > 0) {
      const wasteEntries = (() => {
        try { return JSON.parse(localStorage.getItem("concept_autos_waste_oil") || "[]"); }
        catch { return []; }
      })();
      oilItemsForWaste.forEach(item => {
        const newOilL = Number(item.oilUsedL);
        const wasteL = +(newOilL * 0.95).toFixed(2);
        wasteEntries.unshift({
          id: Date.now() + Math.random(),
          date: today,
          type: "Collection",
          quantity_ml: Math.round(wasteL * 1000),
          reference: invoiceNo,
          notes: `${item.product.name} — ${newOilL}L new → ${wasteL}L waste`,
          amount: 0,
        });
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/waste_oil.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: today,
            source: "Oil Change",
            quantity_ml: Math.round(wasteL * 1000),
            reference: invoiceNo,
            notes: `${item.product.name} — ${newOilL}L`,
          }),
        }).catch(() => {});
      });
      localStorage.setItem("concept_autos_waste_oil", JSON.stringify(wasteEntries.slice(0, 500)));
      const totalWasteL = oilItemsForWaste
        .reduce((s, i) => s + Number(i.oilUsedL) * 0.95, 0)
        .toFixed(2);
      toast.success(`Waste oil +${totalWasteL}L logged (95%)`, { duration: 4000 });
    }

    // API sync
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
            unit: item.unit,
            unit_price: item.unitPrice,
            total: item.discountedPrice * item.qty,
          })),
        }),
      });
      for (const item of cart) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products.php`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.product.id,
            quantity_sold: item.qty,
            oil_used_ml: item.oilUsedL ? Number(item.oilUsedL) * 1000 : 0,
          }),
        });
      }
    } catch {}

    // Update customer record
    if (selectedCustomer) {
      const updated = {
        ...selectedCustomer,
        name: customerForm.name || selectedCustomer.name,
        phone: customerForm.mobile || selectedCustomer.phone,
        address: customerForm.address || selectedCustomer.address,
        oilGrade: customerForm.oilGrade || selectedCustomer.oilGrade,
        cai_numbers: [...(selectedCustomer.cai_numbers || []), caiInvoiceNo],
        total_purchases: Number(selectedCustomer.total_purchases || 0) + newInvoiceTotal,
        total_pending: Math.max(0, remainingBalance),
        ledger: [
          ...(selectedCustomer.ledger || []),
          {
            id: Date.now(),
            date: today,
            type: "Sale",
            invoiceNo,
            amount: newInvoiceTotal,
            method: paymentType,
            notes: `Invoice ${invoiceNo}`,
          },
          ...(amountReceived && Number(amountReceived) > 0
            ? [
                {
                  id: Date.now() + 1,
                  date: today,
                  type: "Payment",
                  invoiceNo,
                  amount: Number(amountReceived),
                  method: paymentType,
                  notes: "Paid at checkout",
                },
              ]
            : []),
        ],
      };
      setCustomers(customers.map(c => (c.id === selectedCustomer.id ? updated : c)));
    }

    setLastInvoiceForModal(invoiceForPrint);
    setIsPrintModalOpen(true);
    toast.success("Invoice ready!");

    // Reset
    setCart([]);
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setRegInvoiceNo("");
    setCustomerForm({ name: "", mobile: "", address: "", oilGrade: "" });
    setVehicleForm({ reg_no: "" });
    setOilChangeForm({
      currentOdometer: "",
      oilChangeAfter: "",
      dockStation: "",
      serviceMan1: "",
      serviceMan2: "",
    });
    setCustomerNameSearch("");
    setVehicleRegSearch("");
    setAmountReceived("");
    setDiscount("");
    setServiceCharges("");
    setPayLaterDate("");
    setPaymentType("");
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCustomerType("walk-in");
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ============ TOP BAR ============ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white border border-zinc-200 rounded-xl p-2 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setIsCheckPriceOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Search className="w-4 h-4" /> Check Price
          </button>
          <button
            onClick={handleWalkIn}
            className="flex items-center justify-center w-11 h-10 bg-zinc-100 hover:bg-zinc-200 text-[#c9302c] rounded-lg cursor-pointer shrink-0"
            title="Walk-in"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleSavedCustomer}
            className="flex items-center justify-center w-11 h-10 bg-zinc-100 hover:bg-zinc-200 text-[#4cae4c] rounded-lg cursor-pointer shrink-0"
            title="Saved Customer"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleNewInvoice}
            className="flex items-center justify-center w-11 h-10 bg-zinc-100 hover:bg-zinc-200 text-[#2a7ab8] rounded-lg cursor-pointer shrink-0"
            title="New Invoice"
          >
            <FileDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap"
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto justify-end">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              customerType === "saved"
                ? "bg-[#4cae4c]/10 text-[#3d8b3d]"
                : "bg-[#c9302c]/10 text-[#a02622]"
            }`}
          >
            {customerType === "saved" ? "👤 Saved Customer" : "🚶 Walk-in Customer"}
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[#25D366] hover:bg-green-50 cursor-pointer shrink-0">
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* ============ CUSTOMER INFORMATION ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-zinc-700">Customer Information</span>
            <div className="flex items-center gap-2">
              {selectedCustomer && (
                <button
                  onClick={() => {
                    const invoices: any[] = (() => {
                      try { return JSON.parse(localStorage.getItem("concept_autos_invoices") || "[]"); }
                      catch { return []; }
                    })();
                    const custInvoices = invoices.filter(
                      (inv: any) => inv.customerName === selectedCustomer.name
                    );
                    if (custInvoices.length === 0)
                      return toast.info(`No previous work for ${selectedCustomer.name}`);
                    const last = custInvoices[0];
                    const totalLifetime = custInvoices.reduce(
                      (s: number, i: any) => s + Number(i.total || 0),
                      0
                    );
                    const itemsList = (last.items || [])
                      .slice(0, 3)
                      .map((it: any) => `${it.name} ×${it.qty}`)
                      .join(", ");
                    toast.info(`📋 ${selectedCustomer.name} — ${custInvoices.length} invoice(s)`, {
                      description: `Last: ${last.date} (${last.invoiceNo}) · ${itemsList}\nLifetime: Rs. ${totalLifetime.toLocaleString()}`,
                      duration: 8000,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" /> Last Work
                </button>
              )}
              <button
                onClick={handleSaveCustomer}
                disabled={isSavingCustomer}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4cae4c] hover:bg-[#3d8b3d] disabled:bg-zinc-300 text-white text-xs font-semibold rounded cursor-pointer"
              >
                {selectedCustomer ? (
                  <>
                    <Save className="w-3.5 h-3.5" />{" "}
                    {isSavingCustomer ? "Updating..." : "Update Customer"}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />{" "}
                    {isSavingCustomer ? "Saving..." : "Save Customer"}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Full Name */}
            <div className="relative" ref={customerSuggestRef}>
              <input
                id="customer-name-input"
                type="text"
                placeholder="Full Name (type to search saved)"
                value={customerForm.name}
                onChange={e => {
                  setCustomerForm({ ...customerForm, name: e.target.value });
                  setCustomerNameSearch(e.target.value);
                  setShowCustomerSuggest(true);
                }}
                onFocus={() => {
                  setCustomerNameSearch(customerForm.name);
                  setShowCustomerSuggest(true);
                }}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
              />
              {showCustomerSuggest && customerSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {customerSuggestions.map(c => (
                    <div
                      key={c.id}
                      onClick={() => fillFromCustomer(c)}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0"
                    >
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-zinc-500 font-digit">{c.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Registration */}
            <div className="relative" ref={vehicleSuggestRef}>
              <input
                type="text"
                placeholder={
                  customerType === "saved" && selectedCustomer?.vehicles?.length > 1
                    ? `Select vehicle (${selectedCustomer.vehicles.length} available)`
                    : "Vehicle Registration (type to search)"
                }
                value={vehicleForm.reg_no}
                onChange={e => {
                  setVehicleForm({ reg_no: e.target.value });
                  setVehicleRegSearch(e.target.value);
                  setShowVehicleSuggest(true);
                }}
                onFocus={() => {
                  if (customerType === "saved" && selectedCustomer) {
                    setVehicleRegSearch("");
                  } else {
                    setVehicleRegSearch(vehicleForm.reg_no);
                  }
                  setShowVehicleSuggest(true);
                }}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
              />
              {showVehicleSuggest && vehicleSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
                  {vehicleSuggestions.map((v: any) => (
                    <div
                      key={`${v.customer.id}-${v.id}`}
                      onClick={() => fillFromVehicle(v)}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0"
                    >
                      <p className="text-sm font-bold font-digit">🚗 {v.reg_no}</p>
                      <p className="text-xs text-zinc-500">
                        {v.make && v.model ? `${v.make} ${v.model}` : ""}
                        {v.oil_grade ? ` • ${v.oil_grade}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {customerType === "saved" &&
                selectedCustomer?.vehicles?.length > 1 &&
                !showVehicleSuggest && (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {selectedCustomer.vehicles.length} vehicles available — click the field to select
                  </p>
                )}
            </div>

            {/* Mobile */}
            <input
              type="tel"
              placeholder="Mobile Number"
              value={customerForm.mobile}
              onChange={e => setCustomerForm({ ...customerForm, mobile: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
          </div>

          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Address"
              value={customerForm.address}
              onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder="Oil Grade (e.g. 5W-30, 10W-40)"
              value={customerForm.oilGrade}
              onChange={e => setCustomerForm({ ...customerForm, oilGrade: e.target.value })}
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
          </div>
        </div>

        {/* ============ ITEMS ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Items</span>
          </div>
          <div className="p-4">
            <div className="relative" ref={dropdownRef}>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search item..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
                  />
                  {showDropdown && searchQuery.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-sm text-zinc-500 text-center">No product</div>
                      ) : (
                        filteredProducts.map(p => (
                          <div
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-zinc-100 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-zinc-500 font-digit">Stock: {p.stock_qty || 0}</p>
                            </div>
                            <span className="text-sm font-bold text-primary font-digit">
                              Rs. {p.sale_price}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!searchQuery) return toast.error("Search first");
                    const f = filteredProducts[0];
                    if (f) addToCart(f);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#4cae4c] hover:bg-[#3d8b3d] text-white font-semibold rounded cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" /> Add
                </button>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 border border-zinc-200 rounded overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Item</th>
                      <th className="px-3 py-2 text-center font-medium">Unit</th>
                      <th className="px-3 py-2 text-center font-medium">Unit Price</th>
                      <th className="px-3 py-2 text-center font-medium">Discounted</th>
                      <th className="px-3 py-2 text-center font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {cart.map(item => (
                      <>
                        <tr key={item.product.id}>
                          <td className="px-3 py-2 font-medium">
                            <div className="flex items-center gap-2">
                              {item.product.name}
                              {isOilProduct(item.product) && (
                                <Droplets className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <select
                              value={item.unit}
                              onChange={e => updateUnit(item.product.id, e.target.value)}
                              className="px-2 py-1 text-xs border border-zinc-200 rounded font-digit cursor-pointer"
                            >
                              <option value="pcs">pcs</option>
                              <option value="L">L</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={e => updateUnitPrice(item.product.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 text-sm border border-zinc-200 rounded font-digit"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.discountedPrice}
                              onChange={e =>
                                updateDiscountedPrice(item.product.id, Number(e.target.value))
                              }
                              className="w-20 px-2 py-1 text-sm border border-zinc-200 rounded font-digit"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() =>
                                  updateQtyValue(
                                    item.product.id,
                                    String(item.qty - (item.unit === "L" ? 0.1 : 1))
                                  )
                                }
                                className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                step={item.unit === "L" ? "0.01" : "1"}
                                min={item.unit === "L" ? "0.01" : "1"}
                                value={item.qty}
                                onChange={e => updateQtyValue(item.product.id, e.target.value)}
                                className="w-16 px-1 py-1 text-sm text-center border border-zinc-200 rounded font-digit"
                              />
                              <button
                                onClick={() =>
                                  updateQtyValue(
                                    item.product.id,
                                    String(item.qty + (item.unit === "L" ? 0.1 : 1))
                                  )
                                }
                                className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-bold font-digit">
                            Rs.{" "}
                            {(Number(item.discountedPrice) * item.qty).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        {isOilProduct(item.product) && (
                          <tr className="bg-primary/5">
                            <td colSpan={7} className="px-3 py-2">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.oilUsedL}
                                  onChange={e =>
                                    updateOilField(item.product.id, "oilUsedL", e.target.value)
                                  }
                                  placeholder="Oil Used (L)"
                                  className="px-2 py-1 text-xs border border-primary/30 rounded font-digit"
                                />
                                <input
                                  type="number"
                                  value={item.mileage}
                                  onChange={e =>
                                    updateOilField(item.product.id, "mileage", e.target.value)
                                  }
                                  placeholder="Current ODO (km)"
                                  className="px-2 py-1 text-xs border border-primary/30 rounded font-digit"
                                />
                                <select
                                  value={item.interval}
                                  onChange={e =>
                                    updateOilField(item.product.id, "interval", e.target.value)
                                  }
                                  className="px-2 py-1 text-xs border border-primary/30 rounded font-digit"
                                >
                                  <option value="3500">+3,500</option>
                                  <option value="4000">+4,000</option>
                                  <option value="4500">+4,500</option>
                                  <option value="5000">+5,000</option>
                                </select>
                                <input
                                  type="number"
                                  value={
                                    item.mileage
                                      ? Number(item.mileage) + Number(item.interval)
                                      : ""
                                  }
                                  readOnly
                                  placeholder="Next Change"
                                  className="px-2 py-1 text-xs border border-primary/30 rounded bg-primary/10 font-digit"
                                />
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

        {/* ============ OIL CHANGE PREFERENCES (moved here, below Items) ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-700">Oil Change Preferences</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Current Odometer Reading"
              value={oilChangeForm.currentOdometer}
              onChange={e =>
                setOilChangeForm({ ...oilChangeForm, currentOdometer: e.target.value })
              }
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
            <input
              type="number"
              placeholder="Oil Change After (e.g. 4500)"
              value={oilChangeForm.oilChangeAfter}
              onChange={e =>
                setOilChangeForm({ ...oilChangeForm, oilChangeAfter: e.target.value })
              }
              className="px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none font-digit"
            />
            {/* Auto Next Oil Change */}
            <input
              type="text"
              placeholder="Next Oil Change (Auto)"
              value={
                oilChangeForm.currentOdometer && oilChangeForm.oilChangeAfter
                  ? (
                      Number(oilChangeForm.currentOdometer) +
                      Number(oilChangeForm.oilChangeAfter)
                    ).toLocaleString()
                  : ""
              }
              readOnly
              className="px-3 py-2 text-sm bg-primary/5 border border-primary/30 text-primary font-bold rounded font-digit cursor-not-allowed"
              title="Current Reading + Oil Change After"
            />
            <select
              value={oilChangeForm.dockStation}
              onChange={e =>
                setOilChangeForm({ ...oilChangeForm, dockStation: e.target.value })
              }
              className="px-3 py-2 text-sm border border-zinc-200 rounded cursor-pointer"
            >
              <option value="">- Select Dock Station -</option>
              <option value="001">Dock Station: 001</option>
              <option value="002">Dock Station: 002</option>
            </select>
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Service Man 1"
                value={oilChangeForm.serviceMan1}
                onChange={e =>
                  setOilChangeForm({ ...oilChangeForm, serviceMan1: e.target.value })
                }
                className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Service Man 2"
                value={oilChangeForm.serviceMan2}
                onChange={e =>
                  setOilChangeForm({ ...oilChangeForm, serviceMan2: e.target.value })
                }
                className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ============ PAYMENT ============ */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700">Payment</span>
            {cart.length > 0 && (
              <button
                onClick={() => setIsProfitPanelOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 hover:bg-success/20 text-success text-[10px] font-semibold rounded cursor-pointer"
                title="Ctrl+X"
              >
                <TrendingUp className="w-3 h-3" /> Profit (Ctrl+X)
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="number"
                placeholder="Discount"
                value={discount}
                onChange={e => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                className="px-3 py-2 text-sm border border-zinc-200 rounded font-digit"
              />
              <input
                type="text"
                placeholder="Reg. Invoice"
                value={regInvoiceNo}
                onChange={e => setRegInvoiceNo(e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-200 rounded font-digit"
              />
              <input
                type="text"
                placeholder="Subtotal"
                value={subtotal.toLocaleString()}
                readOnly
                className="px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit font-bold"
              />
              <input
                type="number"
                placeholder="Service Charges"
                value={serviceCharges}
                onChange={e =>
                  setServiceCharges(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="px-3 py-2 text-sm border border-zinc-200 rounded font-digit"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded cursor-pointer font-digit ${
                    paymentType === "" ? "border-danger/40 bg-danger/5" : "border-zinc-200"
                  }`}
                >
                  <option value="" disabled>
                    — Select Payment Type —
                  </option>
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
                  onChange={e =>
                    setAmountReceived(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded font-digit"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Remaining</label>
                <input
                  type="text"
                  value={remainingBalance.toLocaleString()}
                  readOnly
                  className={`w-full px-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded font-digit font-bold ${
                    remainingBalance > 0 ? "text-danger" : "text-success"
                  }`}
                />
              </div>
            </div>

            {/* Pay Later date */}
            {paymentType === "Pay Later (Credit)" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <label className="block text-xs font-semibold text-amber-700 mb-1">
                  📅 Payment Due Date — When will the customer pay?
                </label>
                <input
                  type="date"
                  value={payLaterDate}
                  onChange={e => setPayLaterDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full sm:w-64 px-3 py-2 text-sm border border-amber-300 rounded bg-white font-digit focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {payLaterDate && (
                  <p className="text-xs text-amber-700 mt-1">
                    🔔 Reminder on{" "}
                    <span className="font-semibold">
                      {new Date(payLaterDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Existing pending */}
            {selectedCustomer &&
              (selectedCustomer.ledger || []).filter((l: any) => l.type === "Sale").length > 0 && (
                <div className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-danger mb-2">
                    ⚠ Existing Pending from previous invoices
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(selectedCustomer.ledger || [])
                      .filter((l: any) => l.type === "Sale")
                      .slice(-5)
                      .reverse()
                      .map((l: any) => (
                        <div
                          key={l.id}
                          className="flex justify-between items-center bg-white rounded px-2 py-1.5 text-xs border border-danger/10"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-digit text-zinc-500">{l.date}</span>
                            <span className="text-zinc-600">·</span>
                            <span className="font-digit text-zinc-700">{l.invoiceNo}</span>
                          </div>
                          <span className="font-bold text-danger font-digit">
                            Rs. {Number(l.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-danger/20 text-xs">
                    <span className="text-zinc-600">Total Pending:</span>
                    <span className="font-bold text-danger font-digit">
                      Rs. {Number(selectedCustomer.total_pending || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* ============ ACTION BUTTONS ============ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-4">
          <button
            onClick={handleCheckout}
            disabled={isSubmitting || cart.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7ab8] hover:bg-[#1f5d8f] disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>

      <CheckPriceModal
        isOpen={isCheckPriceOpen}
        onClose={() => setIsCheckPriceOpen(false)}
        products={products}
      />

      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={lastInvoiceForModal}
      />

      {/* ============ PROFIT PANEL (Ctrl+X) ============ */}
      {isProfitPanelOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[150]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                💰 Profit & Margin Analysis
                <span className="text-xs text-zinc-400 font-normal">Ctrl+X</span>
              </h2>
              <button
                onClick={() => setIsProfitPanelOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium">Item</th>
                    <th className="text-right py-2 px-2 font-medium">Cost</th>
                    <th className="text-right py-2 px-2 font-medium">Sale</th>
                    <th className="text-right py-2 px-2 font-medium">Profit</th>
                    <th className="text-right py-2 px-2 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {cart.map(item => {
                    const cost = Number(item.product.purchase_price || 0);
                    const sale = Number(item.discountedPrice || item.unitPrice || 0);
                    const profit = (sale - cost) * item.qty;
                    const margin = sale > 0 ? (((sale - cost) / sale) * 100).toFixed(1) : "0.0";
                    const marginNum = parseFloat(margin);
                    return (
                      <tr key={item.product.id} className="hover:bg-zinc-50">
                        <td className="py-2 px-2 font-medium text-zinc-900">
                          {item.product.name}
                          <span className="text-xs text-zinc-500 ml-1">× {item.qty}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-digit text-zinc-600">
                          Rs. {cost.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right font-digit text-zinc-900">
                          Rs. {sale.toLocaleString()}
                        </td>
                        <td
                          className={`py-2 px-2 text-right font-bold font-digit ${
                            profit >= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          Rs. {profit.toLocaleString()}
                        </td>
                        <td
                          className={`py-2 px-2 text-right font-digit ${
                            marginNum >= 30
                              ? "text-success"
                              : marginNum >= 10
                              ? "text-amber-600"
                              : "text-danger"
                          }`}
                        >
                          {margin}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(() => {
                const totalCost = cart.reduce(
                  (s, i) => s + Number(i.product.purchase_price || 0) * i.qty,
                  0
                );
                const totalSale = cart.reduce(
                  (s, i) => s + Number(i.discountedPrice || i.unitPrice || 0) * i.qty,
                  0
                );
                const totalProfit = totalSale - totalCost;
                const totalMargin =
                  totalSale > 0 ? ((totalProfit / totalSale) * 100).toFixed(1) : "0.0";
                return (
                  <div className="mt-4 pt-4 border-t-2 border-zinc-300 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Total Cost:</span>
                      <span className="font-digit font-medium">
                        Rs. {totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Total Sale:</span>
                      <span className="font-digit font-medium">
                        Rs. {totalSale.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-base border-t border-zinc-200 pt-2">
                      <span className="font-semibold">Total Profit:</span>
                      <span
                        className={`font-bold font-digit ${
                          totalProfit >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        Rs. {totalProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Overall Margin:</span>
                      <span
                        className={`font-bold font-digit ${
                          parseFloat(totalMargin) >= 30
                            ? "text-success"
                            : parseFloat(totalMargin) >= 10
                            ? "text-amber-600"
                            : "text-danger"
                        }`}
                      >
                        {totalMargin}%
                      </span>
                    </div>
                  </div>
                );
              })()}

              {discountAmount > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                  <p className="text-amber-800">
                    <strong>Discount applied:</strong> Rs. {discountAmount.toLocaleString()}
                  </p>
                  <p className="text-amber-700 mt-1">
                    Profit after discount: Rs.{" "}
                    {(
                      cart.reduce(
                        (s, i) => s + Number(i.discountedPrice || i.unitPrice || 0) * i.qty,
                        0
                      ) -
                      discountAmount -
                      cart.reduce(
                        (s, i) => s + Number(i.product.purchase_price || 0) * i.qty,
                        0
                      )
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl flex justify-between items-center flex-wrap gap-2">
              <p className="text-xs text-zinc-500">
                Profit colors: <span className="text-success">≥30%</span> ·{" "}
                <span className="text-amber-600">10–29%</span> ·{" "}
                <span className="text-danger">&lt;10%</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const suggestedDiscount = prompt("Enter discount amount (Rs.):");
                    if (suggestedDiscount !== null) {
                      const val = Number(suggestedDiscount);
                      if (!isNaN(val) && val >= 0) {
                        setDiscount(val);
                        toast.success(`Discount set to Rs. ${val.toLocaleString()}`);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg cursor-pointer"
                >
                  Apply Discount
                </button>
                <button
                  onClick={() => setIsProfitPanelOpen(false)}
                  className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ HISTORY MODAL ============ */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Previous Invoices (
                {allInvoices.length})
              </h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-zinc-200">
              <input
                autoFocus
                type="text"
                placeholder="Search by customer, vehicle, or invoice #..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg font-digit"
              />
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left min-w-[640px]">
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
                      <td className="px-5 py-3 text-right font-bold font-digit">
                        Rs. {Number(inv.total).toLocaleString()}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-bold font-digit ${
                          Number(inv.pending) > 0 ? "text-danger" : "text-success"
                        }`}
                      >
                        Rs. {Number(inv.pending || 0).toLocaleString()}
                      </td>
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