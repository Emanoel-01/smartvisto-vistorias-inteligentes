import { useState, useEffect } from 'react';
import { GuiaVistoria } from '@/entities/GuiaVistoria';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Search, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GerenciarGuias() {
  const [guias, setGuias] = useState([]);
  const [filtros, setFiltros] = useState({ busca: '', categoria: 'todos' });
  const [modalAberto, setModalAberto] = useState(false);
  const [guiaEditando, setGuiaEditando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    subtitulo: '',
    categoria: 'Técnicas Manuais',
    ambiente_aplicavel: [],
    conteudo_html: '',
    equipamentos_necessarios: [],
    url_midia_1: '',
    url_midia_2: '',
    referencia_norma: '',
    metodologia: '',
    base_legal: '',
    tipo_vicio: ''
  });

  useEffect(() => {
    carregarGuias();
  }, []);

  const carregarGuias = async () => {
    try {
      const dados = await GuiaVistoria.list('-created_date');
      setGuias(dados);
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
    } finally {
      setLoading(false);
    }
  };

  const guiasFiltrados = guias.filter(guia => {
    const matchBusca = !filtros.busca || 
      guia.titulo.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      (guia.subtitulo && guia.subtitulo.toLowerCase().includes(filtros.busca.toLowerCase()));
    
    const matchCategoria = filtros.categoria === 'todos' || guia.categoria === filtros.categoria;
    
    return matchBusca && matchCategoria;
  });

  const verificarTituloExistente = async (titulo, guiaIdAtual = null) => {
    const guiaExistente = guias.find(g => 
      g.titulo.toLowerCase() === titulo.toLowerCase() && g.id !== guiaIdAtual
    );
    return !!guiaExistente;
  };

  const abrirModal = (guia = null) => {
    if (guia) {
      setGuiaEditando(guia);
      setFormData({
        titulo: guia.titulo,
        subtitulo: guia.subtitulo || '',
        categoria: guia.categoria,
        ambiente_aplicavel: guia.ambiente_aplicavel || [],
        conteudo_html: guia.conteudo_html,
        equipamentos_necessarios: guia.equipamentos_necessarios || [],
        url_midia_1: guia.url_midia_1 || '',
        url_midia_2: guia.url_midia_2 || '',
        referencia_norma: guia.referencia_norma || '',
        metodologia: guia.metodologia || '',
        base_legal: guia.base_legal || '',
        tipo_vicio: guia.tipo_vicio || ''
      });
    } else {
      setGuiaEditando(null);
      setFormData({
        titulo: '',
        subtitulo: '',
        categoria: 'Técnicas Manuais',
        ambiente_aplicavel: [],
        conteudo_html: '',
        equipamentos_necessarios: [],
        url_midia_1: '',
        url_midia_2: '',
        referencia_norma: '',
        metodologia: '',
        base_legal: '',
        tipo_vicio: ''
      });
    }
    setErro('');
    setModalAberto(true);
  };

  const salvarGuia = async () => {
    if (!formData.titulo || !formData.conteudo_html) {
      setErro('Título e conteúdo são obrigatórios');
      return;
    }

    const tituloExiste = await verificarTituloExistente(formData.titulo, guiaEditando?.id);
    if (tituloExiste) {
      setErro('Já existe um guia com este título. Por favor, escolha outro nome ou edite o guia existente.');
      return;
    }

    try {
      if (guiaEditando) {
        await GuiaVistoria.update(guiaEditando.id, formData);
      } else {
        await GuiaVistoria.create(formData);
      }
      
      await carregarGuias();
      setModalAberto(false);
      setErro('');
    } catch (error) {
      console.error('Erro ao salvar guia:', error);
      setErro('Erro ao salvar guia. Tente novamente.');
    }
  };

  const excluirGuia = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este guia?')) return;

    try {
      await GuiaVistoria.delete(id);
      await carregarGuias();
    } catch (error) {
      console.error('Erro ao excluir guia:', error);
      alert('Erro ao excluir guia');
    }
  };

  const handleArrayInput = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: array }));
  };

  const getCategoriaColor = (categoria) => {
    const cores = {
      'Técnicas Manuais': 'bg-blue-100 text-blue-800',
      'Equipamentos Essenciais': 'bg-emerald-100 text-emerald-800',
      'Tecnologias 4.0': 'bg-purple-100 text-purple-800',
      'Boas Práticas Gerais': 'bg-amber-100 text-amber-800',
      'Normas Técnicas': 'bg-red-100 text-red-800'
    };
    return cores[categoria] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>)}
            </div>
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-blue-600" />
                Guia do Vistoriador
              </h1>
              <p className="text-gray-600">Base de conhecimento técnico e pericial consolidada</p>
            </div>
          </div>

          <Button onClick={() => abrirModal()} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Nova Técnica Pericial
          </Button>
        </motion.div>

        {/* Alerta de Consolidação */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Guia Consolidado:</strong> Cada técnica possui um único registro com metodologia completa, referências normativas e diferenciação entre vícios aparentes e ocultos.
          </AlertDescription>
        </Alert>

        {/* Filtros */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Buscar Técnica</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome da técnica, equipamento ou norma..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-64">
                <Label>Categoria</Label>
                <Select 
                  value={filtros.categoria}
                  onValueChange={(value) => setFiltros({...filtros, categoria: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Categorias</SelectItem>
                    <SelectItem value="Técnicas Manuais">Técnicas Manuais</SelectItem>
                    <SelectItem value="Equipamentos Essenciais">Equipamentos Essenciais</SelectItem>
                    <SelectItem value="Tecnologias 4.0">Tecnologias 4.0</SelectItem>
                    <SelectItem value="Boas Práticas Gerais">Boas Práticas Gerais</SelectItem>
                    <SelectItem value="Normas Técnicas">Normas Técnicas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Guias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {guiasFiltrados.map((guia, index) => (
              <motion.div
                key={guia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getCategoriaColor(guia.categoria)}>
                        {guia.categoria}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => abrirModal(guia)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => excluirGuia(guia.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{guia.titulo}</CardTitle>
                    {guia.subtitulo && (
                      <p className="text-sm text-gray-600">{guia.subtitulo}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {guia.ambiente_aplicavel && guia.ambiente_aplicavel.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Ambientes:</p>
                        <div className="flex flex-wrap gap-1">
                          {guia.ambiente_aplicavel.map((amb, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{amb}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {guia.equipamentos_necessarios && guia.equipamentos_necessarios.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Equipamentos:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {guia.equipamentos_necessarios.slice(0, 2).map((eq, i) => (
                            <li key={i}>{eq}</li>
                          ))}
                          {guia.equipamentos_necessarios.length > 2 && (
                            <li className="text-blue-600">+{guia.equipamentos_necessarios.length - 2} mais...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {guia.referencia_norma && (
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                          📋 {guia.referencia_norma}
                        </Badge>
                      </div>
                    )}

                    {guia.tipo_vicio && (
                      <div className="mt-3 pt-3 border-t">
                        <Badge variant="outline" className="text-xs">
                          {guia.tipo_vicio === 'aparente' ? '👁️ Vício Aparente (90 dias)' : '🔍 Vício Oculto (90 dias após descoberta)'}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {guiasFiltrados.length === 0 && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum guia encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Crie seu primeiro guia para começar a documentar técnicas periciais.
              </p>
              <Button onClick={() => abrirModal()} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Técnica
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modal de Edição/Criação */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{guiaEditando ? 'Editar Técnica Pericial' : 'Nova Técnica Pericial'}</DialogTitle>
            </DialogHeader>
            
            {erro && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{erro}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título da Técnica *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Teste da Bola de Gude para Caimento de Piso"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use um nome único e descritivo</p>
                </div>
                
                <div>
                  <Label>Categoria *</Label>
                  <Select 
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({...formData, categoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Técnicas Manuais">Técnicas Manuais</SelectItem>
                      <SelectItem value="Equipamentos Essenciais">Equipamentos Essenciais</SelectItem>
                      <SelectItem value="Tecnologias 4.0">Tecnologias 4.0</SelectItem>
                      <SelectItem value="Boas Práticas Gerais">Boas Práticas Gerais</SelectItem>
                      <SelectItem value="Normas Técnicas">Normas Técnicas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Objetivo da Técnica</Label>
                <Input
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({...formData, subtitulo: e.target.value})}
                  placeholder="Ex: Verificar o caimento adequado do piso para escoamento de água"
                />
              </div>

              <div>
                <Label>Metodologia Completa *</Label>
                <Textarea
                  value={formData.metodologia}
                  onChange={(e) => setFormData({...formData, metodologia: e.target.value})}
                  placeholder="Descreva passo a passo como executar a técnica..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">Explique "o que" e "como" fazer o teste de forma clara</p>
              </div>

              <div>
                <Label>Conteúdo Detalhado (HTML) *</Label>
                <Textarea
                  value={formData.conteudo_html}
                  onChange={(e) => setFormData({...formData, conteudo_html: e.target.value})}
                  placeholder="Conteúdo completo com formatação HTML..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Referência Normativa</Label>
                  <Input
                    value={formData.referencia_norma}
                    onChange={(e) => setFormData({...formData, referencia_norma: e.target.value})}
                    placeholder="Ex: NBR 15575-3 e NBR 15575-6"
                  />
                  <p className="text-xs text-gray-500 mt-1">NBR, artigos de lei, etc.</p>
                </div>

                <div>
                  <Label>Base Legal / Artigo</Label>
                  <Input
                    value={formData.base_legal}
                    onChange={(e) => setFormData({...formData, base_legal: e.target.value})}
                    placeholder="Ex: CDC Art. 26, II - Vícios Aparentes"
                  />
                </div>
              </div>

              <div>
                <Label>Tipo de Vício Identificável</Label>
                <Select 
                  value={formData.tipo_vicio}
                  onValueChange={(value) => setFormData({...formData, tipo_vicio: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de vício" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Não especificado</SelectItem>
                    <SelectItem value="aparente">Vício Aparente (visível na entrega - 90 dias)</SelectItem>
                    <SelectItem value="oculto">Vício Oculto (se manifesta com o tempo - 90 dias após descoberta)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Ajuda na classificação legal do problema</p>
              </div>

              <div>
                <Label>Ambientes Aplicáveis (separados por vírgula)</Label>
                <Input
                  value={formData.ambiente_aplicavel.join(', ')}
                  onChange={(e) => handleArrayInput('ambiente_aplicavel', e.target.value)}
                  placeholder="Ex: Banheiro, Cozinha, Varanda, Área de Serviço"
                />
              </div>

              <div>
                <Label>Equipamentos Necessários (separados por vírgula)</Label>
                <Input
                  value={formData.equipamentos_necessarios.join(', ')}
                  onChange={(e) => handleArrayInput('equipamentos_necessarios', e.target.value)}
                  placeholder="Ex: Bola de gude, Nível a laser, Trena"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>URL Mídia 1 (Foto ou Vídeo)</Label>
                  <Input
                    value={formData.url_midia_1}
                    onChange={(e) => setFormData({...formData, url_midia_1: e.target.value})}
                    placeholder="URL de imagem ou vídeo demonstrativo"
                  />
                </div>
                
                <div>
                  <Label>URL Mídia 2 (Complementar)</Label>
                  <Input
                    value={formData.url_midia_2}
                    onChange={(e) => setFormData({...formData, url_midia_2: e.target.value})}
                    placeholder="URL de mídia adicional"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarGuia} className="bg-blue-600 hover:bg-blue-700">
                {guiaEditando ? 'Atualizar' : 'Criar'} Técnica
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}