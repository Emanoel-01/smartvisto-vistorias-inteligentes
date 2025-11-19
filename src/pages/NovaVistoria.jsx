import { useState, useEffect } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { PerfilUsuario } from '@/entities/PerfilUsuario';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, User as UserIcon, Building, Briefcase, Users, X, Plus, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NovaVistoria() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  
  const [formData, setFormData] = useState({
    empreendimento: '',
    unidade: '',
    endereco: '',
    cliente_nome: '',
    cliente_cpf: '',
    vistoriador_nome: '',
    art_rrt_profissional: '',
    data_vistoria: new Date().toISOString().split('T')[0],
    tipo_vistoria: 'Recebimento de Imóvel Novo'
  });

  const [envolvidos, setEnvolvidos] = useState([]);
  const [novoEnvolvido, setNovoEnvolvido] = useState({
    nome_usuario: '',
    usuario_email: '',
    telefone: '',
    tipo_perfil: 'proprietario',
    permissoes: {
      visualizar: true,
      comentar: true,
      editar: false,
      aprovar_reparos: false,
      marcar_concluido: false
    }
  });

  useEffect(() => {
    carregarUsuario();
  }, []);

  const carregarUsuario = async () => {
    try {
      const user = await User.me();
      setUsuario(user);
      setFormData(prev => ({
        ...prev,
        vistoriador_nome: user.full_name || ''
      }));
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTipoPerfilLabel = (tipo) => {
    const labels = {
      'proprietario': 'Proprietário',
      'inquilino': 'Inquilino',
      'comprador': 'Comprador',
      'corretor': 'Corretor',
      'imobiliaria': 'Imobiliária',
      'reparo_manutencao': 'Prestador de Serviço',
      'construtora': 'Construtora'
    };
    return labels[tipo] || tipo;
  };

  const adicionarEnvolvido = () => {
    if (!novoEnvolvido.nome_usuario || !novoEnvolvido.usuario_email) {
      alert('Nome e e-mail são obrigatórios');
      return;
    }

    setEnvolvidos(prev => [...prev, { ...novoEnvolvido, id: Date.now() }]);
    setNovoEnvolvido({
      nome_usuario: '',
      usuario_email: '',
      telefone: '',
      tipo_perfil: 'proprietario',
      permissoes: {
        visualizar: true,
        comentar: true,
        editar: false,
        aprovar_reparos: false,
        marcar_concluido: false
      }
    });
  };

  const removerEnvolvido = (id) => {
    setEnvolvidos(prev => prev.filter(e => e.id !== id));
  };

  const handlePermissaoChange = (permissao, checked) => {
    setNovoEnvolvido(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [permissao]: checked
      }
    }));
  };

  const gerarChecklistInteligente = (tipoVistoria) => {
    const templates = {
      'Recebimento de Imóvel Novo': {
        'Geral / Entrada': [
          { id: 'limpeza_geral', texto: 'Limpeza Geral: Apartamento entregue limpo e sem resíduos de obra', status: 'pendente', detalhes: null },
          { id: 'porta_entrada', texto: 'Porta de Entrada: Verificar alinhamento, fechadura, maçaneta, olho mágico', status: 'pendente', detalhes: null },
          { id: 'pintura_geral', texto: 'Pintura Geral: Paredes e tetos uniformes, sem manchas', status: 'pendente', detalhes: null },
          { id: 'piso_geral', texto: 'Piso Geral: Revestimento sem riscos, manchas ou peças soltas', status: 'pendente', detalhes: null },
          { id: 'rodapes', texto: 'Rodapés: Alinhamento, fixação e acabamento', status: 'pendente', detalhes: null }
        ],
        'Sala de Estar / Jantar': [
          { id: 'pintura_sala', texto: 'Pintura e acabamento das paredes e teto', status: 'pendente', detalhes: null },
          { id: 'piso_sala', texto: 'Nivelamento, rejunte e ausência de avarias no piso', status: 'pendente', detalhes: null },
          { id: 'tomadas_sala', texto: 'Tomadas e Interruptores: Testar funcionamento', status: 'pendente', detalhes: null },
          { id: 'janelas_sala', texto: 'Janelas: Abertura, fechamento, travas e vedação', status: 'pendente', detalhes: null }
        ],
        'Cozinha': [
          { id: 'revestimento_cozinha', texto: 'Revestimento cerâmico e pintura sem avarias', status: 'pendente', detalhes: null },
          { id: 'torneira_pia', texto: 'Torneira da Pia: Testar funcionamento e pressão', status: 'pendente', detalhes: null },
          { id: 'bancada_cuba', texto: 'Bancada e Cuba: Ausência de riscos, trincas ou manchas', status: 'pendente', detalhes: null },
          { id: 'ponto_gas', texto: 'Ponto de gás: Verificar registro e acabamento', status: 'pendente', detalhes: null }
        ],
        'Banheiro Social': [
          { id: 'revestimento_banheiro', texto: 'Revestimento cerâmico sem peças trincadas ou soltas', status: 'pendente', detalhes: null },
          { id: 'vaso_sanitario', texto: 'Vaso Sanitário: Acionamento, vedação e fixação', status: 'pendente', detalhes: null },
          { id: 'pia_lavatorio', texto: 'Pia/Lavatório: Testar torneira e sifão', status: 'pendente', detalhes: null },
          { id: 'chuveiro', texto: 'Chuveiro/Ducha: Testar saída de água', status: 'pendente', detalhes: null }
        ]
      },
      'Aluguel - Entrada': {
        'Geral': [
          { id: 'estado_pintura', texto: 'Estado Geral da Pintura: Verificar manchas, descascamento', status: 'pendente', detalhes: null },
          { id: 'estado_piso', texto: 'Estado do Piso: Verificar riscos, manchas, peças soltas', status: 'pendente', detalhes: null },
          { id: 'portas_janelas', texto: 'Portas e Janelas: Funcionamento, travas, vidros', status: 'pendente', detalhes: null }
        ],
        'Cozinha / Área de Serviço': [
          { id: 'torneiras', texto: 'Torneiras: Funcionamento e vazamentos', status: 'pendente', detalhes: null },
          { id: 'pia_cuba', texto: 'Pia/Cuba: Estado de conservação', status: 'pendente', detalhes: null }
        ],
        'Banheiro': [
          { id: 'vaso_chuveiro', texto: 'Vaso e Chuveiro: Funcionamento', status: 'pendente', detalhes: null },
          { id: 'revestimentos', texto: 'Revestimentos: Estado de conservação', status: 'pendente', detalhes: null }
        ]
      },
      'Aluguel - Saída': {
        'Geral': [
          { id: 'limpeza', texto: 'Limpeza Geral do Imóvel', status: 'pendente', detalhes: null },
          { id: 'danos_pintura', texto: 'Danos na Pintura: Identificar furos, manchas', status: 'pendente', detalhes: null },
          { id: 'danos_piso', texto: 'Danos no Piso: Riscos, manchas, quebras', status: 'pendente', detalhes: null }
        ],
        'Móveis e Equipamentos': [
          { id: 'moveis_danificados', texto: 'Móveis Danificados ou Faltantes', status: 'pendente', detalhes: null },
          { id: 'eletrodomesticos', texto: 'Eletrodomésticos: Funcionamento', status: 'pendente', detalhes: null }
        ]
      },
      'Comercial': {
        'Estrutura': [
          { id: 'estrutura_geral', texto: 'Estado da Estrutura: Paredes, teto, piso', status: 'pendente', detalhes: null },
          { id: 'instalacoes_eletricas', texto: 'Instalações Elétricas: Quadro, tomadas, iluminação', status: 'pendente', detalhes: null }
        ],
        'Instalações': [
          { id: 'banheiros', texto: 'Banheiros: Funcionamento e conservação', status: 'pendente', detalhes: null },
          { id: 'ar_condicionado', texto: 'Ar Condicionado: Funcionamento', status: 'pendente', detalhes: null }
        ]
      }
    };

    return templates[tipoVistoria] || templates['Recebimento de Imóvel Novo'];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.empreendimento.trim() || !formData.cliente_nome.trim()) {
      alert('Por favor, preencha pelo menos o empreendimento e nome do cliente');
      return;
    }

    setLoading(true);
    try {
      const checklistPadrao = gerarChecklistInteligente(formData.tipo_vistoria);
      const totalItens = Object.values(checklistPadrao).reduce((acc, items) => acc + items.length, 0);

      const novaVistoria = await Vistoria.create({
        ...formData,
        checklist_data: checklistPadrao,
        status: 'em_andamento',
        total_itens_vistoriados: totalItens,
        total_nao_conformidades: 0
      });

      // Criar perfis de usuário para os envolvidos
      for (const envolvido of envolvidos) {
        await PerfilUsuario.create({
          vistoria_id: novaVistoria.id,
          usuario_email: envolvido.usuario_email,
          nome_usuario: envolvido.nome_usuario,
          tipo_perfil: envolvido.tipo_perfil,
          telefone: envolvido.telefone || '',
          permissoes: envolvido.permissoes,
          status_convite: 'pendente',
          data_convite: new Date().toISOString()
        });
      }

      // Redirecionar para a página de edição com mensagem de sucesso
      navigate(createPageUrl(`EditarVistoria?id=${novaVistoria.id}`));
      
      // Se houver envolvidos, mostrar instruções para compartilhar
      if (envolvidos.length > 0) {
        setTimeout(() => {
          alert(`Vistoria criada com sucesso!\n\nPara compartilhar com os envolvidos, vá até "Ver Histórico" e use o botão "Compartilhar Laudo" para enviar o link por WhatsApp ou copiar o link.`);
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao criar vistoria:', error);
      alert('Erro ao criar vistoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressoPercentual = () => {
    if (!formData.empreendimento || !formData.cliente_nome) return 0;
    
    let campos = 0;
    let preenchidos = 0;
    
    Object.keys(formData).forEach(key => {
      campos++;
      if (formData[key]) preenchidos++;
    });
    
    return Math.round((preenchidos / campos) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">Nova Vistoria</h1>
            <p className="text-gray-600">Preencha os dados para iniciar uma nova vistoria</p>
          </div>
        </motion.div>

        {envolvidos.length > 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <strong>Compartilhamento:</strong> Após criar a vistoria, você poderá compartilhar o link do laudo com os envolvidos através do botão "Compartilhar" na página de detalhes.
            </AlertDescription>
          </Alert>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Tipo de Vistoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Label htmlFor="tipo_vistoria" className="text-base font-medium">
                Selecione o Tipo de Vistoria
              </Label>
              <Select
                value={formData.tipo_vistoria}
                onValueChange={(value) => handleInputChange('tipo_vistoria', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebimento de Imóvel Novo">Recebimento de Imóvel Novo</SelectItem>
                  <SelectItem value="Aluguel - Entrada">Aluguel - Entrada</SelectItem>
                  <SelectItem value="Aluguel - Saída">Aluguel - Saída</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-2">
                O checklist será gerado automaticamente de acordo com o tipo selecionado
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Dados do Imóvel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="empreendimento" className="text-base font-medium">
                    Nome do Empreendimento/Condomínio *
                  </Label>
                  <Input
                    id="empreendimento"
                    value={formData.empreendimento}
                    onChange={(e) => handleInputChange('empreendimento', e.target.value)}
                    placeholder="Ex: Residencial Vista Alegre"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="unidade" className="text-base font-medium">
                    Unidade (Bloco, Andar, Nº)
                  </Label>
                  <Input
                    id="unidade"
                    value={formData.unidade}
                    onChange={(e) => handleInputChange('unidade', e.target.value)}
                    placeholder="Ex: Bloco A, Apt 101"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="endereco" className="text-base font-medium">
                  Endereço Completo
                </Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, número, bairro, cidade, CEP"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="cliente_nome" className="text-base font-medium">
                    Nome Completo do Cliente *
                  </Label>
                  <Input
                    id="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={(e) => handleInputChange('cliente_nome', e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="cliente_cpf" className="text-base font-medium">
                    CPF do Cliente
                  </Label>
                  <Input
                    id="cliente_cpf"
                    value={formData.cliente_cpf}
                    onChange={(e) => handleInputChange('cliente_cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Dados da Vistoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="vistoriador_nome" className="text-base font-medium">
                    Vistoriador Responsável
                  </Label>
                  <Input
                    id="vistoriador_nome"
                    value={formData.vistoriador_nome}
                    onChange={(e) => handleInputChange('vistoriador_nome', e.target.value)}
                    placeholder="Nome do vistoriador"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="data_vistoria" className="text-base font-medium">
                    Data da Vistoria
                  </Label>
                  <Input
                    id="data_vistoria"
                    type="date"
                    value={formData.data_vistoria}
                    onChange={(e) => handleInputChange('data_vistoria', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="art_rrt_profissional" className="text-base font-medium">
                    ART/RRT do Profissional
                  </Label>
                  <Input
                    id="art_rrt_profissional"
                    value={formData.art_rrt_profissional}
                    onChange={(e) => handleInputChange('art_rrt_profissional', e.target.value)}
                    placeholder="Número do registro profissional (Opcional)"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Envolvidos na Vistoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-sm text-gray-600">
                Adicione os envolvidos que terão acesso ao laudo interativo. Você poderá compartilhar o link manualmente após criar a vistoria.
              </p>

              {envolvidos.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Envolvidos Adicionados:</Label>
                  {envolvidos.map((envolvido) => (
                    <div key={envolvido.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="font-medium">{envolvido.nome_usuario}</p>
                        <p className="text-sm text-gray-600">{envolvido.usuario_email}</p>
                        <Badge className="mt-1">{getTipoPerfilLabel(envolvido.tipo_perfil)}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removerEnvolvido(envolvido.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Label className="text-base font-medium text-blue-900">Adicionar Novo Envolvido:</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_envolvido" className="text-sm">Nome Completo</Label>
                    <Input
                      id="nome_envolvido"
                      value={novoEnvolvido.nome_usuario}
                      onChange={(e) => setNovoEnvolvido({...novoEnvolvido, nome_usuario: e.target.value})}
                      placeholder="Nome"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_envolvido" className="text-sm">E-mail</Label>
                    <Input
                      id="email_envolvido"
                      type="email"
                      value={novoEnvolvido.usuario_email}
                      onChange={(e) => setNovoEnvolvido({...novoEnvolvido, usuario_email: e.target.value})}
                      placeholder="email@exemplo.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone_envolvido" className="text-sm">Telefone (Opcional)</Label>
                    <Input
                      id="telefone_envolvido"
                      value={novoEnvolvido.telefone}
                      onChange={(e) => setNovoEnvolvido({...novoEnvolvido, telefone: e.target.value})}
                      placeholder="(00) 00000-0000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo_perfil_envolvido" className="text-sm">Tipo de Perfil</Label>
                    <Select
                      value={novoEnvolvido.tipo_perfil}
                      onValueChange={(value) => setNovoEnvolvido({...novoEnvolvido, tipo_perfil: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprietario">Proprietário</SelectItem>
                        <SelectItem value="inquilino">Inquilino</SelectItem>
                        <SelectItem value="comprador">Comprador</SelectItem>
                        <SelectItem value="corretor">Corretor</SelectItem>
                        <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                        <SelectItem value="reparo_manutencao">Prestador de Serviço</SelectItem>
                        <SelectItem value="construtora">Construtora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Permissões:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="perm_visualizar"
                        checked={novoEnvolvido.permissoes.visualizar}
                        onCheckedChange={(checked) => handlePermissaoChange('visualizar', checked)}
                      />
                      <Label htmlFor="perm_visualizar" className="text-sm cursor-pointer">Visualizar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="perm_comentar"
                        checked={novoEnvolvido.permissoes.comentar}
                        onCheckedChange={(checked) => handlePermissaoChange('comentar', checked)}
                      />
                      <Label htmlFor="perm_comentar" className="text-sm cursor-pointer">Comentar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="perm_editar"
                        checked={novoEnvolvido.permissoes.editar}
                        onCheckedChange={(checked) => handlePermissaoChange('editar', checked)}
                      />
                      <Label htmlFor="perm_editar" className="text-sm cursor-pointer">Editar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="perm_aprovar"
                        checked={novoEnvolvido.permissoes.aprovar_reparos}
                        onCheckedChange={(checked) => handlePermissaoChange('aprovar_reparos', checked)}
                      />
                      <Label htmlFor="perm_aprovar" className="text-sm cursor-pointer">Aprovar Reparos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="perm_concluir"
                        checked={novoEnvolvido.permissoes.marcar_concluido}
                        onCheckedChange={(checked) => handlePermissaoChange('marcar_concluido', checked)}
                      />
                      <Label htmlFor="perm_concluir" className="text-sm cursor-pointer">Marcar Concluído</Label>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={adicionarEnvolvido}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Envolvido
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Criar e Ir para Checklist
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}