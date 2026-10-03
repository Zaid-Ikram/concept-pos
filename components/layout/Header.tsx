"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, Bell, UserCircle, LogOut, Settings, KeyRound,
  AlertCircle, Package, Droplets, X, ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ============ BUILD NOTIFICATIONS FROM LOCAL DATA ============
  useEffect(() => {
    const buildNotifications = () => {
      const list: any[] = [];
      const now = Date.now();

      // 1. Pending payments (from customers)
      try {
        const customers: any[] = JSON.parse(
          localStorage.getItem("concept_autos_customers") || "[]"
        );
        customers
          .filter(c => Number(c.total_pending || 0) > 0)
          .slice(0, 5)
          .forEach(c => {
            list.push({
              id: `cust-${c.id}`,
              type: "payment",
              title: `${c.name} — Rs. ${Number(c.total_pending).toLocaleString()} pending`,
              description: c.phone || "",
              time: "Outstanding",
              ts: now,
            });
          });
      } catch {}

      // 2. Low stock products
      try {
        const products: any[] = JSON.parse(
          localStorage.getItem("concept_autos_products") || "[]"
        );
        products
          .filter(p => Number(p.stock_qty || 0) <= Number(p.min_stock_level || 5))
          .slice(0, 5)
          .forEach(p => {
            list.push({
              id: `prod-${p.id}`,
              type: "stock",
              title: `${p.name} — Low stock (${p.stock_qty || 0} left)`,
              description: `Min: ${p.min_stock_level || 5}`,
              time: "Restock needed",
              ts: now,
            });
          });
      } catch {}

      // 3. Upcoming oil changes (from invoices)
      try {
        const invoices: any[] = JSON.parse(
          localStorage.getItem("concept_autos_invoices") || "[]"
        );
        // Only most recent invoice per customer with nextOilChange
        const seen = new Set();
        invoices
          .filter((inv: any) => inv.nextOilChange && inv.customerName)
          .slice(0, 5)
          .forEach((inv: any) => {
            if (seen.has(inv.customerName)) return;
            seen.add(inv.customerName);
            list.push({
              id: `inv-${inv.invoiceNo}`,
              type: "oil",
              title: `${inv.customerName} — Next oil change`,
              description: `Due at ${Number(inv.nextOilChange).toLocaleString()} km`,
              time: inv.date || "",
              ts: now,
            });
          });
      } catch {}

      setNotifications(list);
    };

    buildNotifications();

    // Refresh notifications every 60s
    const interval = setInterval(buildNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // ============ CLICK OUTSIDE ============
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    router.replace("/");
  };

  const unreadCount = notifications.length;
  const displayCount = unreadCount > 9 ? "9+" : unreadCount;

  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile menu */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

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

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* ============ NOTIFICATIONS ============ */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors relative cursor-pointer rounded-lg hover:bg-zinc-100"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {displayCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg z-[80] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer"
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          n.type === "payment"
                            ? "bg-red-100 text-red-600"
                            : n.type === "stock"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {n.type === "payment" ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : n.type === "stock" ? (
                          <Package className="w-4 h-4" />
                        ) : (
                          <Droplets className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 leading-snug">
                          {n.title}
                        </p>
                        {n.description && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {n.description}
                          </p>
                        )}
                        {n.time && (
                          <p className="text-[10px] text-zinc-400 mt-1 font-digit">
                            {n.time}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============ PROFILE MENU ============ */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <UserCircle className="w-8 h-8 text-zinc-400" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-zinc-900 leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-zinc-500 font-digit leading-tight">
                {user?.role === "admin" ? "Administrator" : "Employee"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-lg z-[80] overflow-hidden">
              {/* User info */}
              <div className="p-4 border-b border-zinc-200 bg-zinc-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-zinc-500 font-digit truncate">
                      @{user?.username || "-"}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    user?.role === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {user?.role === "admin" ? "Administrator" : "Employee"}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push("/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  Settings
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Trigger manual lock
                    window.dispatchEvent(new CustomEvent("lock-session"));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-zinc-400" />
                  Lock Now
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-zinc-200 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}