
import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { AnaliseIA } from '@/entities/AnaliseIA';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mic, MicOff, Check, X, Wand2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { InvokeLLM } from "@/integrations/Core";

export default function VistoriaPorVoz() {
  const [vistoria, setVistoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [textoTranscrito, setTextoTranscrito] = useState('');
  const [ambienteAtual, setAmbienteAtual] = useState('');
  const [reconhecimento, setReconhecimento] = useState(null);
  const [sugestaoIA, setSugestaoIA] = useState(null);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [itensVerificados, setItensVerificados] = useState(new Set());

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarVistoria = useCallback(async () => {
    try {
      const dados = await Vistoria.list();
      const vistoriaEncontrada = dados.find(v => v.id === vistoriaId);
      setVistoria(vistoriaEncontrada);

      if (vistoriaEncontrada?.checklist_data) {
        const primeiroAmbiente = Object.keys(vistoriaEncontrada.checklist_data)[0];
        setAmbienteAtual(primeiroAmbiente);
      }
    } catch (error) {
      console.error('Erro ao carregar vistoria:', error);
    } finally {
      setLoading(false);
    }
  }, [vistoriaId]);

  const processarComandoVoz = useCallback(async (texto) => {
    setProcessandoIA(true);
    setSugestaoIA(null);
    try {
      const prompt = `
      Você é um assistente de vistoria de imóveis. Analise o seguinte comando de voz e extraia as informações de forma estruturada.
      
      Texto transcrito: "${texto}"
      Ambiente atual: "${ambienteAtual}"
      Itens do ambiente atual: ${JSON.stringify(vistoria.checklist_data[ambienteAtual].map(item => item.texto))}
      
      Sua tarefa é:
      1. Identificar o **item_vistoriado** mais provável mencionado no texto, com base na lista de itens do ambiente.
      2. Determinar o **status** do item: "conforme", "nao_conforme", ou "nao_aplica".
      3. Se for "nao_conforme", extrair a **descricao_problema**.
      4. Identificar se um novo **ambiente_mencionado** foi dito para trocar de ambiente.
      
      Responda apenas com o JSON.
      `;

      const resultado = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            ambiente_mencionado: { type: "string" },
            item_vistoriado: { type: "string" },
            status: { 
              type: "string", 
              enum: ["conforme", "nao_conforme", "nao_aplica"] 
            },
            descricao_problema: { type: "string" }
          }
        }
      });

      setSugestaoIA(resultado);

      // Salvar análise da IA
      await AnaliseIA.create({
        vistoria_id: vistoriaId,
        tipo_analise: 'analise_voz',
        input_original: texto,
        resultado_ia: resultado,
        confianca_score: resultado.confianca || 0,
        ambiente: ambienteAtual,
        item_relacionado: resultado.item_mencionado
      });

    } catch (error) {
      console.error('Erro ao processar comando de voz:', error);
    } finally {
      setProcessandoIA(false);
    }
  }, [vistoriaId, ambienteAtual, vistoria]);

  useEffect(() => {
    if (vistoriaId) {
      carregarVistoria();
    }
    
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTextoTranscrito(transcript);
        
        if (event.results[event.results.length - 1].isFinal) {
          processarComandoVoz(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
      };

      setReconhecimento(recognition);
    }
  }, [vistoriaId, carregarVistoria, processarComandoVoz]);

  const iniciarGravacao = () => {
    if (reconhecimento) {
      setIsRecording(true);
      setTextoTranscrito('');
      setSugestaoIA(null);
      reconhecimento.start();
    }
  };

  const pararGravacao = () => {
    if (reconhecimento) {
      setIsRecording(false);
      reconhecimento.stop();
    }
  };

  const aplicarSugestao = async () => {
    if (!sugestaoIA || !sugestaoIA.item_vistoriado || !sugestaoIA.status) return;

    setSalvando(true);
    try {
      const novaChecklistData = { ...vistoria.checklist_data };
      const ambienteParaAtualizar = sugestaoIA.ambiente_mencionado || ambienteAtual;

      const itemIndex = novaChecklistData[ambienteParaAtualizar].findIndex(
        item => item.texto.toLowerCase() === sugestaoIA.item_vistoriado.toLowerCase()
      );
      
      if (itemIndex === -1) {
        alert(`Item "${sugestaoIA.item_vistoriado}" não encontrado no ambiente "${ambienteParaAtualizar}".`);
        return;
      }
      
      const detalhes = sugestaoIA.status === 'nao_conforme' ? {
        observacao: sugestaoIA.descricao_problema,
        foto_url: null
      } : null;

      novaChecklistData[ambienteParaAtualizar][itemIndex] = {
        ...novaChecklistData[ambienteParaAtualizar][itemIndex],
        status: sugestaoIA.status,
        detalhes: detalhes
      };

      const totalNaoConformidades = Object.values(novaChecklistData)
        .flat()
        .filter(item => item.status === 'nao_conforme').length;
      
      await Vistoria.update(vistoriaId, {
        checklist_data: novaChecklistData,
        total_nao_conformidades: totalNaoConformidades
      });

      if (sugestaoIA.status === 'nao_conforme') {
        await NaoConformidade.create({
          vistoria_id: vistoriaId,
          ambiente: ambienteParaAtualizar,
          item_texto: sugestaoIA.item_vistoriado,
          descricao_problema: sugestaoIA.descricao_problema,
          classificacao: 'leve'
        });
      }

      setVistoria(prev => ({ ...prev, checklist_data: novaChecklistData, total_nao_conformidades: totalNaoConformidades }));
      setItensVerificados(prev => new Set(prev).add(`${ambienteParaAtualizar}-${itemIndex}`));
      setSugestaoIA(null);
      setTextoTranscrito('');

      if (sugestaoIA.ambiente_mencionado) {
        setAmbienteAtual(sugestaoIA.ambiente_mencionado);
      }
    } catch (error) {
      console.error("Erro ao aplicar sugestão:", error);
      alert("Falha ao salvar a atualização.");
    } finally {
      setSalvando(false);
    }
  };

  const descartarSugestao = () => {
    setSugestaoIA(null);
    setTextoTranscrito('');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vistoria por Voz</h1>
              <p className="text-gray-600">{vistoria?.empreendimento}</p>
            </div>
          </div>
        </motion.div>

        {/* Painel de Controle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          {!isRecording ? (
            <Button onClick={iniciarGravacao} size="lg" className="w-48 h-16 rounded-full bg-blue-600 hover:bg-blue-700">
              <Mic className="w-8 h-8 mr-2" /> Iniciar
            </Button>
          ) : (
            <Button onClick={pararGravacao} size="lg" variant="destructive" className="w-48 h-16 rounded-full">
              <MicOff className="w-8 h-8 mr-2" /> Parar
            </Button>
          )}
          <p className="text-gray-500 mt-4">Pressione para falar. Diga o ambiente, o item e seu status.</p>
          <p className="text-gray-500 text-sm">Ex: "Cozinha, pintura, com mancha amarelada perto da janela."</p>
        </motion.div>

        {/* Status e Transcrição */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Status da Vistoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Ambiente Atual</Label>
                <select 
                  value={ambienteAtual} 
                  onChange={(e) => setAmbienteAtual(e.target.value)} 
                  className="w-full p-2 border rounded-md"
                  disabled={isRecording}
                >
                  {vistoria && Object.keys(vistoria.checklist_data).map(ambiente => (
                    <option key={ambiente} value={ambiente}>{ambiente}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Transcrição em Tempo Real</Label>
                <div className="p-3 bg-gray-100 rounded-md min-h-[60px] text-gray-700 italic">
                  {textoTranscrito || "Aguardando áudio..."}
                  {isRecording && <span className="animate-ping">...</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sugestão da IA */}
        <AnimatePresence>
          {processandoIA && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3 text-purple-700 mb-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Analisando comando...</p>
            </motion.div>
          )}

          {sugestaoIA && !processandoIA && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Wand2 /> Sugestão da IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p><strong>Item:</strong> {sugestaoIA.item_vistoriado || "Não identificado"}</p>
                  <p><strong>Status:</strong> <Badge>{sugestaoIA.status}</Badge></p>
                  {sugestaoIA.status === 'nao_conforme' && (
                    <p><strong>Problema:</strong> {sugestaoIA.descricao_problema}</p>
                  )}
                  {sugestaoIA.ambiente_mencionado && (
                    <p><strong>Ambiente:</strong> Mudando para {sugestaoIA.ambiente_mencionado}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                  <Button variant="outline" onClick={descartarSugestao}><X className="w-4 h-4 mr-2" /> Descartar</Button>
                  <Button onClick={aplicarSugestao} className="bg-purple-600 hover:bg-purple-700" disabled={salvando}>
                    {salvando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Aplicar
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checklist do Ambiente */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Checklist: {ambienteAtual}</h3>
          <div className="space-y-2">
            {vistoria && vistoria.checklist_data[ambienteAtual] &&
              vistoria.checklist_data[ambienteAtual].map((item, index) => {
                const itemKey = `${ambienteAtual}-${index}`;
                const isChecked = itensVerificados.has(itemKey);
                return (
                  <div 
                    key={itemKey} 
                    className={`p-3 rounded-md flex items-center justify-between transition-colors ${
                      isChecked ? 'bg-emerald-100' : 'bg-white'
                    }`}
                  >
                    <span>{item.texto}</span>
                    <Badge variant={
                      item.status === 'conforme' ? 'default' : 
                      item.status === 'nao_conforme' ? 'destructive' : 
                      'secondary'
                    }>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
}
