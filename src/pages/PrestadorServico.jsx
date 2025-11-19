import { useState, useEffect } from 'react';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { Vistoria } from '@/entities/Vistoria';
import { PerfilUsuario } from '@/entities/PerfilUsuario';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, CheckCircle, Clock, AlertTriangle, Image as ImageIcon, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile } from "@/integrations/Core";

export default function PrestadorServico() {
  const [usuario, setUsuario] = useState(null);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [vistoriasMap, setVistoriasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [atualizandoNC, setAtualizandoNC] = useState(null);
  const [fotoUpload, setFotoUpload] = useState(null);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const user = await User.me();
      setUsuario(user);

      // Buscar perfis do usuário como prestador de serviço
      const perfis = await PerfilUsuario.filter({ 
        usuario_email: user.email,
        tipo_perfil: 'reparo_manutencao'
      });

      if (perfis.length === 0) {
        setNaoConformidades([]);
        setLoading(false);
        return;
      }

      // Buscar não conformidades das vistorias onde o usuário é prestador
      const vistoriaIds = perfis.map(p => p.vistoria_id);
      const todasNC = await NaoConformidade.list('-created_date');
      
      // Filtrar apenas NCs pendentes ou em correção das vistorias do prestador
      const ncsRelevantes = todasNC.filter(nc => 
        vistoriaIds.includes(nc.vistoria_id) && 
        (nc.status === 'pendente' || nc.status === 'em_correcao')
      );

      setNaoConformidades(ncsRelevantes);

      // Buscar dados das vistorias
      const vistorias = await Vistoria.filter({ 
        id: { $in: vistoriaIds } 
      });
      
      const map = {};
      vistorias.forEach(v => {
        map[v.id] = v;
      });
      setVistoriasMap(map);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarCorrecao = async (nc) => {
    try {
      await NaoConformidade.update(nc.id, {
        status: 'em_correcao',
        responsavel_correcao: usuario.full_name,
        data_inicio_correcao: new Date().toISOString()
      });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao iniciar correção:', error);
      alert('Erro ao iniciar correção');
    }
  };

  const handleFotoUpload = async (e, ncId) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await UploadFile({ file });
      setFotoUpload({ ncId, url: file_url });
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da foto');
    }
  };

  const marcarComoCorrigido = async (nc) => {
    if (!fotoUpload || fotoUpload.ncId !== nc.id) {
      alert('Por favor, anexe uma foto do reparo concluído');
      return;
    }

    try {
      await NaoConformidade.update(nc.id, {
        status: 'corrigido',
        foto_url_after: fotoUpload.url,
        observacoes_correcao: observacoes,
        data_correcao: new Date().toISOString(),
        responsavel_correcao: usuario.full_name
      });

      setFotoUpload(null);
      setObservacoes('');
      setAtualizandoNC(null);
      await carregarDados();
      alert('Correção registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar como corrigido:', error);
      alert('Erro ao registrar correção');
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">Minhas Correções</h1>
            <p className="text-gray-600">Gerencie as não conformidades sob sua responsabilidade</p>
          </div>
        </motion.div>

        {naoConformidades.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhuma correção pendente
              </h3>
              <p className="text-gray-500">
                Você não possui não conformidades para corrigir no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {naoConformidades.map((nc, index) => {
                const vistoria = vistoriasMap[nc.vistoria_id];
                
                return (
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
                            {vistoria && (
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Imóvel:</strong> {vistoria.empreendimento} - {vistoria.unidade}
                              </p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              {getStatusBadge(nc.status)}
                              <Badge variant="outline" className="capitalize">
                                {nc.classificacao || 'leve'}
                              </Badge>
                              {nc.garantia_aplicavel && (
                                <Badge variant="outline" className="text-blue-700 border-blue-300">
                                  {nc.garantia_aplicavel.replace('legal_', '').replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Problema */}
                        <div>
                          <Label className="font-semibold">Descrição do Problema:</Label>
                          <p className="text-sm text-gray-700 mt-1">{nc.descricao_problema}</p>
                        </div>

                        {/* Foto Before */}
                        {(nc.foto_url || nc.foto_url_before) && (
                          <div>
                            <Label className="font-semibold">Evidência do Problema:</Label>
                            <div className="mt-2">
                              <img 
                                src={nc.foto_url || nc.foto_url_before} 
                                alt="Evidência" 
                                className="max-w-sm h-48 object-cover rounded border"
                              />
                              {nc.geolocalizacao && (
                                <Badge variant="outline" className="mt-2 text-gray-600">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  GPS: {nc.geolocalizacao.latitude.toFixed(6)}, {nc.geolocalizacao.longitude.toFixed(6)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sugestão de Correção */}
                        {nc.sugestao_correcao && (
                          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
                            <Label className="font-semibold text-emerald-900">Procedimento Sugerido:</Label>
                            <pre className="text-sm text-emerald-800 mt-1 whitespace-pre-wrap font-sans">
                              {nc.sugestao_correcao}
                            </pre>
                          </div>
                        )}

                        {/* Ações */}
                        {nc.status === 'pendente' && (
                          <Button 
                            onClick={() => iniciarCorrecao(nc)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Iniciar Correção
                          </Button>
                        )}

                        {nc.status === 'em_correcao' && (
                          <div className="space-y-4 border-t pt-4">
                            <div>
                              <Label className="font-semibold">Registrar Correção Concluída</Label>
                              
                              <div className="mt-3 space-y-3">
                                <div>
                                  <Label htmlFor={`foto-${nc.id}`} className="text-sm">
                                    Foto do Reparo Concluído *
                                  </Label>
                                  <div className="flex items-center gap-3 mt-1">
                                    <input
                                      type="file"
                                      id={`foto-${nc.id}`}
                                      className="hidden"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={(e) => handleFotoUpload(e, nc.id)}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById(`foto-${nc.id}`).click()}
                                    >
                                      <Upload className="w-4 h-4 mr-2" />
                                      {fotoUpload && fotoUpload.ncId === nc.id ? 'Trocar Foto' : 'Capturar Foto'}
                                    </Button>
                                    {fotoUpload && fotoUpload.ncId === nc.id && (
                                      <Badge className="bg-green-100 text-green-800">
                                        <ImageIcon className="w-3 h-3 mr-1" />
                                        Foto anexada
                                      </Badge>
                                    )}
                                  </div>
                                  {fotoUpload && fotoUpload.ncId === nc.id && (
                                    <div className="mt-2">
                                      <img 
                                        src={fotoUpload.url} 
                                        alt="Reparo" 
                                        className="max-w-xs h-40 object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label htmlFor={`obs-${nc.id}`} className="text-sm">
                                    Observações sobre a Correção (Opcional)
                                  </Label>
                                  <Textarea
                                    id={`obs-${nc.id}`}
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Descreva os procedimentos realizados, materiais utilizados, etc."
                                    rows={3}
                                    className="mt-1"
                                  />
                                </div>

                                <Button 
                                  onClick={() => marcarComoCorrigido(nc)}
                                  disabled={!fotoUpload || fotoUpload.ncId !== nc.id}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Corrigido
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}