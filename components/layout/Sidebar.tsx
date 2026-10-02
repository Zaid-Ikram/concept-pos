"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart, Package, Users, Truck, AlertCircle, Trash2,
  MessageSquare, BarChart3, Settings, AlertTriangle, BookOpen,
  FileText
} from "lucide-react";
import Image from "next/image";

const navItems = [
  { name: "POS", href: "/pos", icon: ShoppingCart, shortcut: "Ctrl+P" },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Low Stock Alerts", href: "/low-stock", icon: AlertTriangle },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Ledger", href: "/ledger", icon: BookOpen },
  { name: "Pending Payments", href: "/pending-payments", icon: AlertCircle },
  { name: "Waste Oil", href: "/waste-oil", icon: Trash2 },
  { name: "Message Centre", href: "/customer-message-centre", icon: MessageSquare },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 border-r border-zinc-200 bg-white hidden md:flex flex-col h-screen shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 shrink-0 gap-3">
        <Image src="/logo.png" alt="Concept Autos" width={32} height={32} className="object-contain" />
        <h1 className="text-lg font-bold tracking-tight text-primary">Concept Autos</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3"><Icon className="w-4 h-4" />{item.name}</div>
              {item.shortcut && <span className="text-[10px] text-zinc-400 font-digit">{item.shortcut}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-200 shrink-0">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer">
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>
    </aside>
  );
}