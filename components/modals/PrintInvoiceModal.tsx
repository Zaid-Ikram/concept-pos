"use client";

import { X, Printer, Tag } from "lucide-react";

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

  const handlePrintInvoice = () => {
    window.print();
  };

  const handlePrintSticker = () => {
    localStorage.setItem("last_sticker", JSON.stringify({
      invoiceNo: invoice.invoiceNo,
      date: invoice.date,
      customerName: invoice.customerName,
      vehicle: invoice.vehicle,
      currentOdometer: invoice.currentOdometer,
      nextOilChange: invoice.nextOilChange,
    }));
    window.open("/sticker", "_blank");
  };

  return (
    <>
      {/* Screen view — modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200] print:hidden">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
          {/* Header bar */}
          <div className="bg-[#4cae4c] text-white px-4 py-2 flex items-center justify-between rounded-t-xl">
            <h2 className="text-sm font-semibold">Invoice Details</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt body — same design as the printed version */}
          <div className="flex-1 overflow-y-auto p-4" id="printable-receipt">
            <ReceiptContent invoice={invoice} />
          </div>

          {/* Bottom action buttons */}
          <div className="p-3 border-t border-zinc-200 flex justify-end gap-2">
            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2a7ab8] hover:bg-[#1f5d8f] text-white text-xs font-semibold rounded cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Invoice
            </button>
            <button
              onClick={handlePrintSticker}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#4cae4c] hover:bg-[#3d8b3d] text-white text-xs font-semibold rounded cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" /> Print Sticker
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </div>
      </div>

      {/* Print-only view — only this shows when printing */}
      <div className="hidden print:block">
        <ReceiptContent invoice={invoice} />
      </div>
    </>
  );
}

/** The actual receipt layout — reused for both screen and print */
function ReceiptContent({ invoice }: { invoice: any }) {
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.paid || 0);
  const pending = Number(invoice.pending || 0);
  const serviceCharges = Number(invoice.serviceCharges || 0);

  return (
    <div style={{ width: "300px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: 0, fontFamily: "Georgia, serif" }}>
          Concept Autos
        </h1>
        <p style={{ fontSize: "10px", margin: "2px 0 0 0" }}>An Authentic Lubricant in Town</p>
      </div>

      <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "3px 0", textAlign: "center", fontSize: "10px", marginBottom: "6px" }}>
        <div>Main Boulevard Gulberg III, Lahore</div>
        <div>0317.80.81.82.1</div>
        <div style={{ fontWeight: "bold" }}>WWW.CONCEPTAUTOS.PK</div>
      </div>

      {/* Invoice + Date */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11px", marginBottom: "6px" }}>
        <tbody>
          <tr>
            <td style={{ borderRight: "1px solid #000", padding: "3px 4px", width: "50%" }}>
              <div style={{ fontSize: "9px", color: "#444" }}>INVOICE</div>
              <div style={{ fontWeight: "bold" }}>{invoice.invoiceNo}</div>
            </td>
            <td style={{ padding: "3px 4px", width: "50%", textAlign: "right" }}>
              <div style={{ fontSize: "9px", color: "#444" }}>DATE</div>
              <div style={{ fontWeight: "bold" }}>{invoice.date}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Customer + Payment */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "11px", marginBottom: "6px" }}>
        <div>
          <div style={{ fontWeight: "bold" }}>{invoice.customerName || "Walk-in Customer"}</div>
          {invoice.customerPhone && <div style={{ fontSize: "10px" }}>{invoice.customerPhone}</div>}
          {invoice.dockStation && <div style={{ fontSize: "10px" }}>Dock Station: {invoice.dockStation}</div>}
        </div>
        <div style={{ border: "1px solid #000", padding: "2px 6px", fontSize: "10px", fontWeight: "bold" }}>
          {invoice.paymentType?.toUpperCase()}
        </div>
      </div>

      {/* Vehicle */}
      {invoice.vehicle && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", textAlign: "center", fontSize: "9px", padding: "2px", borderBottom: "1px solid #000", fontWeight: "bold" }}>VEHICLE NUMBER</td>
              <td style={{ width: "50%", textAlign: "center", fontSize: "9px", padding: "2px", borderBottom: "1px solid #000", fontWeight: "bold" }}>VEHICLE MODEL</td>
            </tr>
            <tr>
              <td style={{ textAlign: "center", padding: "2px", border: "1px solid #000", fontSize: "11px", fontWeight: "bold" }}>{invoice.vehicle}</td>
              <td style={{ textAlign: "center", padding: "2px", border: "1px solid #000", fontSize: "11px" }}>{invoice.vehicleModel || "-"}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Oil change */}
      {(invoice.currentOdometer || invoice.nextOilChange) && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", textAlign: "center", fontSize: "9px", padding: "2px", borderBottom: "1px solid #000", fontWeight: "bold" }}>THIS OIL CHANGE</td>
              <td style={{ width: "50%", textAlign: "center", fontSize: "9px", padding: "2px", borderBottom: "1px solid #000", fontWeight: "bold" }}>NEXT OIL CHANGE</td>
            </tr>
            <tr>
              <td style={{ textAlign: "center", padding: "2px", border: "1px solid #000", fontSize: "11px", fontWeight: "bold" }}>{invoice.currentOdometer || "-"}</td>
              <td style={{ textAlign: "center", padding: "2px", border: "1px solid #000", fontSize: "11px", fontWeight: "bold" }}>{invoice.nextOilChange || "-"}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Items */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "4px" }}>
        <thead>
          <tr style={{ borderTop: "2px solid #000", borderBottom: "1px solid #000" }}>
            <th style={{ textAlign: "left", padding: "3px 2px", fontWeight: "bold" }}>Items</th>
            <th style={{ textAlign: "center", padding: "3px 2px", fontWeight: "bold", width: "30px" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "3px 2px", fontWeight: "bold", width: "50px" }}>Price</th>
            <th style={{ textAlign: "right", padding: "3px 2px", fontWeight: "bold", width: "50px" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, i: number) => (
            <tr key={i}>
              <td style={{ padding: "2px", verticalAlign: "top" }}>{item.name}</td>
              <td style={{ padding: "2px", textAlign: "center" }}>{item.qty}</td>
              <td style={{ padding: "2px", textAlign: "right" }}>{Number(item.discountedPrice || item.price).toLocaleString()}</td>
              <td style={{ padding: "2px", textAlign: "right" }}>{(Number(item.discountedPrice || item.price) * item.qty).toLocaleString()}</td>
            </tr>
          ))}
          {serviceCharges > 0 && (
            <tr>
              <td style={{ padding: "2px" }}>Service Charges</td>
              <td style={{ padding: "2px", textAlign: "center" }}>1</td>
              <td style={{ padding: "2px", textAlign: "right" }}>{serviceCharges.toLocaleString()}</td>
              <td style={{ padding: "2px", textAlign: "right" }}>{serviceCharges.toLocaleString()}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginTop: "4px" }}>
        <tbody>
          <tr>
            <td style={{ textAlign: "right", padding: "2px 4px", fontWeight: "bold" }}>Total Bill:</td>
            <td style={{ textAlign: "right", padding: "2px 4px", width: "90px", fontWeight: "bold", borderBottom: "1px solid #000" }}>{subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ textAlign: "right", padding: "2px 4px", fontWeight: "bold" }}>Net Payable:</td>
            <td style={{ textAlign: "right", padding: "2px 4px", fontWeight: "bold", borderBottom: "2px solid #000" }}>{total.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ textAlign: "right", padding: "2px 4px" }}>Payment Received:</td>
            <td style={{ textAlign: "right", padding: "2px 4px", borderBottom: "1px solid #000" }}>{paid.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ textAlign: "right", padding: "2px 4px", fontWeight: "bold" }}>REMAINING BALANCE:</td>
            <td style={{ textAlign: "right", padding: "2px 4px", fontWeight: "bold", borderBottom: "2px solid #000" }}>{pending.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: "8px", fontSize: "9px", lineHeight: "1.4" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "4px" }}>
          <span>😊</span>
          <span>Keep headlights clean for night driving.</span>
        </div>
        <div style={{ border: "2px solid #000", padding: "4px", textAlign: "center", fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>
          Thank you for visiting us!
        </div>
        <div style={{ fontSize: "8px", color: "#444", lineHeight: "1.3" }}>
          Only check warranty of oil filter. In case of oil filter leakage, only oil filter will be replaced and no responsibility of any loss.
        </div>
        <div style={{ textAlign: "center", fontSize: "8px", color: "#444", marginTop: "6px" }}>
          Software by www.conceptautos.pk - 0317.80.81.82.1
        </div>
      </div>
    </div>
  );
}