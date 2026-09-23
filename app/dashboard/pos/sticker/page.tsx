"use client";

import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StickerPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("last_sticker");
    if (stored) {
      try { setData(JSON.parse(stored)); } catch {}
    }
    setTimeout(() => window.print(), 500);
  }, []);

  if (!data) return <div className="p-10 text-center text-zinc-500">No sticker data.</div>;

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-xs flex flex-col gap-3 print:hidden absolute top-4 right-4">
        <button onClick={() => window.print()} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer">
          <Printer className="w-4 h-4" /> Print Sticker
        </button>
        <button onClick={() => router.push("/dashboard/pos")} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg cursor-pointer">
          <X className="w-4 h-4" /> Close
        </button>
      </div>

      {/* Sticker */}
      <div className="bg-white border-4 border-black p-4 w-72 print:border-2">
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h1 className="text-lg font-bold">Concept Autos</h1>
          <p className="text-[10px]">Oil Change Reminder</p>
        </div>
        <div className="space-y-2 text-sm font-bold">
          <div className="flex justify-between">
            <span>Vehicle:</span>
            <span className="font-digit">{data.vehicle || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>Current:</span>
            <span className="font-digit">{data.currentOdometer || "-"} km</span>
          </div>
          <div className="flex justify-between border-t-2 border-black pt-2">
            <span>Next Due:</span>
            <span className="font-digit">{data.nextOilChange || "-"} km</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t-2 border-black text-center text-[10px]">
          <p className="font-digit">0317.80.81.82.1</p>
        </div>
      </div>
    </div>
  );
}