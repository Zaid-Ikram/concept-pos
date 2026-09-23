import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-500">{title}</h3>
        <div className="p-2 bg-zinc-100 rounded-lg">
          <Icon className="w-5 h-5 text-zinc-600" />
        </div>
      </div>
      <div className="space-y-1">
        {/* font-digit applied to value */}
        <p className="text-3xl font-semibold tracking-tight font-digit text-zinc-800">{value}</p>
        {/* font-digit applied to trend */}
        <p className={`text-xs font-medium font-digit ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend}
        </p>
      </div>
    </div>
  );
}