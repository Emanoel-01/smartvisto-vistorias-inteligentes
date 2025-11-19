import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Clock, CheckCircle, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GestaoNaoConformidade({ vistoria }) {
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarNaoConformidades = useCallback(async () => {
    if (!vistoria) return;

    try {
      // Extrair NCs do checklist_data
      const ncs = [];
      Object.entries(vistoria.checklist_data || {}).forEach(([ambiente, itens]) => {
        itens
          .filter(item => item.status === 'nao_conforme')
          .forEach(item => {
            ncs.push({
              id: item.id || `${ambiente}-${item.texto}`,
              vistoria_id: vistoria.id,
              ambiente: ambiente,
              item_texto: item.texto,
              descricao_problema: item.detalhes?.observacao || '',
              foto_url: item.detalhes?.foto_url || null,
              foto_url_before: item.detalhes?.foto_url || null,
              foto_url_after: null,
              classificacao: item.detalhes?.classificacao || 'leve',
              garantia_aplicavel: item.detalhes?.garantia_aplicavel || null,
              observacoes_tecnicas_ia: item.detalhes?.observacoes_tecnicas_ia || null,
              sugestao_correcao: item.detalhes?.sugestao_correcao || null,
              geolocalizacao: item.detalhes?.geolocalizacao || null,
              status: 'pendente',
              prazo_correcao: null,
              data_correcao: null,
              responsavel_correcao: null
            });
          });
      });

      setNaoConformidades(ncs);
    } catch (error) {
      console.error('Erro ao carregar não conformidades:', error);
    } finally {
      setLoading(false);
    }
  }, [vistoria]);

  useEffect(() => {
    carregarNaoConformidades();
  }, [carregarNaoConformidades]);

  const getStatusBadge = (status) => {
    const configs = {
      pendente: { color: 'bg-orange-100 text-orange-800', label: 'Pendente', icon: Clock },
      em_correcao: { color: 'bg-blue-100 text-blue-800', label: 'Em Correção', icon: AlertTriangle },
      corrigido: { color: 'bg-emerald-100 text-emerald-800', label: 'Corrigido', icon: CheckCircle }
    };

    const config = configs[status] || configs.pendente;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getClassificacaoColor = (classificacao) => {
    const colors = {
      'critico': 'border-l-4 border-red-500 bg-red-50',
      'grave': 'border-l-4 border-orange-500 bg-orange-50',
      'leve': 'border-l-4 border-yellow-500 bg-yellow-50'
    };
    return colors[classificacao] || colors.leve;
  };

  const getGarantiaLabel = (tipo) => {
    const labels = {
      'legal_90_dias': '90 dias - Vícios Aparentes',
      'legal_1_ano': '1 ano - Vícios Ocultos',
      'legal_5_anos': '5 anos - Solidez e Segurança'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (naoConformidades.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
        <p className="text-lg font-semibold">Nenhuma não conformidade encontrada</p>
        <p className="text-sm">Esta vistoria não possui problemas registrados.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <AnimatePresence>
          {naoConformidades.map((nc, index) => (
            <motion.div
              key={nc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`shadow-lg border-0 ${getClassificacaoColor(nc.classificacao)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {nc.ambiente} - {nc.item_texto}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {getStatusBadge(nc.status)}
                        <Badge variant="outline" className="capitalize">
                          {nc.classificacao}
                        </Badge>
                        {nc.garantia_aplicavel && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300">
                            {getGarantiaLabel(nc.garantia_aplicavel)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Descrição */}
                  <div>
                    <Label className="font-semibold text-red-800">Descrição do Problema:</Label>
                    <p className="text-sm text-gray-700 mt-1">{nc.descricao_problema}</p>
                  </div>

                  {/* Foto Before com GPS */}
                  {(nc.foto_url || nc.foto_url_before) && (
                    <div>
                      <Label className="font-semibold">Evidência Fotográfica:</Label>
                      <div className="mt-2">
                        <img 
                          src={nc.foto_url || nc.foto_url_before} 
                          alt="Evidência" 
                          className="max-w-sm h-48 object-cover rounded border"
                        />
                        {nc.geolocalizacao && (
                          <Badge variant="outline" className="mt-2 text-green-700 border-green-400">
                            <MapPin className="w-3 h-3 mr-1" />
                            GPS: {nc.geolocalizacao.latitude.toFixed(6)}, {nc.geolocalizacao.longitude.toFixed(6)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Parecer Técnico IA */}
                  {nc.observacoes_tecnicas_ia && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                      <Label className="font-semibold text-blue-900">Parecer Técnico:</Label>
                      <pre className="text-sm text-blue-800 mt-2 whitespace-pre-wrap font-sans">
                        {nc.observacoes_tecnicas_ia}
                      </pre>
                    </div>
                  )}

                  {/* Sugestão de Correção */}
                  {nc.sugestao_correcao && (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded">
                      <Label className="font-semibold text-emerald-900">Procedimento de Correção Sugerido:</Label>
                      <pre className="text-sm text-emerald-800 mt-2 whitespace-pre-wrap font-sans">
                        {nc.sugestao_correcao}
                      </pre>
                    </div>
                  )}

                  {/* Foto After (se houver) */}
                  {nc.foto_url_after && (
                    <div>
                      <Label className="font-semibold text-green-700">Foto Após Correção:</Label>
                      <div className="mt-2">
                        <img 
                          src={nc.foto_url_after} 
                          alt="Após correção" 
                          className="max-w-sm h-48 object-cover rounded border border-green-500"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}