"use client";

import { useState, useEffect } from "react";
import { Search, Building2, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fleet: Allow multiple vehicles at once
  const [fleetName, setFleetName] = useState("Walk-in");
  const [vehicleRows, setVehicleRows] = useState([
    { reg_no: "", make: "", model: "", year: "" }
  ]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles.php`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setVehicles(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const addVehicleRow = () => {
    setVehicleRows([...vehicleRows, { reg_no: "", make: "", model: "", year: "" }]);
  };

  const updateVehicleRow = (index: number, field: string, value: string) => {
    const updated = [...vehicleRows];
    updated[index] = { ...updated[index], [field]: value };
    setVehicleRows(updated);
  };

  const removeVehicleRow = (index: number) => {
    if (vehicleRows.length === 1) return toast.error("At least one vehicle required");
    setVehicleRows(vehicleRows.filter((_, i) => i !== index));
  };

  const handleAddVehicles = (e: React.FormEvent) => {
    e.preventDefault();
    const newVehicles = vehicleRows
      .filter(v => v.reg_no.trim() !== "")
      .map((v, i) => ({ ...v, group_name: fleetName, id: Date.now() + i }));
    
    if (newVehicles.length === 0) return toast.error("Please add at least one vehicle with Reg No");
    
    setVehicles([...newVehicles, ...vehicles]);
    setIsModalOpen(false);
    setVehicleRows([{ reg_no: "", make: "", model: "", year: "" }]);
    setFleetName("Walk-in");
    toast.success(`${newVehicles.length} vehicle(s) added to ${fleetName}!`);
  };

  const filtered = vehicles.filter(v => 
    v.reg_no?.toLowerCase().includes(search.toLowerCase()) || 
    v.group_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group vehicles by fleet
  const groupedVehicles = filtered.reduce((groups: any, v: any) => {
    const key = v.group_name || "Walk-in";
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Vehicles & Fleet Groups</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
          <Plus className="w-4 h-4" /> Add Vehicles / Fleet
        </button>
      </div>
      
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Search by reg no or group..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-digit" />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-10 text-center text-zinc-500">Loading vehicles...</div>
        ) : Object.keys(groupedVehicles).length === 0 ? (
          <div className="p-10 text-center text-zinc-500">No vehicles found.</div>
        ) : (
          Object.entries(groupedVehicles).map(([fleet, fleetVehicles]: any) => (
            <div key={fleet} className="border-b border-zinc-200 last:border-0">
              <div className="px-6 py-3 bg-zinc-50 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-zinc-900">{fleet}</span>
                <span className="text-xs text-zinc-500 font-digit ml-2">({fleetVehicles.length} vehicles)</span>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="px-6 py-2 font-medium">Reg No</th>
                    <th className="px-6 py-2 font-medium">Make</th>
                    <th className="px-6 py-2 font-medium">Model</th>
                    <th className="px-6 py-2 font-medium">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {fleetVehicles.map((v: any) => (
                    <tr key={v.id} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                      <td className="px-6 py-3 font-medium text-zinc-900 font-digit">{v.reg_no}</td>
                      <td className="px-6 py-3 text-zinc-600">{v.make}</td>
                      <td className="px-6 py-3 text-zinc-600">{v.model}</td>
                      <td className="px-6 py-3 text-zinc-600 font-digit">{v.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Add Vehicles / Fleet</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddVehicles} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Fleet / Company Name</label>
                <input 
                  type="text" 
                  value={fleetName} 
                  onChange={e => setFleetName(e.target.value)} 
                  placeholder="e.g. ABC Logistics or Walk-in" 
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                />
                <p className="text-xs text-zinc-500 mt-1">All vehicles below will be grouped under this fleet.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">Vehicles ({vehicleRows.length})</label>
                {vehicleRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end bg-zinc-50 p-3 rounded-lg">
                    <div className="col-span-3">
                      <label className="block text-xs text-zinc-500 mb-1">Reg No</label>
                      <input required type="text" value={row.reg_no} onChange={e => updateVehicleRow(i, "reg_no", e.target.value)} placeholder="ABC-123" className="w-full px-2 py-1.5 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-zinc-500 mb-1">Make</label>
                      <input type="text" value={row.make} onChange={e => updateVehicleRow(i, "make", e.target.value)} placeholder="Toyota" className="w-full px-2 py-1.5 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-zinc-500 mb-1">Model</label>
                      <input type="text" value={row.model} onChange={e => updateVehicleRow(i, "model", e.target.value)} placeholder="Corolla" className="w-full px-2 py-1.5 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-500 mb-1">Year</label>
                      <input type="text" value={row.year} onChange={e => updateVehicleRow(i, "year", e.target.value)} placeholder="2020" className="w-full px-2 py-1.5 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-primary focus:outline-none font-digit" />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeVehicleRow(i)} className="p-1.5 text-danger hover:bg-danger/10 rounded cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={addVehicleRow} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Another Vehicle
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg cursor-pointer">
                  Save {vehicleRows.length} Vehicle(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}