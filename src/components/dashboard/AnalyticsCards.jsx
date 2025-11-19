import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

export default function AnalyticsCards({ data }) {
  const { 
    tendenciaProblemas, 
    ambientesProblematicos, 
    tempoMedioCorrecao,
    taxaReincidencia 
  } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Tendência de Problemas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                {tendenciaProblemas.direcao === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <Badge variant={tendenciaProblemas.direcao === 'up' ? 'destructive' : 'default'}>
                {tendenciaProblemas.percentual}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-sm text-gray-600">Tendência de Problemas</h3>
            <p className="text-2xl font-bold text-gray-900">{tendenciaProblemas.valor}</p>
            <p className="text-xs text-gray-500 mt-1">vs. período anterior</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ambientes Problemáticos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-orange-500 bg-opacity-10">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-sm text-gray-600">Ambiente + Problemático</h3>
            <p className="text-lg font-bold text-gray-900">{ambientesProblematicos.nome}</p>
            <p className="text-xs text-gray-500 mt-1">{ambientesProblematicos.percentual}% dos problemas</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tempo Médio de Correção */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500 bg-opacity-10">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-sm text-gray-600">Tempo Médio Correção</h3>
            <p className="text-2xl font-bold text-gray-900">{tempoMedioCorrecao} dias</p>
            <p className="text-xs text-gray-500 mt-1">média geral</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Taxa de Reincidência */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-500 bg-opacity-10">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <Badge variant="outline" className="text-red-600 border-red-200">
                {taxaReincidencia}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-sm text-gray-600">Taxa Reincidência</h3>
            <p className="text-2xl font-bold text-gray-900">{taxaReincidencia}%</p>
            <p className="text-xs text-gray-500 mt-1">problemas recorrentes</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}