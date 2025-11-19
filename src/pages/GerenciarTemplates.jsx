import { useState, useEffect } from 'react';
import { TemplateVistoria } from '@/entities/TemplateVistoria';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Copy, Edit, Trash2, Home, Building, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function GerenciarTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const [formTemplate, setFormTemplate] = useState({
    nome_template: '',
    tipo_imovel: 'apartamento',
    descricao: '',
    publico: false,
    checklist_padrao: {},
    ambientes_padrao: [],
    tags: []
  });

  useEffect(() => {
    carregarTemplates();
  }, []);

  const carregarTemplates = async () => {
    try {
      const dados = await TemplateVistoria.list('-created_date');
      setTemplates(dados);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNovoTemplate = () => {
    setTemplateSelecionado(null);
    setFormTemplate({
      nome_template: '',
      tipo_imovel: 'apartamento',
      descricao: '',
      publico: false,
      checklist_padrao: getChecklistPadraoTipo('apartamento'),
      ambientes_padrao: getAmbientesPadraoTipo('apartamento'),
      tags: []
    });
    setModalAberto(true);
  };

  const abrirModalEditarTemplate = (template) => {
    setTemplateSelecionado(template);
    setFormTemplate({
      nome_template: template.nome_template,
      tipo_imovel: template.tipo_imovel,
      descricao: template.descricao || '',
      publico: template.publico || false,
      checklist_padrao: template.checklist_padrao,
      ambientes_padrao: template.ambientes_padrao || [],
      tags: template.tags || []
    });
    setModalAberto(true);
  };

  const salvarTemplate = async () => {
    if (!formTemplate.nome_template.trim()) {
      alert('Nome do template é obrigatório');
      return;
    }

    try {
      if (templateSelecionado) {
        await TemplateVistoria.update(templateSelecionado.id, formTemplate);
      } else {
        await TemplateVistoria.create(formTemplate);
      }

      setModalAberto(false);
      carregarTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template');
    }
  };

  const duplicarTemplate = async (template) => {
    try {
      await TemplateVistoria.create({
        ...template,
        nome_template: `${template.nome_template} (Cópia)`,
        publico: false,
        vezes_usado: 0
      });
      carregarTemplates();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
    }
  };

  const excluirTemplate = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await TemplateVistoria.delete(id);
      carregarTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
    }
  };

  const getChecklistPadraoTipo = (tipo) => {
    const checklists = {
      apartamento: {
        'Sala de Estar': [
          { id: 'sala_pintura', texto: 'Pintura das paredes e teto', status: 'pendente', detalhes: null },
          { id: 'sala_piso', texto: 'Piso e acabamentos', status: 'pendente', detalhes: null },
          { id: 'sala_eletrica', texto: 'Pontos elétricos e iluminação', status: 'pendente', detalhes: null }
        ],
        'Cozinha': [
          { id: 'coz_bancada', texto: 'Bancada e cuba', status: 'pendente', detalhes: null },
          { id: 'coz_torneira', texto: 'Torneira e sifão', status: 'pendente', detalhes: null },
          { id: 'coz_gas', texto: 'Ponto de gás', status: 'pendente', detalhes: null }
        ],
        'Banheiro': [
          { id: 'ban_ceramica', texto: 'Revestimento cerâmico', status: 'pendente', detalhes: null },
          { id: 'ban_vaso', texto: 'Vaso sanitário', status: 'pendente', detalhes: null },
          { id: 'ban_chuveiro', texto: 'Chuveiro e registro', status: 'pendente', detalhes: null }
        ]
      },
      casa: {
        'Área Externa': [
          { id: 'ext_fachada', texto: 'Fachada e pintura externa', status: 'pendente', detalhes: null },
          { id: 'ext_jardim', texto: 'Jardim e paisagismo', status: 'pendente', detalhes: null },
          { id: 'ext_portao', texto: 'Portão e cerca', status: 'pendente', detalhes: null }
        ],
        'Garagem': [
          { id: 'gar_piso', texto: 'Piso da garagem', status: 'pendente', detalhes: null },
          { id: 'gar_portao', texto: 'Portão automático', status: 'pendente', detalhes: null }
        ]
      }
    };
    
    return checklists[tipo] || checklists.apartamento;
  };

  const getAmbientesPadraoTipo = (tipo) => {
    const ambientes = {
      apartamento: ['Sala de Estar', 'Cozinha', 'Banheiro', 'Quarto', 'Área de Serviço'],
      casa: ['Sala', 'Cozinha', 'Banheiro', 'Quarto', 'Área Externa', 'Garagem'],
      comercial: ['Recepção', 'Escritório', 'Banheiro', 'Copa', 'Estacionamento'],
      cobertura: ['Sala', 'Cozinha', 'Banheiro', 'Quarto', 'Terraço', 'Churrasqueira']
    };
    
    return ambientes[tipo] || ambientes.apartamento;
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      apartamento: <Building className="w-5 h-5" />,
      casa: <Home className="w-5 h-5" />,
      comercial: <Building className="w-5 h-5" />,
      cobertura: <Building className="w-5 h-5" />
    };
    return icons[tipo] || <Building className="w-5 h-5" />;
  };

  const templatesFiltrados = templates.filter(template => {
    const matchBusca = !busca || template.nome_template.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || template.tipo_imovel === filtroTipo;
    return matchBusca && matchTipo;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
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
              <h1 className="text-3xl font-bold text-gray-900">Templates de Vistoria</h1>
              <p className="text-gray-600">Crie e gerencie modelos para diferentes tipos de imóveis</p>
            </div>
          </div>

          <Button onClick={abrirModalNovoTemplate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Novo Template
          </Button>
        </motion.div>

        {/* Filtros */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar templates..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="cobertura">Cobertura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templatesFiltrados.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTipoIcon(template.tipo_imovel)}
                      <div>
                        <CardTitle className="text-lg">{template.nome_template}</CardTitle>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {template.tipo_imovel}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicarTemplate(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirModalEditarTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => excluirTemplate(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{template.descricao}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ambientes:</span>
                      <span className="font-medium">{template.ambientes_padrao?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usado:</span>
                      <span className="font-medium">{template.vezes_usado || 0}x</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Público:</span>
                      <Badge variant={template.publico ? "default" : "secondary"}>
                        {template.publico ? "Sim" : "Não"}
                      </Badge>
                    </div>
                  </div>

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {templatesFiltrados.length === 0 && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Crie seu primeiro template para acelerar futuras vistorias
              </p>
              <Button onClick={abrirModalNovoTemplate}>
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modal de Template */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {templateSelecionado ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="text-sm font-medium">Nome do Template *</label>
                <Input
                  placeholder="Ex: Apartamento 2 dormitórios"
                  value={formTemplate.nome_template}
                  onChange={(e) => setFormTemplate({...formTemplate, nome_template: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tipo de Imóvel *</label>
                <Select 
                  value={formTemplate.tipo_imovel} 
                  onValueChange={(value) => setFormTemplate({
                    ...formTemplate, 
                    tipo_imovel: value,
                    checklist_padrao: getChecklistPadraoTipo(value),
                    ambientes_padrao: getAmbientesPadraoTipo(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="cobertura">Cobertura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Descreva este template..."
                  value={formTemplate.descricao}
                  onChange={(e) => setFormTemplate({...formTemplate, descricao: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publico"
                  checked={formTemplate.publico}
                  onChange={(e) => setFormTemplate({...formTemplate, publico: e.target.checked})}
                />
                <label htmlFor="publico" className="text-sm font-medium">
                  Template público (outros usuários podem usar)
                </label>
              </div>

              <div>
                <label className="text-sm font-medium">Ambientes Inclusos</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {formTemplate.ambientes_padrao.map(ambiente => (
                    <div key={ambiente} className="p-2 bg-gray-100 rounded text-sm">
                      {ambiente}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarTemplate}>
                Salvar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}