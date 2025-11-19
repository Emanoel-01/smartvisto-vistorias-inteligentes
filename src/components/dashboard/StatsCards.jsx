import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCards({ icon: Icon, title, value, subtitle, colorClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <div className={`absolute top-0 right-0 w-20 h-20 ${colorClass} opacity-10 rounded-full transform translate-x-6 -translate-y-6`}></div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
              <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}