"use client";

import { useState } from "react";
import { Search, Bell, UserCircle, AlertCircle, Package, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, type: "payment", title: "Ahmed — Rs. 2,000 pending", time: "2 hours ago" },
    { id: 2, type: "stock", title: "SHELL R4 PLUS — Low stock (4 units)", time: "5 hours ago" },
    { id: 3, type: "payment", title: "Khizar — Rs. 4,000 pending", time: "1 day ago" },
    { id: 4, type: "oil", title: "Vehicle ABC-123 due for oil change", time: "2 days ago" },
  ];

  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            id="global-search"
            type="text"
            placeholder="Search products, orders, or customers..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-zinc-900 placeholder-zinc-500 font-digit"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors relative cursor-pointer rounded-lg hover:bg-zinc-100"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer">
                    <div className={`p-2 rounded-lg ${n.type === 'payment' ? 'bg-danger/10 text-danger' : n.type === 'stock' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                      {n.type === 'payment' ? <AlertCircle className="w-4 h-4" /> : n.type === 'stock' ? <Package className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-900 font-medium">{n.title}</p>
                      <p className="text-xs text-zinc-500 font-digit mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <UserCircle className="w-8 h-8 text-zinc-400" />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-zinc-900">{user?.name || "Admin User"}</p>
            <p className="text-xs text-zinc-500 font-digit">{user?.email || "admin@conceptpos.com"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}