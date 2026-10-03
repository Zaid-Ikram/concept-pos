"use client";

import { useState } from "react";
import { Save, Store, Users, Plus, Trash2, X, KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, employees, addEmployee, removeEmployee, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"store" | "employees">("employees");

  const [storeForm, setStoreForm] = useState({
    businessName: "Concept Autos",
    phone: "0306-2876599",
    whatsapp: "0339-4303099",
    address: "Site No 39,40 Old Nadra Office Road Zia Shaheed Chowk Haroonabad",
    website: "WWW.CONCEPTAUTOS.PK",
  });

  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", username: "", password: "" });

  const handleSaveStore = () => {
    localStorage.setItem("concept_autos_store", JSON.stringify(storeForm));
    toast.success("Store info saved!");
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name.trim() || !newEmp.username.trim() || !newEmp.password.trim()) {
      return toast.error("All fields required");
    }
    const success = addEmployee({
      name: newEmp.name.trim(),
      username: newEmp.username.trim().toLowerCase(),
      password: newEmp.password,
    });
    if (success) {
      toast.success("✅ Employee added!");
      setIsAddEmployeeOpen(false);
      setNewEmp({ name: "", username: "", password: "" });
    } else {
      toast.error("Username already exists");
    }
  };

  const handleRemoveEmployee = (username: string) => {
    if (!confirm(`Remove ${username}?`)) return;
    removeEmployee(username);
    toast.success("Employee removed");
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium rounded-lg cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Current user */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Signed in as</p>
          <p className="text-sm font-semibold text-zinc-900">
            {user?.name} <span className="text-xs text-zinc-500">({user?.username})</span>
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          user?.role === "admin" ? "bg-primary/10 text-primary" : "bg-zinc-100 text-zinc-700"
        }`}>
          {user?.role === "admin" ? "Admin" : "Employee"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          onClick={() => setActiveTab("employees")}
          className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "employees" ? "border-b-2 border-primary text-primary" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab("store")}
          className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "store" ? "border-b-2 border-primary text-primary" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Store Info
        </button>
      </div>

      {/* ============ EMPLOYEES TAB ============ */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Employee Accounts
              </h2>
              {user?.role === "admin" && (
                <button
                  onClick={() => setIsAddEmployeeOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Employee
                </button>
              )}
            </div>

            {/* Admin row (read-only) */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
              <div>
                <p className="text-sm font-medium text-zinc-900">Administrator</p>
                <p className="text-xs text-zinc-500 font-digit">
                  (from .env) · username: {process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin"}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Admin
              </span>
            </div>

            {/* Employees */}
            {employees.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No employees yet. Click <strong>Add Employee</strong> to create one.
              </div>
            ) : (
              employees.map(emp => (
                <div key={emp.username} className="flex items-center justify-between p-4 border-b border-zinc-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{emp.name}</p>
                    <p className="text-xs text-zinc-500 font-digit">@{emp.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                      Employee
                    </span>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleRemoveEmployee(emp.username)}
                        className="p-1.5 text-zinc-400 hover:text-danger hover:bg-danger/10 rounded cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <strong>Note:</strong> Employee passwords are stored in your browser's localStorage.
            For production security, migrate this to a proper backend with hashed passwords.
          </div>
        </div>
      )}

      {/* ============ STORE TAB ============ */}
      {activeTab === "store" && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-zinc-900">Store Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Business Name</label>
              <input
                type="text"
                value={storeForm.businessName}
                onChange={e => setStoreForm({ ...storeForm, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Phone</label>
              <input
                type="text"
                value={storeForm.phone}
                onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={storeForm.whatsapp}
                onChange={e => setStoreForm({ ...storeForm, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-digit"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Website</label>
              <input
                type="text"
                value={storeForm.website}
                onChange={e => setStoreForm({ ...storeForm, website: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Address</label>
            <input
              type="text"
              value={storeForm.address}
              onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <button
              onClick={handleSaveStore}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Info
            </button>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> Add Employee
              </h2>
              <button onClick={() => setIsAddEmployeeOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={newEmp.name}
                  onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                  placeholder="e.g. Ahmed Khan"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={newEmp.username}
                  onChange={e => setNewEmp({ ...newEmp, username: e.target.value })}
                  placeholder="e.g. ahmed"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
                <input
                  required
                  type="text"
                  value={newEmp.password}
                  onChange={e => setNewEmp({ ...newEmp, password: e.target.value })}
                  placeholder="e.g. ahmed123"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}