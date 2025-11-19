import { Button } from "@/components/ui/button";
import { Check, X, Minus, Edit2 } from 'lucide-react';
import { motion } from "framer-motion";

export default function ChecklistItem({ item, sectionIndex, itemIndex, onStatusChange, onEditDetails }) {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'conforme':
        return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Conforme' };
      case 'nao_conforme':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Não Conforme' };
      case 'nao_aplica':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'N/A' };
      default:
        return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Pendente' };
    }
  };

  const statusInfo = getStatusInfo(item.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        {/* Item Description */}
        <div className="flex-1">
          <p className="font-medium text-gray-800">{item.texto}</p>
          {item.status === 'nao_conforme' && item.detalhes && (
            <div className="mt-2 text-sm text-red-700 bg-red-50 p-3 rounded-md">
              <p><strong>Obs:</strong> {item.detalhes.observacao}</p>
              {item.detalhes.foto_url && (
                 <a href={item.detalhes.foto_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 block">
                   Ver evidência
                 </a>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => onStatusChange(sectionIndex, itemIndex, 'conforme')}
            variant={item.status === 'conforme' ? 'default' : 'outline'}
            className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white data-[state=checked]:bg-emerald-600"
            size="lg"
          >
            <Check className="w-5 h-5" />
          </Button>

          <Button
            onClick={() => onStatusChange(sectionIndex, itemIndex, 'nao_conforme')}
            variant={item.status === 'nao_conforme' ? 'destructive' : 'outline'}
            className="flex-1 h-12"
            size="lg"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={() => onStatusChange(sectionIndex, itemIndex, 'nao_aplica')}
            variant={item.status === 'nao_aplica' ? 'secondary' : 'outline'}
            className="flex-1 h-12"
            size="lg"
          >
            <Minus className="w-5 h-5" />
          </Button>

          {item.status === 'nao_conforme' && (
            <Button onClick={() => onEditDetails(sectionIndex, itemIndex)} variant="ghost" size="icon">
              <Edit2 className="w-4 h-4 text-gray-600" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}