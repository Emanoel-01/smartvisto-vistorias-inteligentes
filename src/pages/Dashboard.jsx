
import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { ReVistoria } from '@/entities/ReVistoria';
import { PerfilUsuario } from '@/entities/PerfilUsuario';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, ClipboardList, CheckCircle, AlertTriangle, Settings, Calendar, TrendingUp, History, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import StatsCards from "../components/dashboard/StatsCards";
import AnalyticsCards from "../components/dashboard/AnalyticsCards";

export default function Dashboard() {
  const navigate = useNavigate();
  const [vistorias, setVistorias] = useState([]);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [reVistorias, setReVistorias] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  const calcularTempoMedioCorrecao = useCallback((ncs) => {
    const ncCorrigidas = ncs.filter(nc => nc.status === 'corrigido' && nc.data_correcao);
    if (ncCorrigidas.length === 0) return 0;

    const totalDias = ncCorrigidas.reduce((acc, nc) => {
      const inicio = new Date(nc.created_date);
      const fim = new Date(nc.data_correcao);
      return acc + Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
    }, 0);

    return Math.round(totalDias / ncCorrigidas.length);
  }, []);

  const calcularTaxaReincidencia = useCallback((ncs) => {
    const problemasRecorrentes = ncs.filter(nc => {
      return ncs.filter(outroNc =>
        outroNc.ambiente === nc.ambiente &&
        outroNc.item_texto.includes(nc.item_texto.substring(0, 20)) &&
        outroNc.id !== nc.id
      ).length > 0;
    });

    return ncs.length > 0 ? Math.round((problemasRecorrentes.length / ncs.length) * 100) : 0;
  }, []);

  const calcularAnalyticsAvancado = useCallback((vistorias, ncs) => {
    const ultimosSeisMeses = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;

      const vistoriasMes = vistorias.filter(v => {
        const vData = new Date(v.created_date);
        return vData.getMonth() === data.getMonth() && vData.getFullYear() === data.getFullYear();
      }).length;

      const ncsMes = ncs.filter(nc => {
        const ncData = new Date(nc.created_date);
        return ncData.getMonth() === data.getMonth() && ncData.getFullYear() === data.getFullYear();
      }).length;

      ultimosSeisMeses.push({
        mes: mesAno,
        vistorias: vistoriasMes,
        naoConformidades: ncsMes,
        percentualProblemas: vistoriasMes > 0 ? Math.round((ncsMes / vistoriasMes) * 100) : 0
      });
    }

    const ambienteStats = {};
    ncs.forEach(nc => {
      if (!ambienteStats[nc.ambiente]) {
        ambienteStats[nc.ambiente] = { total: 0, critico: 0, grave: 0, leve: 0 };
      }
      ambienteStats[nc.ambiente].total++;
      ambienteStats[nc.ambiente][nc.classificacao || 'leve']++;
    });

    const ambienteChartData = Object.entries(ambienteStats)
      .map(([ambiente, stats]) => ({
        ambiente,
        total: stats.total,
        critico: stats.critico,
        grave: stats.grave,
        leve: stats.leve
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const classificacaoData = [
      { name: 'Crítico', value: ncs.filter(nc => nc.classificacao === 'critico').length, color: '#dc2626' },
      { name: 'Grave', value: ncs.filter(nc => nc.classificacao === 'grave').length, color: '#ea580c' },
      { name: 'Leve', value: ncs.filter(nc => nc.classificacao === 'leve' || !nc.classificacao).length, color: '#ca8a04' }
    ];

    const totalVistorias = vistorias.length;
    const vistoriasConcluidas = vistorias.filter(v => v.status === 'concluida' || v.status === 'finalizada').length;
    const tempoMedioCorrecao = calcularTempoMedioCorrecao(ncs);
    const taxaReincidencia = calcularTaxaReincidencia(ncs);

    return {
      tendenciaTemporal: ultimosSeisMeses,
      ambienteAnalysis: ambienteChartData,
      classificacaoDistribution: classificacaoData,
      kpis: {
        totalVistorias,
        vistoriasConcluidas,
        taxaSucesso: totalVistorias > 0 ? Math.round((vistoriasConcluidas / totalVistorias) * 100) : 0,
        tempoMedioCorrecao,
        taxaReincidencia,
        problemasMaisCriticos: ncs.filter(nc => nc.classificacao === 'critico').length
      }
    };
  }, [calcularTempoMedioCorrecao, calcularTaxaReincidencia]);

  const carregarDadosDashboard = useCallback(async () => {
    try {
      const user = await User.me();
      setUsuario(user);

      const perfis = await PerfilUsuario.filter({ usuario_email: user.email });
      const perfilPrincipal = perfis.find(p => p.tipo_perfil === 'gerente_sistema' || p.tipo_perfil === 'construtora');
      setPerfilUsuario(perfilPrincipal || (perfis.length > 0 ? perfis[0] : null));

      const [vistoriasData, ncData, reVistoriasData] = await Promise.all([
        Vistoria.list('-created_date'),
        NaoConformidade.list('-created_date'),
        ReVistoria.list('-created_date')
      ]);

      setVistorias(vistoriasData);
      setNaoConformidades(ncData);
      setReVistorias(reVistoriasData);

      const analyticsData = calcularAnalyticsAvancado(vistoriasData, ncData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [calcularAnalyticsAvancado]);

  useEffect(() => {
    carregarDadosDashboard();
  }, [carregarDadosDashboard]);

  const getStatusBadge = (status) => {
    const configs = {
      rascunho: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      agendada: { color: 'bg-blue-100 text-blue-800', label: 'Agendada' },
      em_andamento: { color: 'bg-amber-100 text-amber-800', label: 'Em Andamento' },
      concluida: { color: 'bg-emerald-100 text-emerald-800', label: 'Concluída' },
      aguardando_correcao: { color: 'bg-orange-100 text-orange-800', label: 'Aguardando Correção' },
      em_reparo: { color: 'bg-purple-100 text-purple-800', label: 'Em Reparo' },
      finalizada: { color: 'bg-green-100 text-green-800', label: 'Finalizada' }
    };

    const config = configs[status] || configs.rascunho;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Determinar qual interface mostrar baseado no perfil
  const isConstrutora = perfilUsuario?.tipo_perfil === 'construtora' || perfilUsuario?.tipo_perfil === 'gerente_sistema';
  const isVistoriador = !perfilUsuario || perfilUsuario?.tipo_perfil === 'vistoriador_principal';

  const stats = {
    total: vistorias.length,
    concluidas: vistorias.filter((v) => v.status === 'concluida' || v.status === 'finalizada').length,
    emAndamento: vistorias.filter((v) => v.status === 'em_andamento').length,
    aguardandoCorrecao: vistorias.filter((v) => v.status === 'aguardando_correcao').length,
    agendadas: vistorias.filter((v) => v.status === 'agendada').length,
    totalNaoConformidades: naoConformidades.length,
    naoConformidadesPendentes: naoConformidades.filter((nc) => nc.status === 'pendente').length,
    prazosVencidos: naoConformidades.filter((nc) =>
      nc.prazo_correcao && new Date(nc.prazo_correcao) < new Date() && nc.status !== 'corrigido'
    ).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // INTERFACE PARA CONSTRUTORAS E GERENTES (Analytics)
  if (isConstrutora) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">SmartVisto Analytics</h1>
              <p className="text-gray-600 text-lg">Visão estratégica e desempenho operacional</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link to={createPageUrl('Configuracoes')}>
                <Button variant="outline" size="lg">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* KPIs Principais */}
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCards
                  icon={ClipboardList}
                  title="Total de Vistorias"
                  value={stats.total}
                  subtitle={`${stats.concluidas} concluídas`}
                  colorClass="bg-blue-500"
                />
                <StatsCards
                  icon={CheckCircle}
                  title="Taxa de Sucesso"
                  value={`${analytics.kpis.taxaSucesso}%`}
                  subtitle="Vistorias sem NC"
                  colorClass="bg-emerald-500"
                />
                <StatsCards
                  icon={AlertTriangle}
                  title="Tempo Médio Correção"
                  value={`${analytics.kpis.tempoMedioCorrecao} dias`}
                  subtitle="Média geral"
                  colorClass="bg-orange-500"
                />
                <StatsCards
                  icon={TrendingUp}
                  title="Taxa Reincidência"
                  value={`${analytics.kpis.taxaReincidencia}%`}
                  subtitle="Problemas recorrentes"
                  colorClass="bg-red-500"
                />
              </div>

              <AnalyticsCards data={{
                tendenciaProblemas: {
                  direcao: 'up',
                  valor: naoConformidades.length,
                  percentual: 12
                },
                ambientesProblematicos: {
                  nome: analytics.ambienteAnalysis[0]?.ambiente || 'N/A',
                  percentual: analytics.ambienteAnalysis[0]?.total || 0
                },
                tempoMedioCorrecao: analytics.kpis.tempoMedioCorrecao,
                taxaReincidencia: analytics.kpis.taxaReincidencia
              }} />
            </>
          )}

          {/* Link para Analytics Completo */}
          <div className="mt-8">
            <Link to={createPageUrl('Analytics')}>
              <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <TrendingUp className="w-5 h-5 mr-2" />
                Ver Analytics Completo com Gráficos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // INTERFACE PARA VISTORIADOR (Foco em Produtividade e Agendamentos)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">SmartVisto</h1>
            <p className="text-gray-600 text-lg">Gestão completa de vistorias com análise inteligente</p>
          </div>

          <div className="flex gap-3 mt-4 md:mt-0">
            <Link to={createPageUrl('GerenciarGuias')}>
              <Button variant="outline" size="lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Guia do Vistoriador
              </Button>
            </Link>
            <Link to={createPageUrl('Configuracoes')}>
              <Button variant="outline" size="lg">
                <Settings className="w-5 h-5 mr-2" />
                Configurações
              </Button>
            </Link>
            <Link to={createPageUrl('NovaVistoria')}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Nova Vistoria
              </Button>
            </Link>
          </div>
        </motion.div>

        {stats.prazosVencidos > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>{stats.prazosVencidos}</strong> não conformidade(s) com prazo vencido.
              <Link to={createPageUrl('GestaoNaoConformidades')} className="underline ml-2">
                Ver detalhes
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Seção de Vistorias Agendadas */}
        {stats.agendadas > 0 && (
          <Card className="shadow-xl border-0 mb-8 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Próximas Vistorias Agendadas ({stats.agendadas})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {vistorias.filter(v => v.status === 'agendada').slice(0, 3).map((vistoria) => (
                  <div key={vistoria.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{vistoria.empreendimento}</h4>
                      <p className="text-sm text-gray-600">{vistoria.unidade} • {vistoria.cliente_nome}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-blue-700 border-blue-300">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                    </div>
                    <Link to={createPageUrl(`EditarVistoria?id=${vistoria.id}`)}>
                      <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                        Iniciar Vistoria
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção de Vistorias em Andamento */}
        {stats.emAndamento > 0 && (
          <Card className="shadow-xl border-0 mb-8 bg-gradient-to-r from-amber-50 to-amber-100">
            <CardHeader>
              <CardTitle className="text-xl text-amber-900 flex items-center gap-2">
                <ClipboardList className="w-6 h-6" />
                Vistorias em Andamento ({stats.emAndamento})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {vistorias.filter(v => v.status === 'em_andamento').slice(0, 3).map((vistoria) => {
                  // Calculate progress for 'em_andamento' vistorias
                  const totalItens = vistoria.total_itens_vistoriados || 1; // Avoid division by zero
                  let itensPendentes = 0;
                  if (vistoria.checklist_data) {
                      for (const category in vistoria.checklist_data) {
                          itensPendentes += vistoria.checklist_data[category].filter(item => item.status === 'pendente').length;
                      }
                  }
                  const itensCompletos = totalItens - itensPendentes;
                  const progresso = totalItens > 0 ? Math.round((itensCompletos / totalItens) * 100) : 0;

                  return (
                    <div key={vistoria.id} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{vistoria.empreendimento}</h4>
                          <p className="text-sm text-gray-600">{vistoria.unidade} • {vistoria.cliente_nome}</p>
                        </div>
                        <Badge variant="outline" className="text-amber-700">
                          {progresso}% completo
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-amber-600 h-2 rounded-full"
                          style={{ width: `${progresso}%` }}
                        ></div>
                      </div>
                      <Link to={createPageUrl(`EditarVistoria?id=${vistoria.id}`)}>
                        <Button variant="outline" className="w-full bg-amber-600 text-white hover:bg-amber-700">
                          Continuar Vistoria
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCards
            icon={ClipboardList}
            title="Total de Vistorias"
            value={stats.total}
            subtitle={`${stats.concluidas} concluídas`}
            colorClass="bg-blue-500"
          />
          <StatsCards
            icon={CheckCircle}
            title="Concluídas"
            value={stats.concluidas}
            subtitle={`${Math.round(stats.concluidas / (stats.total || 1) * 100)}% do total`}
            colorClass="bg-emerald-500"
          />
          <StatsCards
            icon={AlertTriangle}
            title="Aguardando Correção"
            value={stats.aguardandoCorrecao}
            subtitle="Com não conformidades"
            colorClass="bg-orange-500"
          />
          <StatsCards
            icon={AlertTriangle}
            title="Não Conformidades"
            value={stats.totalNaoConformidades}
            subtitle={`${stats.naoConformidadesPendentes} pendentes`}
            colorClass="bg-red-500"
          />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="border-b bg-white/80 backdrop-blur-sm">
            <CardTitle className="text-2xl text-gray-800">Vistorias Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AnimatePresence>
              {vistorias.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Nenhuma vistoria encontrada
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Comece criando sua primeira vistoria
                  </p>
                  <Link to={createPageUrl('NovaVistoria')}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Nova Vistoria
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="divide-y">
                  {vistorias.slice(0, 10).map((vistoria, index) => (
                    <motion.div
                      key={vistoria.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              {vistoria.empreendimento}
                            </h3>
                            {getStatusBadge(vistoria.status)}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Unidade:</strong> {vistoria.unidade}</p>
                            <p><strong>Cliente:</strong> {vistoria.cliente_nome}</p>
                            <p><strong>Data:</strong> {new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2">
                            {vistoria.total_nao_conformidades > 0 && (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                {vistoria.total_nao_conformidades} não conformidade(s)
                              </Badge>
                            )}
                            {reVistorias.filter((rv) => rv.vistoria_original_id === vistoria.id).length > 0 && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                <Calendar className="w-3 h-3 mr-1" />
                                Re-vistoria agendada
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link to={createPageUrl(`DetalhesVistoria?id=${vistoria.id}`)}>
                            <Button variant="outline" size="sm">
                              <History className="w-4 h-4 mr-1" />
                              Ver Histórico
                            </Button>
                          </Link>

                          {(vistoria.status === 'concluida' || vistoria.status === 'finalizada') && (
                            <Link to={createPageUrl(`LaudoPDF?id=${vistoria.id}`)}>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                Ver Laudo
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
