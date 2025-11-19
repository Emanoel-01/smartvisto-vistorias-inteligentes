
import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { ComentarioVistoria } from '@/entities/ComentarioVistoria';
import { PerfilUsuario } from '@/entities/PerfilUsuario';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Download, Camera, Calendar, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { UploadFile } from "@/integrations/Core";

export default function LaudoInterativo() {
  const [vistoria, setVistoria] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [novoComentario, setNovoComentario] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarDados = useCallback(async () => {
    try {
      const [vistoriasData, comentariosData, userData] = await Promise.all([
        Vistoria.list(),
        ComentarioVistoria.filter({ vistoria_id: vistoriaId }, '-created_date'),
        User.me()
      ]);

      const vistoriaEncontrada = vistoriasData.find(v => v.id === vistoriaId);
      setVistoria(vistoriaEncontrada);
      setComentarios(comentariosData);
      setUsuario(userData);

      // Buscar perfil do usuário atual nesta vistoria
      const perfis = await PerfilUsuario.filter({ 
        vistoria_id: vistoriaId, 
        usuario_email: userData.email 
      });
      setPerfilUsuario(perfis[0] || null);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [vistoriaId]); // vistoriaId is used inside carregarDados

  useEffect(() => {
    if (vistoriaId) {
      carregarDados();
    }
  }, [vistoriaId, carregarDados]); // carregarDados is now a dependency as it's called here

  const adicionarComentario = async (itemId = null, ambiente = 'geral') => {
    if (!novoComentario.trim()) return;

    try {
      await ComentarioVistoria.create({
        vistoria_id: vistoriaId,
        item_id: itemId,
        ambiente: ambiente,
        autor_email: usuario.email,
        autor_nome: usuario.full_name,
        tipo_perfil: perfilUsuario?.tipo_perfil || 'vistoriador_principal',
        conteudo: novoComentario,
        tipo_comentario: 'comentario'
      });

      setNovoComentario('');
      carregarDados();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const uploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      
      // Adicionar foto como comentário
      await ComentarioVistoria.create({
        vistoria_id: vistoriaId,
        autor_email: usuario.email,
        autor_nome: usuario.full_name,
        tipo_perfil: perfilUsuario?.tipo_perfil || 'proprietario',
        conteudo: 'Foto anexada',
        tipo_comentario: 'comentario',
        fotos_anexas: [file_url],
        ambiente: 'geral'
      });

      carregarDados();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploadingImage(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      conforme: { color: 'bg-emerald-100 text-emerald-800', label: 'Conforme' },
      nao_conforme: { color: 'bg-red-100 text-red-800', label: 'Não Conforme' },
      nao_aplica: { color: 'bg-gray-100 text-gray-800', label: 'N/A' }
    };

    const config = configs[status] || configs.conforme;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTipoPerfil = (tipo) => {
    const tipos = {
      vistoriador_principal: 'Vistoriador',
      proprietario: 'Proprietário',
      inquilino: 'Inquilino',
      comprador: 'Comprador',
      corretor: 'Corretor',
      imobiliaria: 'Imobiliária',
      reparo_manutencao: 'Manutenção'
    };
    return tipos[tipo] || tipo;
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
          <p className="text-gray-600">Verifique se o link está correto ou entre em contato com o vistoriador.</p>
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
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Laudo Interativo</h1>
          <h2 className="text-xl text-gray-700">{vistoria.empreendimento}</h2>
          <p className="text-gray-600">{vistoria.cliente_nome} • {vistoria.unidade}</p>
          
          {perfilUsuario && (
            <Badge className="mt-2" variant="outline">
              Acesso como: {getTipoPerfil(perfilUsuario.tipo_perfil)}
            </Badge>
          )}
        </motion.div>

        {/* Informações Gerais */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informações da Vistoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="font-semibold text-gray-700">Data da Vistoria:</span>
                <div>{new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Vistoriador:</span>
                <div>{vistoria.vistoriador_nome}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Status:</span>
                <div className="mt-1">
                  <Badge className={
                    vistoria.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' :
                    vistoria.status === 'aguardando_correcao' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {vistoria.status === 'concluida' ? 'Concluída' :
                     vistoria.status === 'aguardando_correcao' ? 'Aguardando Correção' :
                     'Em Andamento'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Problemas Encontrados:</span>
                <div className="mt-1">
                  {vistoria.total_nao_conformidades > 0 ? (
                    <Badge className="bg-red-100 text-red-800">
                      {vistoria.total_nao_conformidades} problema(s)
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      Nenhum problema
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Detalhado */}
        <div className="space-y-6 mb-8">
          {Object.entries(vistoria.checklist_data || {}).map(([ambiente, itens]) => (
            <motion.div
              key={ambiente}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle>{ambiente}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {itens.map((item, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{item.texto}</h4>
                          {getStatusBadge(item.status)}
                        </div>
                        
                        {item.status === 'nao_conforme' && item.detalhes && (
                          <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                              <div>
                                <h5 className="font-medium text-red-800">Problema Identificado</h5>
                                <p className="text-red-700 mt-1">{item.detalhes.observacao}</p>
                              </div>
                            </div>
                            
                            {item.detalhes.foto_url && (
                              <img 
                                src={item.detalhes.foto_url} 
                                alt="Evidência" 
                                className="w-full max-w-md rounded-lg border mt-3"
                              />
                            )}
                          </div>
                        )}

                        {/* Comentários específicos do item */}
                        <div className="mt-4">
                          {comentarios
                            .filter(c => c.item_id === item.id)
                            .map(comentario => (
                            <div key={comentario.id} className="bg-blue-50 p-3 rounded-lg mb-2">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-blue-900">
                                  {comentario.autor_nome}
                                </span>
                                <span className="text-xs text-blue-600">
                                  {new Date(comentario.created_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-blue-800 text-sm">{comentario.conteudo}</p>
                              
                              {comentario.fotos_anexas && comentario.fotos_anexas.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {comentario.fotos_anexas.map((foto, i) => (
                                    <img 
                                      key={i}
                                      src={foto} 
                                      alt="Anexo" 
                                      className="w-24 h-24 object-cover rounded border"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Campo para novo comentário (se tem permissão) */}
                          {perfilUsuario?.permissoes?.comentar && (
                            <div className="flex gap-2 mt-2">
                              <Textarea
                                placeholder="Adicionar comentário sobre este item..."
                                value={novoComentario}
                                onChange={(e) => setNovoComentario(e.target.value)}
                                rows={2}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => adicionarComentario(item.id, ambiente)}
                                className="px-3"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Chat Geral */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Discussão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Lista de comentários gerais */}
            <div className="space-y-4 mb-4">
              {comentarios
                .filter(c => !c.item_id && c.ambiente === 'geral')
                .map(comentario => (
                <div key={comentario.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{comentario.autor_nome}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {getTipoPerfil(comentario.tipo_perfil)}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(comentario.created_date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-gray-700">{comentario.conteudo}</p>
                  
                  {comentario.fotos_anexas && comentario.fotos_anexas.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {comentario.fotos_anexas.map((foto, i) => (
                        <img 
                          key={i}
                          src={foto} 
                          alt="Anexo" 
                          className="w-32 h-32 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {comentarios.filter(c => !c.item_id && c.ambiente === 'geral').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma discussão geral ainda</p>
                </div>
              )}
            </div>

            {/* Formulário de novo comentário */}
            {perfilUsuario?.permissoes?.comentar && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite seu comentário sobre esta vistoria..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => adicionarComentario(null, 'geral')}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                    
                    <label htmlFor="upload-foto" className="cursor-pointer">
                      <Button variant="outline" size="sm" disabled={uploadingImage} asChild>
                        <span>
                          {uploadingImage ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="upload-foto"
                      type="file"
                      accept="image/*"
                      onChange={uploadFoto}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-center gap-4">
          {vistoria.status === 'concluida' && (
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-5 h-5 mr-2" />
              Baixar Laudo PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
