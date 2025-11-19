
import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Brain, Sparkles, BarChart3, PieChart, Activity, Target, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { InvokeLLM } from "@/integrations/Core";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

export default function Analytics() {
  const [vistorias, setVistorias] = useState([]);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gerandoInsights, setGerandoInsights] = useState(false);

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
    // Simular análise de reincidência baseada em padrões de ambiente e problema
    const problemasRecorrentes = ncs.filter(nc => {
      return ncs.filter(outroNc =>
        outroNc.ambiente === nc.ambiente &&
        outroNc.item_texto.includes(nc.item_texto.substring(0, 20)) &&
        outroNc.id !== nc.id
      ).length > 0;
    });

    return ncs.length > 0 ? Math.round((problemasRecorrentes.length / ncs.length) * 100) : 0;
  }, []); // Removed 'vistorias' from dependency array as it's not used in this function.

  const calcularAnalyticsAvancado = useCallback((vistorias, ncs) => {
    // Tendências temporais
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

    // Análise por ambiente
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

    // Análise de classificação
    const classificacaoData = [
      { name: 'Crítico', value: ncs.filter(nc => nc.classificacao === 'critico').length, color: '#dc2626' },
      { name: 'Grave', value: ncs.filter(nc => nc.classificacao === 'grave').length, color: '#ea580c' },
      { name: 'Leve', value: ncs.filter(nc => nc.classificacao === 'leve' || !nc.classificacao).length, color: '#ca8a04' }
    ];

    // KPIs principais
    const totalVistorias = vistorias.length;
    const vistoriasConcluidas = vistorias.filter(v => v.status === 'concluida').length;
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


  const carregarDados = useCallback(async () => {
    try {
      const [vistoriasData, ncData] = await Promise.all([
        Vistoria.list('-created_date'),
        NaoConformidade.list('-created_date')
      ]);

      setVistorias(vistoriasData);
      setNaoConformidades(ncData);

      const analyticsData = calcularAnalyticsAvancado(vistoriasData, ncData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [calcularAnalyticsAvancado]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const gerarInsightsIA = async () => {
    if (!analytics) return;

    setGerandoInsights(true);
    try {
      const dadosParaAnalise = {
        totalVistorias: analytics.kpis.totalVistorias,
        taxaSucesso: analytics.kpis.taxaSucesso,
        ambientesProblematicos: analytics.ambienteAnalysis.slice(0, 3),
        tendenciaUltimosMeses: analytics.tendenciaTemporal.slice(-3),
        problemasCriticos: analytics.kpis.problemasMaisCriticos,
        tempoMedioCorrecao: analytics.kpis.tempoMedioCorrecao
      };

      const prompt = `Como especialista em análise de vistorias imobiliárias, analise os seguintes dados e forneça insights estratégicos:

Dados da Análise:
${JSON.stringify(dadosParaAnalise, null, 2)}

Forneça uma análise profissional contendo:
1. Principais insights sobre a qualidade das entregas
2. Tendências identificadas nos últimos meses
3. Ambientes que requerem mais atenção
4. Recomendações para melhoria dos processos
5. Alertas sobre possíveis riscos

A resposta deve ser técnica, objetiva e direcionada para gestores de qualidade na construção civil.`;

      const resultado = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights_principais: { type: "array", items: { type: "string" } },
            tendencias: { type: "array", items: { type: "string" } },
            ambientes_criticos: { type: "array", items: { type: "string" } },
            recomendacoes: { type: "array", items: { type: "string" } },
            alertas: { type: "array", items: { type: "string" } },
            resumo_executivo: { type: "string" }
          }
        }
      });

      setInsights(resultado);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      alert('Erro ao gerar insights. Tente novamente.');
    } finally {
      setGerandoInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Avançado</h1>
              <p className="text-gray-600">Análise inteligente dos dados de vistorias</p>
            </div>
          </div>

          <Button
            onClick={gerarInsightsIA}
            disabled={gerandoInsights}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {gerandoInsights ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Brain className="w-5 h-5 mr-2" />
            )}
            Gerar Insights com IA
          </Button>
        </motion.div>

        {/* KPIs Principais */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                    <p className="text-3xl font-bold text-emerald-600">{analytics.kpis.taxaSucesso}%</p>
                  </div>
                  <Target className="w-10 h-10 text-emerald-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tempo Médio Correção</p>
                    <p className="text-3xl font-bold text-blue-600">{analytics.kpis.tempoMedioCorrecao} dias</p>
                  </div>
                  <Activity className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Problemas Críticos</p>
                    <p className="text-3xl font-bold text-red-600">{analytics.kpis.problemasMaisCriticos}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Taxa Reincidência</p>
                    <p className="text-3xl font-bold text-orange-600">{analytics.kpis.taxaReincidencia}%</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tendência Temporal */}
          {analytics && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Tendência dos Últimos 6 Meses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.tendenciaTemporal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="vistorias" stroke="#3b82f6" strokeWidth={2} name="Vistorias" />
                    <Line type="monotone" dataKey="naoConformidades" stroke="#ef4444" strokeWidth={2} name="Não Conformidades" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Distribuição por Classificação */}
          {analytics && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Classificação dos Problemas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.classificacaoDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.classificacaoDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {analytics.classificacaoDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Análise por Ambiente */}
        {analytics && (
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader>
              <CardTitle>Problemas por Ambiente</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.ambienteAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ambiente" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="critico" stackId="a" fill="#dc2626" name="Crítico" />
                  <Bar dataKey="grave" stackId="a" fill="#ea580c" name="Grave" />
                  <Bar dataKey="leve" stackId="a" fill="#ca8a04" name="Leve" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Insights da IA */}
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Insights Gerados por IA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo Executivo</h3>
                  <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg shadow-sm">
                    {insights.resumo_executivo}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🎯 Insights Principais</h4>
                    <ul className="space-y-2">
                      {insights.insights_principais?.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📈 Tendências</h4>
                    <ul className="space-y-2">
                      {insights.tendencias?.map((tendencia, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          {tendencia}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🏠 Ambientes Críticos</h4>
                    <ul className="space-y-2">
                      {insights.ambientes_criticos?.map((ambiente, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                          {ambiente}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">💡 Recomendações</h4>
                    <ul className="space-y-2">
                      {insights.recomendacoes?.map((recomendacao, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                          {recomendacao}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {insights.alertas && insights.alertas.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Alertas Importantes
                    </h4>
                    <ul className="space-y-1">
                      {insights.alertas.map((alerta, index) => (
                        <li key={index} className="text-sm text-amber-700">
                          • {alerta}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
