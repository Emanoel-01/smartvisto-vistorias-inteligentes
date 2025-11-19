import { useState, useEffect } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import GestaoNaoConformidade from "../components/naoconformidade/GestaoNaoConformidade";

export default function GestaoNaoConformidades() {
  const [vistorias, setVistorias] = useState([]);
  const [filtros, setFiltros] = useState({
    busca: '',
    status: 'todos',
    empreendimento: 'todos'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const vistoriasData = await Vistoria.list('-created_date');
      // Filtrar apenas vistorias com não conformidades
      const vistoriasComNC = vistoriasData.filter(v => v.total_nao_conformidades > 0);
      setVistorias(vistoriasComNC);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const vistoriasFiltradas = vistorias.filter(vistoria => {
    const matchBusca = !filtros.busca || 
      vistoria.cliente_nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      vistoria.empreendimento.toLowerCase().includes(filtros.busca.toLowerCase());
    
    const matchStatus = filtros.status === 'todos' || vistoria.status === filtros.status;
    
    const matchEmpreendimento = filtros.empreendimento === 'todos' || 
      vistoria.empreendimento === filtros.empreendimento;

    return matchBusca && matchStatus && matchEmpreendimento;
  });

  const empreendimentosUnicos = [...new Set(vistorias.map(v => v.empreendimento))];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aguardando_correcao': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'concluida': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
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
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Central de Não Conformidades</h1>
            <p className="text-gray-600">Gerencie todas as não conformidades encontradas</p>
          </div>
        </motion.div>

        {/* Filtros */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente ou empreendimento..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  className="w-full"
                />
              </div>
              
              <Select 
                value={filtros.status}
                onValueChange={(value) => setFiltros({...filtros, status: value})}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="aguardando_correcao">Aguardando Correção</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filtros.empreendimento}
                onValueChange={(value) => setFiltros({...filtros, empreendimento: value})}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Empreendimentos</SelectItem>
                  {empreendimentosUnicos.map(emp => (
                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vistorias com NC */}
        <div className="space-y-6">
          {vistoriasFiltradas.map((vistoria, index) => (
            <motion.div
              key={vistoria.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(vistoria.status)}
                        {vistoria.empreendimento}
                      </CardTitle>
                      <p className="text-gray-600">
                        {vistoria.cliente_nome} • {vistoria.unidade} • 
                        {vistoria.total_nao_conformidades} não conformidades
                      </p>
                    </div>
                    <Link to={createPageUrl(`DetalhesVistoria?id=${vistoria.id}`)}>
                      <Button variant="outline">
                        Ver Histórico Completo
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <GestaoNaoConformidade vistoria={vistoria} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {vistoriasFiltradas.length === 0 && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhuma não conformidade encontrada
              </h3>
              <p className="text-gray-500">
                Não há vistorias com não conformidades que correspondam aos filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}