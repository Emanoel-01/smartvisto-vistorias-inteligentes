import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { ReVistoria } from '@/entities/ReVistoria';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Save, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AgendarReVistoria() {
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState(null);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [formData, setFormData] = useState({
    data_agendada: '',
    motivo: '',
    itens_selecionados: [],
    vistoriador_nome: '',
    observacoes: ''
  });

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarDados = useCallback(async () => {
    try {
      const [user, vistoriasData, ncData] = await Promise.all([
        User.me(),
        Vistoria.list(),
        NaoConformidade.list()
      ]);

      setUsuario(user);

      const vistoriaEncontrada = vistoriasData.find(v => v.id === vistoriaId);
      setVistoria(vistoriaEncontrada);

      const ncsVistoria = ncData.filter(nc => nc.vistoria_id === vistoriaId && nc.status !== 'corrigido');
      setNaoConformidades(ncsVistoria);

      setFormData(prev => ({
        ...prev,
        vistoriador_nome: user.full_name || '',
        itens_selecionados: ncsVistoria.map(nc => nc.id)
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [vistoriaId]);

  useEffect(() => {
    if (vistoriaId) {
      carregarDados();
    }
  }, [vistoriaId, carregarDados]);

  const handleToggleItem = (ncId) => {
    setFormData(prev => ({
      ...prev,
      itens_selecionados: prev.itens_selecionados.includes(ncId)
        ? prev.itens_selecionados.filter(id => id !== ncId)
        : [...prev.itens_selecionados, ncId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.data_agendada || !formData.motivo || formData.itens_selecionados.length === 0) {
      alert('Por favor, preencha a data, motivo e selecione pelo menos um item para verificar');
      return;
    }

    setSalvando(true);
    try {
      await ReVistoria.create({
        vistoria_original_id: vistoriaId,
        data_agendada: formData.data_agendada,
        motivo: formData.motivo,
        itens_para_verificar: formData.itens_selecionados,
        vistoriador_nome: formData.vistoriador_nome,
        status: 'agendada',
        observacoes: formData.observacoes
      });

      await Vistoria.update(vistoriaId, {
        status: 'em_reparo'
      });

      alert('Re-vistoria agendada com sucesso!');
      navigate(createPageUrl(`DetalhesVistoria?id=${vistoriaId}`));
    } catch (error) {
      console.error('Erro ao agendar re-vistoria:', error);
      alert('Erro ao agendar re-vistoria. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const getClassificacaoColor = (classificacao) => {
    const colors = {
      'critico': 'bg-red-100 text-red-800',
      'grave': 'bg-orange-100 text-orange-800',
      'leve': 'bg-yellow-100 text-yellow-800'
    };
    return colors[classificacao] || colors.leve;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vistoria) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vistoria não encontrada</h1>
          <Link to={createPageUrl('Dashboard')}>
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl(`DetalhesVistoria?id=${vistoriaId}`)}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Agendar Re-Vistoria
            </h1>
            <p className="text-gray-600">{vistoria.empreendimento} • {vistoria.unidade}</p>
          </div>
        </motion.div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            A re-vistoria permite verificar se as não conformidades foram corrigidas. Selecione os itens que serão verificados e a data.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal - Itens para Verificar */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardTitle>Itens para Verificar na Re-Vistoria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {naoConformidades.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Não há não conformidades pendentes nesta vistoria.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {naoConformidades.map((nc) => (
                        <div key={nc.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={`nc-${nc.id}`}
                            checked={formData.itens_selecionados.includes(nc.id)}
                            onCheckedChange={() => handleToggleItem(nc.id)}
                          />
                          <Label htmlFor={`nc-${nc.id}`} className="flex-1 cursor-pointer">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <strong className="text-gray-900">{nc.ambiente}</strong>
                                <Badge className={getClassificacaoColor(nc.classificacao)}>
                                  {nc.classificacao}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700">{nc.item_texto}</p>
                              <p className="text-xs text-gray-500 mt-1">{nc.descricao_problema}</p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna Lateral - Dados do Agendamento */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                  <CardTitle>Dados do Agendamento</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="data_agendada">Data da Re-Vistoria *</Label>
                    <Input
                      id="data_agendada"
                      type="date"
                      value={formData.data_agendada}
                      onChange={(e) => setFormData({...formData, data_agendada: e.target.value})}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="motivo">Motivo da Re-Vistoria *</Label>
                    <Textarea
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                      placeholder="Ex: Verificar correção das não conformidades identificadas na vistoria inicial"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="vistoriador_nome">Vistoriador Responsável</Label>
                    <Input
                      id="vistoriador_nome"
                      value={formData.vistoriador_nome}
                      onChange={(e) => setFormData({...formData, vistoriador_nome: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      placeholder="Observações adicionais (opcional)"
                      rows={3}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Itens selecionados:</strong> {formData.itens_selecionados.length} de {naoConformidades.length}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={salvando || formData.itens_selecionados.length === 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {salvando ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Agendar Re-Vistoria
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}