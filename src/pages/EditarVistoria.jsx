import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileSignature, AlertTriangle, PlusCircle, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import ChecklistItem from "../components/vistoria/ChecklistItem";
import NaoConformidadeModal from "../components/vistoria/NaoConformidadeModal";
import GuiaContextual from "../components/vistoria/GuiaContextual";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditarVistoria() {
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [indices, setIndices] = useState({ sectionIndex: 0, itemIndex: 0 });
  const [dialogAmbiente, setDialogAmbiente] = useState({ open: false, mode: 'add', oldName: '' });
  const [nomeAmbiente, setNomeAmbiente] = useState('');

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarVistoria = useCallback(async () => {
    try {
      const dados = await Vistoria.list();
      const vistoriaEncontrada = dados.find(v => v.id === vistoriaId);
      
      if (vistoriaEncontrada) {
        setVistoria(vistoriaEncontrada);
      } else {
        alert('Vistoria não encontrada');
        navigate(createPageUrl('Dashboard'));
      }
    } catch (error) {
      console.error('Erro ao carregar vistoria:', error);
      alert('Erro ao carregar vistoria');
      navigate(createPageUrl('Dashboard'));
    } finally {
      setLoading(false);
    }
  }, [vistoriaId, navigate]);

  useEffect(() => {
    if (vistoriaId) {
      carregarVistoria();
    }
  }, [vistoriaId, carregarVistoria]);

  const atualizarStatusItem = async (sectionIndex, itemIndex, novoStatus) => {
    if (novoStatus === 'nao_conforme') {
      const ambiente = Object.keys(vistoria.checklist_data)[sectionIndex];
      const item = vistoria.checklist_data[ambiente][itemIndex];
      
      setItemSelecionado(item);
      setIndices({ sectionIndex, itemIndex });
      setModalAberto(true);
      return;
    }

    try {
      const novaChecklistData = { ...vistoria.checklist_data };
      const ambiente = Object.keys(novaChecklistData)[sectionIndex];
      
      novaChecklistData[ambiente][itemIndex] = {
        ...novaChecklistData[ambiente][itemIndex],
        status: novoStatus,
        detalhes: null
      };

      const totalNaoConformidades = Object.values(novaChecklistData)
        .flat()
        .filter(item => item.status === 'nao_conforme').length;

      await Vistoria.update(vistoria.id, {
        checklist_data: novaChecklistData,
        total_nao_conformidades: totalNaoConformidades
      });

      setVistoria({
        ...vistoria,
        checklist_data: novaChecklistData,
        total_nao_conformidades: totalNaoConformidades
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do item');
    }
  };

  const salvarNaoConformidade = async (detalhes) => {
    try {
      const { sectionIndex, itemIndex } = indices;
      const novaChecklistData = { ...vistoria.checklist_data };
      const ambiente = Object.keys(novaChecklistData)[sectionIndex];
      
      novaChecklistData[ambiente][itemIndex] = {
        ...novaChecklistData[ambiente][itemIndex],
        status: 'nao_conforme',
        detalhes: detalhes
      };

      const totalNaoConformidades = Object.values(novaChecklistData)
        .flat()
        .filter(item => item.status === 'nao_conforme').length;

      await Vistoria.update(vistoria.id, {
        checklist_data: novaChecklistData,
        total_nao_conformidades: totalNaoConformidades
      });

      const item = novaChecklistData[ambiente][itemIndex];
      await NaoConformidade.create({
        vistoria_id: vistoria.id,
        ambiente: ambiente,
        item_texto: item.texto,
        descricao_problema: detalhes.observacao,
        foto_url: detalhes.foto_url,
        observacoes_tecnicas_ia: detalhes.observacoes_tecnicas_ia || '',
        classificacao: detalhes.classificacao || 'leve',
        garantia_aplicavel: detalhes.garantia_aplicavel || null,
        geolocalizacao: detalhes.geolocalizacao || null
      });

      setVistoria({
        ...vistoria,
        checklist_data: novaChecklistData,
        total_nao_conformidades: totalNaoConformidades
      });

      setModalAberto(false);
      setItemSelecionado(null);
    } catch (error) {
      console.error('Erro ao salvar não conformidade:', error);
      alert('Erro ao salvar não conformidade');
    }
  };

  const editarDetalhes = (sectionIndex, itemIndex) => {
    const ambiente = Object.keys(vistoria.checklist_data)[sectionIndex];
    const item = vistoria.checklist_data[ambiente][itemIndex];
    
    setItemSelecionado(item);
    setIndices({ sectionIndex, itemIndex });
    setModalAberto(true);
  };

  const finalizarVistoria = async () => {
    const itensCompletos = Object.values(vistoria.checklist_data)
      .flat()
      .every(item => item.status !== 'pendente');

    if (!itensCompletos) {
      alert('Por favor, complete todos os itens do checklist antes de finalizar');
      return;
    }

    const temNaoConformidades = vistoria.total_nao_conformidades > 0;
    
    if (temNaoConformidades) {
      await Vistoria.update(vistoria.id, {
        status: 'aguardando_correcao'
      });
      
      alert('Vistoria concluída com não conformidades. É necessário definir prazos de correção antes de finalizar definitivamente.');
      navigate(createPageUrl(`GestaoNaoConformidade?id=${vistoria.id}`));
    } else {
      navigate(createPageUrl(`Assinaturas?id=${vistoria.id}`));
    }
  };

  const getProgressoPercentual = () => {
    const todosItens = Object.values(vistoria?.checklist_data || {}).flat();
    const itensCompletos = todosItens.filter(item => item.status !== 'pendente');
    if (todosItens.length === 0) return 0;
    return Math.round((itensCompletos.length / todosItens.length) * 100) || 0;
  };

  const handleGerenciarAmbiente = async () => {
    if (!nomeAmbiente.trim()) return;
    
    let novaChecklistData = { ...vistoria.checklist_data };

    if (dialogAmbiente.mode === 'add') {
      if (novaChecklistData[nomeAmbiente]) {
        alert('Este ambiente já existe.');
        return;
      }
      novaChecklistData[nomeAmbiente] = [
        { id: 'item_generico_1', texto: 'Verificar pintura e acabamento', status: 'pendente', detalhes: null },
        { id: 'item_generico_2', texto: 'Verificar piso e rodapés', status: 'pendente', detalhes: null },
        { id: 'item_generico_3', texto: 'Testar tomadas e interruptores', status: 'pendente', detalhes: null },
      ];
    } else if (dialogAmbiente.mode === 'rename') {
      if (nomeAmbiente === dialogAmbiente.oldName) {
        setDialogAmbiente({ open: false, mode: 'add', oldName: '' });
        return;
      }
      if (novaChecklistData[nomeAmbiente]) {
        alert('Este nome de ambiente já está em uso.');
        return;
      }
      const reorderedChecklist = {};
      for (const key in novaChecklistData) {
        if (key === dialogAmbiente.oldName) {
          reorderedChecklist[nomeAmbiente] = novaChecklistData[key];
        } else {
          reorderedChecklist[key] = novaChecklistData[key];
        }
      }
      novaChecklistData = reorderedChecklist;
    }

    try {
      await Vistoria.update(vistoria.id, { checklist_data: novaChecklistData });
      setVistoria(prev => ({ ...prev, checklist_data: novaChecklistData }));
      setDialogAmbiente({ open: false, mode: 'add', oldName: '' });
      setNomeAmbiente('');
    } catch (error) {
      console.error('Erro ao gerenciar ambiente:', error);
      alert('Erro ao atualizar ambiente.');
    }
  };

  const handleExcluirAmbiente = async (nomeAmbiente) => {
    if (!window.confirm(`Tem certeza que deseja excluir o ambiente "${nomeAmbiente}" e todos os seus itens?`)) {
      return;
    }

    let novaChecklistData = { ...vistoria.checklist_data };
    delete novaChecklistData[nomeAmbiente];

    const totalNaoConformidades = Object.values(novaChecklistData)
      .flat()
      .filter(item => item.status === 'nao_conforme').length;

    try {
      await Vistoria.update(vistoria.id, { checklist_data: novaChecklistData, total_nao_conformidades: totalNaoConformidades });
      setVistoria(prev => ({ ...prev, checklist_data: novaChecklistData, total_nao_conformidades: totalNaoConformidades }));
    } catch (error) {
      console.error('Erro ao excluir ambiente:', error);
      alert('Erro ao excluir ambiente.');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      rascunho: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      em_andamento: { color: 'bg-amber-100 text-amber-800', label: 'Em Andamento' },
      concluida: { color: 'bg-emerald-100 text-emerald-800', label: 'Concluída' },
      aguardando_correcao: { color: 'bg-orange-100 text-orange-800', label: 'Aguardando Correção' }
    };

    const config = configs[status] || configs.rascunho;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vistoria) return null;

  const progresso = getProgressoPercentual();
  const ambientes = Object.keys(vistoria.checklist_data);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">{vistoria?.empreendimento}</h1>
              <p className="text-gray-600">{vistoria?.cliente_nome} • {vistoria?.unidade}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {vistoria?.total_nao_conformidades > 0 && (
              <Link to={createPageUrl(`GestaoNaoConformidade?id=${vistoria.id}`)}>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Gerenciar NC
                </Button>
              </Link>
            )}
            
            <Button
              onClick={finalizarVistoria}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
              disabled={progresso < 100 && vistoria.status !== 'aguardando_correcao'}
            >
              <FileSignature className="w-5 h-5 mr-2" />
              {vistoria?.total_nao_conformidades > 0 ? 'Concluir Checklist' : 'Finalizar e Assinar'}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Progresso da Vistoria</h3>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {progresso}%
                </Badge>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progresso}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-3 rounded-full ${progresso < 100 ? 'bg-gradient-to-r from-blue-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500'}`}
                />
              </div>

              {vistoria.total_nao_conformidades > 0 && (
                <div className="flex items-center gap-2 mt-4 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {vistoria.total_nao_conformidades} não conformidade(s) encontrada(s)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence>
            {ambientes.map((ambiente, sectionIndex) => (
              <motion.div
                key={ambiente}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{ambiente}</CardTitle>
                      <div className="flex items-center gap-2">
                        <GuiaContextual ambiente={ambiente} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setNomeAmbiente(ambiente);
                              setDialogAmbiente({ open: true, mode: 'rename', oldName: ambiente });
                            }}>
                              <Pencil className="w-4 h-4 mr-2" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExcluirAmbiente(ambiente)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      {vistoria.checklist_data[ambiente].map((item, itemIndex) => (
                        <ChecklistItem
                          key={`${ambiente}-${item.id}-${itemIndex}`}
                          item={item}
                          sectionIndex={sectionIndex}
                          itemIndex={itemIndex}
                          onStatusChange={atualizarStatusItem}
                          onEditDetails={editarDetalhes}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            variant="outline" 
            className="border-dashed border-2 p-6"
            onClick={() => setDialogAmbiente({ open: true, mode: 'add', oldName: '' })}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Adicionar Ambiente
          </Button>
        </div>

        <NaoConformidadeModal
          isOpen={modalAberto}
          onClose={() => {
            setModalAberto(false);
            setItemSelecionado(null);
          }}
          onSave={salvarNaoConformidade}
          itemTexto={itemSelecionado?.texto || ''}
          dadosExistentes={itemSelecionado?.detalhes}
          ambiente={ambientes[indices.sectionIndex]}
        />

        <Dialog open={dialogAmbiente.open} onOpenChange={(open) => {
          setDialogAmbiente({ ...dialogAmbiente, open });
          if (!open) setNomeAmbiente('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogAmbiente.mode === 'add' ? 'Adicionar Novo Ambiente' : 'Renomear Ambiente'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="ambiente-nome">Nome do Ambiente</Label>
              <Input
                id="ambiente-nome"
                value={nomeAmbiente}
                onChange={(e) => setNomeAmbiente(e.target.value)}
                placeholder="Ex: Escritório"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleGerenciarAmbiente}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}