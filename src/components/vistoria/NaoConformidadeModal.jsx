import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Brain, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { UploadFile } from "@/integrations/Core";
import { InvokeLLM } from "@/integrations/Core";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NaoConformidadeModal({ isOpen, onClose, onSave, itemTexto, dadosExistentes, ambiente }) {
  const [observacao, setObservacao] = useState(dadosExistentes?.observacao || '');
  const [fotoUrl, setFotoUrl] = useState(dadosExistentes?.foto_url || '');
  const [classificacao, setClassificacao] = useState(dadosExistentes?.classificacao || 'leve');
  const [garantiaAplicavel, setGarantiaAplicavel] = useState(dadosExistentes?.garantia_aplicavel || null);
  const [observacoesTecnicasIA, setObservacoesTecnicasIA] = useState(dadosExistentes?.observacoes_tecnicas_ia || '');
  const [sugestaoCorrecao, setSugestaoCorrecao] = useState(dadosExistentes?.sugestao_correcao || '');
  const [geolocalizacao, setGeolocalizacao] = useState(dadosExistentes?.geolocalizacao || null);
  const [uploading, setUploading] = useState(false);
  const [analisando, setAnalisando] = useState(false);

  useEffect(() => {
    setObservacao(dadosExistentes?.observacao || '');
    setFotoUrl(dadosExistentes?.foto_url || '');
    setClassificacao(dadosExistentes?.classificacao || 'leve');
    setGarantiaAplicavel(dadosExistentes?.garantia_aplicavel || null);
    setObservacoesTecnicasIA(dadosExistentes?.observacoes_tecnicas_ia || '');
    setSugestaoCorrecao(dadosExistentes?.sugestao_correcao || '');
    setGeolocalizacao(dadosExistentes?.geolocalizacao || null);
  }, [dadosExistentes, isOpen]);

  const handleSave = () => {
    if (!observacao.trim()) {
      alert('A observação é obrigatória.');
      return;
    }
    onSave({ 
      observacao, 
      foto_url: fotoUrl,
      classificacao,
      garantia_aplicavel: garantiaAplicavel,
      observacoes_tecnicas_ia: observacoesTecnicasIA,
      sugestao_correcao: sugestaoCorrecao,
      geolocalizacao
    });
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFotoUrl(file_url);
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGeolocalizacao({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.log('Geolocalização não disponível:', error);
          }
        );
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Falha no upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const analisarComIA = async () => {
    if (!fotoUrl && !observacao) {
      alert("Por favor, adicione uma imagem ou descrição primeiro.");
      return;
    }

    setAnalisando(true);
    try {
      const prompt = `Você é um engenheiro civil especialista em vistorias de imóveis, perícia técnica e na NBR 15575 (Norma de Desempenho de Edificações Habitacionais).

CONTEXTO DA VISTORIA:
- Ambiente: ${ambiente}
- Item vistoriado: ${itemTexto}
${observacao ? `- Descrição inicial do problema: ${observacao}` : ''}

TAREFA - ANÁLISE PERICIAL COMPLETA:

1. **DIAGNÓSTICO TÉCNICO**: Analise o problema identificado e forneça uma descrição técnica detalhada, usando terminologia adequada para um laudo pericial.

2. **CLASSIFICAÇÃO DE GRAVIDADE**: Classifique a não conformidade como:
   - "critico": Compromete a segurança estrutural, habitabilidade ou funcionalidade essencial do imóvel (ex: trincas estruturais, vazamentos graves, instalações elétricas perigosas)
   - "grave": Impacta significativamente o uso e conforto, mas não compromete a segurança imediata (ex: infiltrações moderadas, problemas hidráulicos, acabamentos com defeitos extensos)
   - "leve": Defeitos estéticos ou funcionais menores que não comprometem o uso (ex: pequenos riscos em pintura, desalinhamentos leves)

3. **ENQUADRAMENTO LEGAL - GARANTIAS**: Identifique qual garantia legal é aplicável:
   - "legal_90_dias": Vícios Aparentes - Defeitos visíveis ou de fácil constatação na entrega (CDC Art. 26, II). Prazo: 90 dias da entrega.
   - "legal_1_ano": Vícios Ocultos - Defeitos que só se revelam após uso normal (Código Civil Art. 445). Prazo: 1 ano após descoberta do vício.
   - "legal_5_anos": Solidez e Segurança - Problemas estruturais que comprometam a solidez da edificação (Código Civil Art. 618). Prazo: 5 anos do habite-se.

4. **SUGESTÃO DE REPARO**: Forneça uma recomendação técnica clara e objetiva de como corrigir o problema, incluindo:
   - Materiais necessários
   - Procedimento técnico resumido
   - Estimativa de prazo para correção (em dias úteis)

5. **REFERÊNCIA NORMATIVA**: Cite o item específico da NBR 15575 que estabelece os critérios de desempenho relacionados ao problema, se aplicável.

FORMATO DA RESPOSTA:
Seja técnico, objetivo e use linguagem adequada para um documento pericial com valor jurídico. Base suas conclusões nas normas técnicas brasileiras (NBR 15575) e na legislação pertinente (Código Civil e CDC).`;

      const resultado = await InvokeLLM({
        prompt,
        file_urls: fotoUrl ? [fotoUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            diagnostico_tecnico: { 
              type: "string",
              description: "Descrição técnica detalhada do problema"
            },
            classificacao: { 
              type: "string", 
              enum: ["leve", "grave", "critico"],
              description: "Gravidade da não conformidade"
            },
            garantia_aplicavel: { 
              type: "string", 
              enum: ["legal_90_dias", "legal_1_ano", "legal_5_anos"],
              description: "Tipo de garantia legal aplicável"
            },
            justificativa_garantia: {
              type: "string",
              description: "Explicação de por que essa garantia se aplica"
            },
            sugestao_reparo: { 
              type: "string",
              description: "Procedimento técnico de correção"
            },
            materiais_necessarios: {
              type: "array",
              items: { type: "string" },
              description: "Lista de materiais para o reparo"
            },
            prazo_estimado_dias: {
              type: "number",
              description: "Prazo estimado em dias úteis"
            },
            referencia_nbr: { 
              type: "string",
              description: "Item específico da NBR 15575 relacionado"
            }
          },
          required: ["diagnostico_tecnico", "classificacao", "garantia_aplicavel", "sugestao_reparo"]
        }
      });

      // Atualizar campos com a análise da IA
      setObservacao(resultado.diagnostico_tecnico);
      setClassificacao(resultado.classificacao);
      setGarantiaAplicavel(resultado.garantia_aplicavel);
      
      // Montar o texto técnico completo
      const observacoesTecnicas = `
DIAGNÓSTICO TÉCNICO:
${resultado.diagnostico_tecnico}

CLASSIFICAÇÃO: ${resultado.classificacao.toUpperCase()}

ENQUADRAMENTO LEGAL:
${resultado.justificativa_garantia || 'Garantia aplicável: ' + resultado.garantia_aplicavel}

REFERÊNCIA NORMATIVA:
${resultado.referencia_nbr || 'NBR 15575 - Norma de Desempenho'}
      `.trim();

      const sugestaoReparoCompleta = `
PROCEDIMENTO DE CORREÇÃO:
${resultado.sugestao_reparo}

${resultado.materiais_necessarios && resultado.materiais_necessarios.length > 0 ? `
MATERIAIS NECESSÁRIOS:
${resultado.materiais_necessarios.map(m => `• ${m}`).join('\n')}
` : ''}

${resultado.prazo_estimado_dias ? `PRAZO ESTIMADO: ${resultado.prazo_estimado_dias} dias úteis` : ''}
      `.trim();

      setObservacoesTecnicasIA(observacoesTecnicas);
      setSugestaoCorrecao(sugestaoReparoCompleta);

    } catch(error) {
      console.error("Erro ao analisar com IA:", error);
      alert("Ocorreu um erro ao tentar analisar com IA. Tente novamente.");
    } finally {
      setAnalisando(false);
    }
  };

  const getGarantiaLabel = (tipo) => {
    const labels = {
      'legal_90_dias': '90 dias - Vícios Aparentes (CDC Art. 26, II)',
      'legal_1_ano': '1 ano - Vícios Ocultos (CC Art. 445)',
      'legal_5_anos': '5 anos - Solidez e Segurança (CC Art. 618)'
    };
    return labels[tipo] || tipo;
  };

  const getClassificacaoColor = (tipo) => {
    const colors = {
      'critico': 'bg-red-100 text-red-800 border-red-300',
      'grave': 'bg-orange-100 text-orange-800 border-orange-300',
      'leve': 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[tipo] || colors.leve;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Análise Pericial de Não Conformidade</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Ambiente:</strong> {ambiente} • <strong>Item:</strong> {itemTexto}
          </p>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Análise com IA */}
          <Alert className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300">
            <Brain className="h-5 w-5 text-purple-600" />
            <AlertDescription className="ml-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-purple-900 mb-1">Análise Pericial Automatizada com IA</p>
                  <p className="text-sm text-purple-700">
                    A IA analisará a foto e/ou descrição, fornecerá diagnóstico técnico, classificará a gravidade, 
                    identificará a garantia legal aplicável e sugerirá procedimentos de reparo baseados na NBR 15575.
                  </p>
                </div>
                <Button
                  onClick={analisarComIA}
                  disabled={analisando || (!fotoUrl && !observacao)}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 ml-4 shrink-0"
                >
                  {analisando ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Análise Pericial
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Upload de Foto */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Evidência Fotográfica</Label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="upload-foto"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('upload-foto').click()}
                disabled={uploading}
                className="border-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {fotoUrl ? 'Trocar Imagem' : 'Capturar/Enviar Foto'}
              </Button>
              
              {geolocalizacao && (
                <Badge variant="outline" className="text-green-700 border-green-400 bg-green-50">
                  <MapPin className="w-3 h-3 mr-1" />
                  GPS: {geolocalizacao.latitude.toFixed(6)}, {geolocalizacao.longitude.toFixed(6)}
                </Badge>
              )}
            </div>
            {fotoUrl && (
              <div className="mt-3 p-3 border-2 border-gray-200 rounded-lg inline-block bg-gray-50">
                <img src={fotoUrl} alt="Evidência" className="max-w-md max-h-64 rounded" />
              </div>
            )}
          </div>

          {/* Descrição do Problema */}
          <div className="space-y-2">
            <Label htmlFor="observacao" className="text-base font-semibold">
              Descrição Técnica do Problema *
            </Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva detalhadamente o problema encontrado usando terminologia técnica adequada para um laudo pericial..."
              rows={5}
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classificação */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Classificação da Gravidade *</Label>
              <Select value={classificacao} onValueChange={setClassificacao}>
                <SelectTrigger className={`border-2 ${getClassificacaoColor(classificacao)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Leve - Defeitos estéticos/menores</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="grave">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Grave - Impacto significativo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critico">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Crítico - Segurança/estrutural</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Garantia Aplicável */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Garantia Legal Aplicável *</Label>
              <Select 
                value={garantiaAplicavel || ''} 
                onValueChange={(value) => setGarantiaAplicavel(value || null)}
              >
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Selecione a garantia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal_90_dias">
                    <div className="py-1">
                      <div className="font-semibold">90 dias - Vícios Aparentes</div>
                      <div className="text-xs text-gray-600">CDC Art. 26, II</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="legal_1_ano">
                    <div className="py-1">
                      <div className="font-semibold">1 ano - Vícios Ocultos</div>
                      <div className="text-xs text-gray-600">Código Civil Art. 445</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="legal_5_anos">
                    <div className="py-1">
                      <div className="font-semibold">5 anos - Solidez/Segurança</div>
                      <div className="text-xs text-gray-600">Código Civil Art. 618</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações Técnicas da IA */}
          {observacoesTecnicasIA && (
            <div className="space-y-2">
              <Label className="text-base font-semibold text-blue-900">
                Parecer Técnico (Gerado por IA)
              </Label>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <pre className="text-sm text-blue-900 whitespace-pre-wrap font-sans">
                  {observacoesTecnicasIA}
                </pre>
              </div>
            </div>
          )}

          {/* Sugestão de Reparo */}
          {sugestaoCorrecao && (
            <div className="space-y-2">
              <Label className="text-base font-semibold text-emerald-900">
                Procedimento de Correção Sugerido
              </Label>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <pre className="text-sm text-emerald-900 whitespace-pre-wrap font-sans">
                  {sugestaoCorrecao}
                </pre>
              </div>
            </div>
          )}

          {classificacao === 'critico' && (
            <Alert className="bg-red-50 border-red-300">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 ml-2">
                <strong>Atenção:</strong> Problemas críticos comprometem a segurança ou habitabilidade do imóvel 
                e exigem correção imediata. Considere notificar formalmente o responsável e estabelecer prazo urgente.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            className="bg-red-600 hover:bg-red-700"
            disabled={!observacao.trim() || !garantiaAplicavel}
          >
            Registrar Não Conformidade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}