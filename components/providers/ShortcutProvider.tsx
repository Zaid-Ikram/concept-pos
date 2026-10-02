"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search");
        if (searchInput) searchInput.focus();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p" && !isInput) {
        e.preventDefault();
        router.push("/pos");
        toast.success("Navigated to POS");
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("open-check-price"));
      }

      // NEW: Ctrl+H → Previous Invoices
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("open-invoice-history"));
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [router]);

  return <>{children}</>;
}