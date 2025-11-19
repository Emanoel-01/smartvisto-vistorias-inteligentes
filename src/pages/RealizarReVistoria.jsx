import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { ReVistoria } from '@/entities/ReVistoria';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { UploadFile } from "@/integrations/Core";

export default function RealizarReVistoria() {
  const navigate = useNavigate();
  const [vistoriaOriginal, setVistoriaOriginal] = useState(null);
  const [reVistoria, setReVistoria] = useState(null);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [resultados, setResultados] = useState({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const reVistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarDados = useCallback(async () => {
    try {
      const [reVistoriasData, vistoriasData, ncData] = await Promise.all([
        ReVistoria.list(),
        Vistoria.list(),
        NaoConformidade.list()
      ]);

      const reVistoriaEncontrada = reVistoriasData.find(rv => rv.id === reVistoriaId);
      
      if (!reVistoriaEncontrada) {
        console.error('Re-vistoria não encontrada');
        setLoading(false);
        return;
      }
      
      setReVistoria(reVistoriaEncontrada);

      const vistoriaOrig = vistoriasData.find(v => v.id === reVistoriaEncontrada.vistoria_original_id);
      
      if (!vistoriaOrig) {
        console.error('Vistoria original não encontrada');
        setLoading(false);
        return;
      }
      
      setVistoriaOriginal(vistoriaOrig);

      const ncsParaVerificar = ncData.filter(nc => 
        reVistoriaEncontrada.itens_para_verificar && 
        reVistoriaEncontrada.itens_para_verificar.includes(nc.id)
      );
      setNaoConformidades(ncsParaVerificar);

      // Inicializar resultados
      const resultadosIniciais = {};
      ncsParaVerificar.forEach(nc => {
        resultadosIniciais[nc.id] = {
          status_na_revistoria: 'Não Corrigido',
          observacoes_revistoria: '',
          foto_url_after: nc.foto_url_after || null,
          uploading: false
        };
      });
      setResultados(resultadosIniciais);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [reVistoriaId]);

  useEffect(() => {
    if (reVistoriaId) {
      carregarDados();
    } else {
      setLoading(false);
    }
  }, [reVistoriaId, carregarDados]);

  const handleFileUpload = async (ncId, file) => {
    setResultados(prev => ({
      ...prev,
      [ncId]: { ...prev[ncId], uploading: true }
    }));

    try {
      const { file_url } = await UploadFile({ file });
      setResultados(prev => ({
        ...prev,
        [ncId]: { ...prev[ncId], foto_url_after: file_url, uploading: false }
      }));
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da foto');
      setResultados(prev => ({
        ...prev,
        [ncId]: { ...prev[ncId], uploading: false }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const todosVerificados = Object.values(resultados).every(r => r.status_na_revistoria);
    if (!todosVerificados) {
      alert('Por favor, defina o status de todos os itens');
      return;
    }

    setSalvando(true);
    try {
      // Atualizar cada NC com o resultado
      for (const [ncId, resultado] of Object.entries(resultados)) {
        await NaoConformidade.update(ncId, {
          status_na_revistoria: resultado.status_na_revistoria,
          observacoes_correcao: resultado.observacoes_revistoria,
          foto_url_after: resultado.foto_url_after,
          status: resultado.status_na_revistoria === 'Corrigido' ? 'corrigido' : 'nao_corrigido',
          data_correcao: resultado.status_na_revistoria === 'Corrigido' ? new Date().toISOString() : null
        });
      }

      // Atualizar a re-vistoria
      await ReVistoria.update(reVistoriaId, {
        status: 'realizada',
        resultado: resultados
      });

      // Atualizar status da vistoria original
      const todasCorrigidas = Object.values(resultados).every(r => r.status_na_revistoria === 'Corrigido');
      await Vistoria.update(vistoriaOriginal.id, {
        status: todasCorrigidas ? 'finalizada' : 'aguardando_correcao'
      });

      alert('Re-vistoria concluída com sucesso!');
      navigate(createPageUrl(`DetalhesVistoria?id=${vistoriaOriginal.id}`));
    } catch (error) {
      console.error('Erro ao salvar re-vistoria:', error);
      alert('Erro ao salvar re-vistoria');
    } finally {
      setSalvando(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Corrigido':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Não Corrigido':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Parcialmente Corrigido':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vistoriaOriginal || !reVistoria) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Re-vistoria não encontrada</h1>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados da re-vistoria ou da vistoria original.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl(`DetalhesVistoria?id=${vistoriaOriginal.id}`)}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Realizar Re-Vistoria</h1>
            <p className="text-gray-600">{vistoriaOriginal.empreendimento} • {vistoriaOriginal.unidade}</p>
            <Badge className="mt-2">
              Agendada para: {new Date(reVistoria.data_agendada).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {naoConformidades.map((nc, index) => (
              <motion.div
                key={nc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <span>{nc.ambiente} - {nc.item_texto}</span>
                      <Badge variant="outline" className="bg-white text-gray-900">
                        {nc.classificacao}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Coluna Esquerda - Problema Original */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Problema Original:</h4>
                        <p className="text-sm text-gray-700 mb-4">{nc.descricao_problema}</p>
                        
                        {(nc.foto_url_before || nc.foto_url) && (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700">Foto "Antes":</Label>
                            <img 
                              src={nc.foto_url_before || nc.foto_url} 
                              alt="Antes da correção" 
                              className="w-full h-48 object-cover rounded border mt-2"
                            />
                          </div>
                        )}
                      </div>

                      {/* Coluna Direita - Resultado da Re-Vistoria */}
                      <div className="space-y-4">
                        <div>
                          <Label>Status na Re-Vistoria *</Label>
                          <Select
                            value={resultados[nc.id]?.status_na_revistoria}
                            onValueChange={(value) => setResultados(prev => ({
                              ...prev,
                              [nc.id]: { ...prev[nc.id], status_na_revistoria: value }
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Corrigido">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon('Corrigido')}
                                  Corrigido
                                </div>
                              </SelectItem>
                              <SelectItem value="Parcialmente Corrigido">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon('Parcialmente Corrigido')}
                                  Parcialmente Corrigido
                                </div>
                              </SelectItem>
                              <SelectItem value="Não Corrigido">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon('Não Corrigido')}
                                  Não Corrigido
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Observações da Re-Vistoria</Label>
                          <Textarea
                            value={resultados[nc.id]?.observacoes_revistoria}
                            onChange={(e) => setResultados(prev => ({
                              ...prev,
                              [nc.id]: { ...prev[nc.id], observacoes_revistoria: e.target.value }
                            }))}
                            placeholder="Detalhes sobre o estado do reparo..."
                            rows={3}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Foto "Depois" do Reparo</Label>
                          <div className="mt-2">
                            {resultados[nc.id]?.foto_url_after ? (
                              <div>
                                <img 
                                  src={resultados[nc.id].foto_url_after} 
                                  alt="Depois da correção" 
                                  className="w-full h-48 object-cover rounded border mb-2"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setResultados(prev => ({
                                    ...prev,
                                    [nc.id]: { ...prev[nc.id], foto_url_after: null }
                                  }))}
                                >
                                  Remover Foto
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  id={`file-${nc.id}`}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) handleFileUpload(nc.id, file);
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById(`file-${nc.id}`).click()}
                                  disabled={resultados[nc.id]?.uploading}
                                  className="w-full"
                                >
                                  {resultados[nc.id]?.uploading ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                      Enviando...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Anexar Foto Pós-Reparo
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              type="submit"
              disabled={salvando}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Concluir Re-Vistoria
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}