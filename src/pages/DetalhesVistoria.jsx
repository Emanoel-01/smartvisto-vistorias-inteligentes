import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { ReVistoria } from '@/entities/ReVistoria';
import { PerfilUsuario } from '@/entities/PerfilUsuario';
import { ComentarioVistoria } from '@/entities/ComentarioVistoria';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, CheckCircle, Calendar, History, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function DetalhesVistoria() {
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState(null);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [reVistorias, setReVistorias] = useState([]);
  const [perfisUsuario, setPerfisUsuario] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarDados = useCallback(async () => {
    try {
      const [vistoriasData, perfisData, comentariosData, reVistoriasData] = await Promise.all([
        Vistoria.list(),
        PerfilUsuario.list(),
        ComentarioVistoria.list(),
        ReVistoria.list()
      ]);

      const vistoriaEncontrada = vistoriasData.find(v => v.id === vistoriaId);
      setVistoria(vistoriaEncontrada);

      if (vistoriaEncontrada) {
        const perfisVistoria = perfisData.filter(p => p.vistoria_id === vistoriaId);
        setPerfisUsuario(perfisVistoria);

        const comentariosVistoria = comentariosData.filter(c => c.vistoria_id === vistoriaId);
        setComentarios(comentariosVistoria);

        const reVistoriasRelacionadas = reVistoriasData.filter(rv => rv.vistoria_original_id === vistoriaId);
        setReVistorias(reVistoriasRelacionadas);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [vistoriaId]);

  useEffect(() => {
    if (!vistoriaId) {
      setLoading(false);
      return;
    }
    carregarDados();
  }, [carregarDados, vistoriaId]);

  const getStatusBadge = (status) => {
    const configs = {
      rascunho: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      em_andamento: { color: 'bg-amber-100 text-amber-800', label: 'Em Andamento' },
      concluida: { color: 'bg-emerald-100 text-emerald-800', label: 'Concluída' },
      aguardando_correcao: { color: 'bg-orange-100 text-orange-800', label: 'Aguardando Correção' },
      finalizada: { color: 'bg-blue-100 text-blue-800', label: 'Finalizada' }
    };
    const config = configs[status] || configs.rascunho;
    return <Badge className={config.color}>{config.label}</Badge>;
  };
  
  const podeAgendarReVistoria = vistoria && vistoria.total_nao_conformidades > 0 && vistoria.status !== 'finalizada';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto"><div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div></div>
      </div>
    );
  }

  if (!vistoria) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <Card className="p-8 text-center shadow-lg">
                <CardTitle className="mb-4">Vistoria não encontrada</CardTitle>
                <p className="text-gray-600 mb-6">A vistoria com o ID especificado não pôde ser carregada.</p>
                <Button onClick={() => navigate(createPageUrl('Dashboard'))}>Voltar para o Dashboard</Button>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vistoria.empreendimento}</h1>
              <p className="text-gray-600">{vistoria.unidade} • {vistoria.cliente_nome}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {podeAgendarReVistoria && reVistorias.filter(rv => rv.status === 'agendada').length === 0 && (
              <Link to={createPageUrl(`AgendarReVistoria?id=${vistoria.id}`)}>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                  <Calendar className="w-5 h-5 mr-2" />
                  Agendar Re-Vistoria
                </Button>
              </Link>
            )}

            {(vistoria.status === 'em_andamento' || vistoria.status === 'rascunho') && (
              <Link to={createPageUrl(`EditarVistoria?id=${vistoria.id}`)}>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Pencil className="w-5 h-5 mr-2" />
                  Continuar Vistoria
                </Button>
              </Link>
            )}

            {(vistoria.status === 'concluida' || vistoria.status === 'finalizada' || vistoria.status === 'aguardando_correcao') && (
              <Link to={createPageUrl(`LaudoPDF?id=${vistoria.id}`)}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Laudo
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Card de Informações Gerais */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader className="bg-white">
              <CardTitle className="flex justify-between items-center">
                <span>Informações Gerais</span>
                {getStatusBadge(vistoria.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
              <div><p className="font-semibold">Cliente</p><p>{vistoria.cliente_nome}</p></div>
              <div><p className="font-semibold">CPF</p><p>{vistoria.cliente_cpf || 'N/A'}</p></div>
              <div><p className="font-semibold">Data</p><p>{new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}</p></div>
              <div><p className="font-semibold">Vistoriador</p><p>{vistoria.vistoriador_nome}</p></div>
              <div><p className="font-semibold">ART/RRT</p><p>{vistoria.art_rrt_profissional || 'N/A'}</p></div>
              <div className={vistoria.total_nao_conformidades > 0 ? 'text-red-600' : 'text-emerald-600'}>
                <p className="font-semibold">Não Conformidades</p>
                <p>{vistoria.total_nao_conformidades}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seção de Re-Vistorias */}
        {reVistorias.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-xl border-0 mb-8">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-6 h-6" />
                  Histórico de Re-Vistorias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {reVistorias.map((rv) => (
                    <div key={rv.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{rv.motivo}</h4>
                          <p className="text-sm text-gray-600">
                            Agendada para: {new Date(rv.data_agendada).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge className={
                          rv.status === 'realizada' ? 'bg-green-100 text-green-800' :
                          rv.status === 'agendada' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {rv.status === 'realizada' ? 'Realizada' : rv.status === 'agendada' ? 'Agendada' : 'Cancelada'}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        {rv.status === 'agendada' && (
                          <Link to={createPageUrl(`RealizarReVistoria?id=${rv.id}`)}>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Realizar Re-Vistoria
                            </Button>
                          </Link>
                        )}
                        {rv.status === 'realizada' && (
                          <Link to={createPageUrl(`LaudoReVistoria?id=${rv.id}`)}>
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Ver Laudo de Re-Vistoria
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}