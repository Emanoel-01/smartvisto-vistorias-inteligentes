import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Clock, AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function GarantiaInfo({ vistoria }) {
  const calcularGarantias = (dataVistoria) => {
    const dataBase = new Date(dataVistoria);
    const hoje = new Date();
    
    const garantias = [
      {
        tipo: "legal_90_dias",
        nome: "Garantia Legal - Vícios Aparentes",
        prazo: 90,
        unidade: "dias",
        base_legal: "Art. 26, inc. II, CDC",
        descricao: "Para vícios aparentes ou de fácil constatação",
        dataFim: new Date(dataBase.getTime() + (90 * 24 * 60 * 60 * 1000)),
        cor: "emerald"
      },
      {
        tipo: "legal_1_ano",
        nome: "Garantia Legal - Vícios Ocultos",
        prazo: 1,
        unidade: "ano",
        base_legal: "Art. 445, Código Civil",
        descricao: "Para vícios ou defeitos redibitórios (ocultos)",
        dataFim: new Date(dataBase.getTime() + (365 * 24 * 60 * 60 * 1000)),
        cor: "blue"
      },
      {
        tipo: "legal_5_anos",
        nome: "Garantia Legal - Estrutural",
        prazo: 5,
        unidade: "anos",
        base_legal: "Art. 618, Código Civil",
        descricao: "Para solidez e segurança da edificação",
        dataFim: new Date(dataBase.getTime() + (5 * 365 * 24 * 60 * 60 * 1000)),
        cor: "purple"
      }
    ];

    return garantias.map(garantia => ({
      ...garantia,
      diasRestantes: Math.max(0, Math.floor((garantia.dataFim - hoje) / (24 * 60 * 60 * 1000))),
      status: garantia.dataFim > hoje ? 'ativa' : 'expirada',
      porcentagemDecorrida: Math.min(100, ((hoje - dataBase) / (garantia.dataFim - dataBase)) * 100)
    }));
  };

  const garantias = calcularGarantias(vistoria.data_vistoria);

  const getStatusColor = (status, cor) => {
    if (status === 'expirada') return 'bg-red-100 text-red-800 border-red-200';
    const cores = {
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return cores[cor] || cores.blue;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Garantias Legais e Contratuais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Estas garantias são asseguradas pelo Código de Defesa do Consumidor e Código Civil. 
              Os prazos começam a contar a partir da data de recebimento do imóvel.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {garantias.map((garantia, index) => (
              <motion.div
                key={garantia.tipo}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{garantia.nome}</h4>
                        <p className="text-sm text-gray-600 mb-2">{garantia.descricao}</p>
                        <Badge variant="outline" className="text-xs">
                          {garantia.base_legal}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(garantia.status, garantia.cor)}>
                        {garantia.status === 'ativa' ? 'Ativa' : 'Expirada'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Prazo:</span>
                        <span className="font-medium">{garantia.prazo} {garantia.unidade}</span>
                      </div>
                      
                      {garantia.status === 'ativa' && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Dias restantes:</span>
                            <span className="font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {garantia.diasRestantes} dias
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                garantia.porcentagemDecorrida > 80 ? 'bg-red-500' : 
                                garantia.porcentagemDecorrida > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${garantia.porcentagemDecorrida}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 text-right">
                            {Math.round(100 - garantia.porcentagemDecorrida)}% do prazo restante
                          </p>
                        </>
                      )}

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        <strong>Data fim:</strong> {garantia.dataFim.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Avisos Importantes */}
          <Alert className="mt-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Advertências Importantes</AlertTitle>
            <AlertDescription className="text-yellow-700 space-y-2">
              <p>• O mau uso do imóvel pode provocar a perda das garantias.</p>
              <p>• Materiais que sofrem desgaste natural (vedantes, etc.) devem ser repostos pelo usuário.</p>
              <p>• Modificações nas partes comuns da edificação necessitam aprovação em Assembleia Geral (Art. 10, Lei 4.591/64).</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}