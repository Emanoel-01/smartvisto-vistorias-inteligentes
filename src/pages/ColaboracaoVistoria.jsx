
import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { PerfilUsuario } from '@/entities/PerfilUsuario';
import { ComentarioVistoria } from '@/entities/ComentarioVistoria';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Users, Plus, MessageCircle, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { SendEmail } from "@/integrations/Core";

export default function ColaboracaoVistoria() {
  const [vistoria, setVistoria] = useState(null);
  const [perfisUsuario, setPerfisUsuario] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConvite, setModalConvite] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [ambienteSelecionado, setAmbienteSelecionado] = useState('geral');

  const [formConvite, setFormConvite] = useState({
    email: '',
    nome: '',
    telefone: '',
    tipo_perfil: 'proprietario'
  });

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarDados = useCallback(async () => {
    try {
      const [vistoriasData, perfisData, comentariosData, userData] = await Promise.all([
        Vistoria.list(),
        PerfilUsuario.filter({ vistoria_id: vistoriaId }),
        ComentarioVistoria.filter({ vistoria_id: vistoriaId }, '-created_date'),
        User.me()
      ]);

      const vistoriaEncontrada = vistoriasData.find(v => v.id === vistoriaId);
      setVistoria(vistoriaEncontrada);
      setPerfisUsuario(perfisData);
      setComentarios(comentariosData);
      setUsuario(userData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [vistoriaId]);

  useEffect(() => {
    if (vistoriaId) {
      carregarDados();
    }
  }, [vistoriaId, carregarDados]);

  const convidarUsuario = async () => {
    if (!formConvite.email || !formConvite.nome) {
      alert('Email e nome são obrigatórios');
      return;
    }

    try {
      const permissoes = getPermissoesPorPerfil(formConvite.tipo_perfil);
      
      await PerfilUsuario.create({
        vistoria_id: vistoriaId,
        usuario_email: formConvite.email,
        nome_usuario: formConvite.nome,
        telefone: formConvite.telefone,
        tipo_perfil: formConvite.tipo_perfil,
        permissoes,
        data_convite: new Date().toISOString()
      });

      // Enviar email de convite
      const linkVistoria = `${window.location.origin}${createPageUrl('LaudoInterativo')}?id=${vistoriaId}`;
      
      await SendEmail({
        to: formConvite.email,
        subject: `Convite para colaborar na vistoria - ${vistoria.empreendimento}`,
        body: `
          <h2>Você foi convidado para colaborar em uma vistoria</h2>
          <p>Olá ${formConvite.nome},</p>
          <p>Você foi convidado para colaborar na vistoria do imóvel <strong>${vistoria.empreendimento}</strong>.</p>
          <p><strong>Perfil:</strong> ${getTipoPerfil(formConvite.tipo_perfil)}</p>
          <p><a href="${linkVistoria}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Vistoria</a></p>
          <p>Atenciosamente,<br>Equipe SmartVisto</p>
        `
      });

      setModalConvite(false);
      setFormConvite({ email: '', nome: '', telefone: '', tipo_perfil: 'proprietario' });
      carregarDados();
      alert('Convite enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      alert('Erro ao enviar convite');
    }
  };

  const adicionarComentario = async () => {
    if (!novoComentario.trim()) return;

    try {
      await ComentarioVistoria.create({
        vistoria_id: vistoriaId,
        ambiente: ambienteSelecionado,
        autor_email: usuario.email,
        autor_nome: usuario.full_name,
        tipo_perfil: 'vistoriador_principal', // Determinar dinamicamente
        conteudo: novoComentario,
        tipo_comentario: 'comentario'
      });

      setNovoComentario('');
      carregarDados();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const getPermissoesPorPerfil = (tipoPerfil) => {
    const permissoes = {
      vistoriador_principal: { visualizar: true, comentar: true, editar: true, aprovar_reparos: true, marcar_concluido: true },
      proprietario: { visualizar: true, comentar: true, editar: false, aprovar_reparos: true, marcar_concluido: false },
      inquilino: { visualizar: true, comentar: true, editar: false, aprovar_reparos: false, marcar_concluido: false },
      comprador: { visualizar: true, comentar: true, editar: false, aprovar_reparos: true, marcar_concluido: false },
      corretor: { visualizar: true, comentar: false, editar: false, aprovar_reparos: false, marcar_concluido: false },
      imobiliaria: { visualizar: true, comentar: false, editar: false, aprovar_reparos: false, marcar_concluido: false },
      reparo_manutencao: { visualizar: true, comentar: true, editar: false, aprovar_reparos: false, marcar_concluido: true }
    };
    return permissoes[tipoPerfil] || permissoes.proprietario;
  };

  const getTipoPerfil = (tipo) => {
    const tipos = {
      vistoriador_principal: 'Vistoriador Principal',
      proprietario: 'Proprietário',
      inquilino: 'Inquilino', 
      comprador: 'Comprador',
      corretor: 'Corretor',
      imobiliaria: 'Imobiliária',
      reparo_manutencao: 'Reparo/Manutenção'
    };
    return tipos[tipo] || tipo;
  };

  const getStatusBadge = (status) => {
    const configs = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-3 h-3" /> },
      aceito: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
      recusado: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> }
    };
    
    const config = configs[status] || configs.pendente;
    return (
      <Badge className={config.color}>
        {config.icon}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Colaboração na Vistoria</h1>
              <p className="text-gray-600">{vistoria?.empreendimento} • {vistoria?.cliente_nome}</p>
            </div>
          </div>

          <Button onClick={() => setModalConvite(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Convidar Colaborador
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Perfis e Colaboradores */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Colaboradores ({perfisUsuario.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {perfisUsuario.map((perfil, index) => (
                  <motion.div
                    key={perfil.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{perfil.nome_usuario}</h4>
                      <p className="text-sm text-gray-600">{perfil.usuario_email}</p>
                      <p className="text-sm text-blue-600">{getTipoPerfil(perfil.tipo_perfil)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(perfil.status_convite)}
                      <p className="text-xs text-gray-500">
                        {new Date(perfil.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {perfisUsuario.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Nenhum colaborador convidado ainda</p>
                    <p className="text-sm">Comece convidando pessoas para colaborar nesta vistoria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat e Comentários */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comunicação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Seletor de ambiente */}
                <div className="mb-4">
                  <Select value={ambienteSelecionado} onValueChange={setAmbienteSelecionado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Discussão Geral</SelectItem>
                      {vistoria?.checklist_data && Object.keys(vistoria.checklist_data).map(ambiente => (
                        <SelectItem key={ambiente} value={ambiente}>{ambiente}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de comentários */}
                <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                  {comentarios
                    .filter(c => c.ambiente === ambienteSelecionado || (ambienteSelecionado === 'geral' && !c.ambiente))
                    .map((comentario, index) => (
                    <motion.div
                      key={comentario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-sm text-gray-900">
                            {comentario.autor_nome}
                          </span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {getTipoPerfil(comentario.tipo_perfil)}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(comentario.created_date).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comentario.conteudo}</p>
                    </motion.div>
                  ))}

                  {comentarios.filter(c => c.ambiente === ambienteSelecionado || (ambienteSelecionado === 'geral' && !c.ambiente)).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma discussão ainda</p>
                    </div>
                  )}
                </div>

                {/* Campo de novo comentário */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite seu comentário..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <Button onClick={adicionarComentario} size="sm" className="px-3">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Modal de Convite */}
        <Dialog open={modalConvite} onOpenChange={setModalConvite}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formConvite.email}
                  onChange={(e) => setFormConvite({...formConvite, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nome Completo *</label>
                <Input
                  placeholder="Nome da pessoa"
                  value={formConvite.nome}
                  onChange={(e) => setFormConvite({...formConvite, nome: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={formConvite.telefone}
                  onChange={(e) => setFormConvite({...formConvite, telefone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Perfil *</label>
                <Select value={formConvite.tipo_perfil} onValueChange={(value) => setFormConvite({...formConvite, tipo_perfil: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proprietario">Proprietário</SelectItem>
                    <SelectItem value="inquilino">Inquilino</SelectItem>
                    <SelectItem value="comprador">Comprador</SelectItem>
                    <SelectItem value="corretor">Corretor</SelectItem>
                    <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                    <SelectItem value="reparo_manutencao">Reparo/Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalConvite(false)}>
                Cancelar
              </Button>
              <Button onClick={convidarUsuario}>
                Enviar Convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
