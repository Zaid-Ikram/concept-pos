"use client";

import { X, Printer, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function PrintInvoiceModal({ isOpen, onClose, invoice }: PrintInvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.paid || 0);
  const pending = Number(invoice.pending || 0);
  const serviceCharges = Number(invoice.serviceCharges || 0);
  const discount = Number(invoice.discount || 0);
  const previousPending = Number(invoice.previousPending || 0);
  const currentOdometer = invoice.currentOdometer || "";
  const nextOilChange = invoice.nextOilChange || "";

  const STORE_ADDRESS = "Site No 39,40 Old Nadra Office Road Zia Shaheed Chowk Haroonabad";
  const STORE_PHONE = "0306-2876599";
  const STORE_WA = "0339-4303099";

  const buildPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: [80, 220] });
    const pw = doc.internal.pageSize.getWidth();
    let y = 8;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Concept Autos", pw / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("An Authentic Lubricant in Town", pw / 2, y, { align: "center" });
    y += 4;
    doc.text("Site No 39,40 Old Nadra Office Road", pw / 2, y, { align: "center" });
    y += 3.5;
    doc.text("Zia Shaheed Chowk, Haroonabad", pw / 2, y, { align: "center" });
    y += 3.5;
    doc.text(`Ph: ${STORE_PHONE} | WA: ${STORE_WA}`, pw / 2, y, { align: "center" });
    y += 3.5;
    doc.setFont("helvetica", "bold");
    doc.text("WWW.CONCEPTAUTOS.PK", pw / 2, y, { align: "center" });
    y += 4;
    doc.setLineWidth(0.3);
    doc.line(4, y, pw - 4, y);
    y += 4;

    // Invoice + date
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.rect(4, y - 1, pw - 8, 10);
    doc.text("INVOICE", 6, y + 2);
    doc.text("DATE", pw - 6, y + 2, { align: "right" });
    doc.setFontSize(9);
    doc.text(String(invoice.invoiceNo), 6, y + 6.5);
    doc.text(String(invoice.date), pw - 6, y + 6.5, { align: "right" });
    y += 13;

    // Customer
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(invoice.customerName || "Walk-in Customer"), 4, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (invoice.customerPhone) { doc.text(String(invoice.customerPhone), 4, y); y += 3.5; }
    if (invoice.dockStation) { doc.text(`Dock: ${invoice.dockStation}`, 4, y); y += 3.5; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.rect(pw - 26, y - 8, 22, 5);
    doc.text(String(invoice.paymentType || "CASH").toUpperCase(), pw - 15, y - 4.5, { align: "center" });
    y += 2;

    // Vehicle box
    if (invoice.vehicle) {
      doc.setLineWidth(0.2);
      doc.rect(4, y, pw - 8, 12);
      doc.line(pw / 2, y, pw / 2, y + 12);
      doc.setFontSize(7);
      doc.text("VEHICLE NUMBER", 4 + (pw - 8) / 4, y + 3, { align: "center" });
      doc.text("VEHICLE MODEL", pw / 2 + (pw - 8) / 4, y + 3, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(String(invoice.vehicle), 4 + (pw - 8) / 4, y + 9, { align: "center" });
      doc.text(String(invoice.vehicleModel || "-"), pw / 2 + (pw - 8) / 4, y + 9, { align: "center" });
      y += 14;
    }

    // Oil change
    if (currentOdometer || nextOilChange) {
      doc.setLineWidth(0.2);
      doc.rect(4, y, pw - 8, 12);
      doc.line(pw / 2, y, pw / 2, y + 12);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("CURRENT READING", 4 + (pw - 8) / 4, y + 3, { align: "center" });
      doc.text("NEXT OIL CHANGE", pw / 2 + (pw - 8) / 4, y + 3, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(String(currentOdometer || "-"), 4 + (pw - 8) / 4, y + 9, { align: "center" });
      doc.text(String(nextOilChange || "-"), pw / 2 + (pw - 8) / 4, y + 9, { align: "center" });
      y += 14;
    }

    // Items
    doc.setLineWidth(0.4);
    doc.line(4, y, pw - 4, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Items", 4, y);
    doc.text("Qty", pw - 30, y, { align: "center" });
    doc.text("Price", pw - 20, y, { align: "right" });
    doc.text("Total", pw - 4, y, { align: "right" });
    y += 3;
    doc.setLineWidth(0.2);
    doc.line(4, y, pw - 4, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    items.forEach((item: any) => {
      const name = String(item.name || "").slice(0, 32);
      doc.text(name, 4, y);
      doc.text(String(item.qty), pw - 30, y, { align: "center" });
      doc.text(String(Number(item.discountedPrice || item.price).toLocaleString()), pw - 20, y, { align: "right" });
      doc.text(String((Number(item.discountedPrice || item.price) * item.qty).toLocaleString()), pw - 4, y, { align: "right" });
      y += 4;
    });

    if (serviceCharges > 0) {
      doc.text("Service Charges", 4, y);
      doc.text("1", pw - 30, y, { align: "center" });
      doc.text(String(serviceCharges.toLocaleString()), pw - 20, y, { align: "right" });
      doc.text(String(serviceCharges.toLocaleString()), pw - 4, y, { align: "right" });
      y += 4;
    }

    y += 2;
    doc.setLineWidth(0.3);
    doc.line(4, y, pw - 4, y);
    y += 5;

    const labelX = pw - 34;
    const valueX = pw - 4;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Total Bill:", labelX, y);
    doc.text(String(subtotal.toLocaleString()), valueX, y, { align: "right" });
    y += 4;

    if (discount > 0) {
      doc.text("Discount:", labelX, y);
      doc.text(`-${discount.toLocaleString()}`, valueX, y, { align: "right" });
      y += 4;
    }

    if (previousPending > 0) {
      doc.text("Prev Pending:", labelX, y);
      doc.text(`+${previousPending.toLocaleString()}`, valueX, y, { align: "right" });
      y += 4;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Net Payable:", labelX, y);
    doc.text(String(total.toLocaleString()), valueX, y, { align: "right" });
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Payment Received:", labelX, y);
    doc.text(String(paid.toLocaleString()), valueX, y, { align: "right" });
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("REMAINING BALANCE:", labelX, y);
    doc.text(String(pending.toLocaleString()), valueX, y, { align: "right" });
    y += 6;

    // Footer
    doc.setLineWidth(0.2);
    doc.line(4, y, pw - 4, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Keep headlights clean for night driving.", pw / 2, y, { align: "center" });
    y += 4;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.rect(4, y - 3, pw - 8, 6);
    doc.text("Thank you for visiting us!", pw / 2, y + 1, { align: "center" });
    y += 8;
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("Only check warranty of oil filter. In case of leakage, only oil filter", pw / 2, y, { align: "center" });
    y += 2.5;
    doc.text("will be replaced and no responsibility of any loss.", pw / 2, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text("Software by Zaid Ikram — 0339-2592006", pw / 2, y, { align: "center" });
    doc.setTextColor(0);

    return doc;
  };

  const handlePrint = () => { window.print(); };

  const handleDownload = () => {
    const doc = buildPDF();
    doc.save(`Invoice-${invoice.invoiceNo}.pdf`);
    toast.success("PDF downloaded!");
  };

  const handleShareWhatsApp = async () => {
    const stored = localStorage.getItem("concept_autos_settings");
    const settings = stored ? JSON.parse(stored) : {};

    const fallback = `🚗 *Concept Autos*\n\nAssalam-o-Alaikum *{name}*,\n\nYour invoice is attached.\n\nInvoice: *{invoice_no}*\nVehicle: {vehicle}\nCurrent Reading: {current_odo}\nNext Oil Change: {next_odo}\nTotal: *Rs. {amount}*\n\nThank you for choosing *Concept Autos*! 🔧`;

    const template = settings.purchaseTemplate || fallback;
    let message = template;
    const data: Record<string, string> = {
      name: invoice.customerName || "Customer",
      vehicle: invoice.vehicle || "-",
      invoice_no: invoice.invoiceNo,
      current_odo: currentOdometer || "-",
      next_odo: nextOilChange || "-",
      amount: Number(invoice.total).toLocaleString(),
      date: invoice.date,
      phone: STORE_WA,
    };
    Object.entries(data).forEach(([k, v]) => {
      message = message.replace(new RegExp(`{${k}}`, "g"), v || "-");
    });

    const rawPhone = (invoice.customerPhone || "").replace(/\D/g, "");
    let fullPhone = rawPhone;
    if (fullPhone.startsWith("0")) fullPhone = "92" + fullPhone.slice(1);
    if (!fullPhone.startsWith("92")) fullPhone = "92" + fullPhone;

    const doc = buildPDF();
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], `Invoice-${invoice.invoiceNo}.pdf`, { type: "application/pdf" });

    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({ files: [pdfFile], title: `Invoice ${invoice.invoiceNo}`, text: message });
        toast.success("Shared via WhatsApp!");
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    doc.save(`Invoice-${invoice.invoiceNo}.pdf`);
    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`, "_blank");
    }, 700);
    toast.success("PDF downloaded. WhatsApp opening.");
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-invoice, #printable-invoice * { visibility: visible !important; }
          #printable-invoice {
            position: absolute !important;
            left: 0; top: 0;
            width: 100%;
            padding: 0; margin: 0;
          }
          @page { size: 80mm auto; margin: 3mm; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[200] print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 bg-zinc-50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-zinc-900">Invoice Preview</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-zinc-50">
            <div id="printable-invoice" className="bg-white rounded-xl shadow-sm p-5 mx-auto" style={{ maxWidth: 360 }}>
              <div className="text-center pb-3 border-b border-zinc-200">
                <h1 className="text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>Concept Autos</h1>
                <p className="text-[10px] text-zinc-500 mt-0.5">An Authentic Lubricant in Town</p>
              </div>

              <div className="text-center text-[10px] text-zinc-600 py-2 border-b border-zinc-200">
                <div>Site No 39,40 Old Nadra Office Road</div>
                <div>Zia Shaheed Chowk, Haroonabad</div>
                <div className="font-digit">Ph: {STORE_PHONE} | WA: {STORE_WA}</div>
                <div className="font-semibold text-zinc-800">WWW.CONCEPTAUTOS.PK</div>
              </div>

              <div className="grid grid-cols-2 border border-zinc-300 my-3 text-[11px]">
                <div className="p-2 border-r border-zinc-300">
                  <p className="text-[9px] text-zinc-500">INVOICE</p>
                  <p className="font-bold font-digit">{invoice.invoiceNo}</p>
                </div>
                <div className="p-2 text-right">
                  <p className="text-[9px] text-zinc-500">DATE</p>
                  <p className="font-bold font-digit">{invoice.date}</p>
                </div>
              </div>

              <div className="flex justify-between items-start mb-3 text-[11px]">
                <div>
                  <p className="font-bold text-zinc-900">{invoice.customerName || "Walk-in Customer"}</p>
                  {invoice.customerPhone && <p className="text-zinc-600 font-digit">{invoice.customerPhone}</p>}
                  {invoice.dockStation && <p className="text-zinc-500">Dock: <span className="font-digit">{invoice.dockStation}</span></p>}
                </div>
                <span className="border border-zinc-800 px-2 py-0.5 text-[10px] font-bold">
                  {String(invoice.paymentType || "CASH").toUpperCase()}
                </span>
              </div>

              {(invoice.vehicle || currentOdometer) && (
                <div className="space-y-2 mb-3">
                  {invoice.vehicle && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-zinc-500 text-center mb-0.5">VEHICLE NUMBER</p>
                        <div className="border border-zinc-400 py-1 text-center font-digit font-bold text-[11px]">
                          {invoice.vehicle}
                        </div>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-center mb-0.5">VEHICLE MODEL</p>
                        <div className="border border-zinc-400 py-1 text-center text-[11px]">
                          {invoice.vehicleModel || "-"}
                        </div>
                      </div>
                    </div>
                  )}
                  {(currentOdometer || nextOilChange) && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-zinc-500 text-center mb-0.5">CURRENT READING</p>
                        <div className="border border-zinc-400 py-1 text-center font-digit font-bold text-[11px]">
                          {currentOdometer || "-"}
                        </div>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-center mb-0.5">NEXT OIL CHANGE</p>
                        <div className="border border-zinc-400 py-1 text-center font-digit font-bold text-[11px]">
                          {nextOilChange || "-"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <table className="w-full text-[10px] mb-2">
                <thead>
                  <tr className="border-y-2 border-zinc-800">
                    <th className="text-left py-1 font-bold">Items</th>
                    <th className="text-center py-1 font-bold w-8">Qty</th>
                    <th className="text-right py-1 font-bold w-12">Price</th>
                    <th className="text-right py-1 font-bold w-14">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="py-1 align-top">{item.name}</td>
                      <td className="py-1 text-center font-digit">{item.qty}</td>
                      <td className="py-1 text-right font-digit">{Number(item.discountedPrice || item.price).toLocaleString()}</td>
                      <td className="py-1 text-right font-digit">{(Number(item.discountedPrice || item.price) * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                  {serviceCharges > 0 && (
                    <tr className="border-b border-zinc-100">
                      <td className="py-1">Service Charges</td>
                      <td className="py-1 text-center font-digit">1</td>
                      <td className="py-1 text-right font-digit">{serviceCharges.toLocaleString()}</td>
                      <td className="py-1 text-right font-digit">{serviceCharges.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="space-y-1 text-[10px] pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total Bill:</span>
                  <span className="font-digit">{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-digit">-{discount.toLocaleString()}</span>
                  </div>
                )}
                {previousPending > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Prev Pending:</span>
                    <span className="font-digit">+{previousPending.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-b border-zinc-800 pb-1">
                  <span>Net Payable:</span>
                  <span className="font-digit">{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Received:</span>
                  <span className="font-digit">{paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-y border-zinc-800 py-1">
                  <span>REMAINING BALANCE:</span>
                  <span className="font-digit">{pending.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-200 text-[9px] text-zinc-600 space-y-1">
                <p>😊 Keep headlights clean for night driving.</p>
                <div className="border-2 border-zinc-800 py-1.5 text-center text-[13px] font-bold text-zinc-900">
                  Thank you for visiting us!
                </div>
                <p className="text-[8px] leading-tight">Only check warranty of oil filter. In case of oil filter leakage, only oil filter will be replaced and no responsibility of any loss.</p>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 text-center">
                <p className="text-[9px] text-zinc-400 italic">
                  Software by <span className="font-semibold text-zinc-500">Zaid Ikram</span> — 0339-2592006
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-zinc-200 bg-white rounded-b-2xl flex flex-wrap gap-2 justify-end">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-[#2a7ab8] hover:bg-[#1f5d8f] text-white text-xs font-semibold rounded-lg cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg cursor-pointer">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={handleShareWhatsApp} className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-semibold rounded-lg cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg cursor-pointer">
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}