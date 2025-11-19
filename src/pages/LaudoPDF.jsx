import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { ConfiguracaoEmpresa } from '@/entities/ConfiguracaoEmpresa';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Sparkles, Loader2, Eye, Share2, MessageSquare, Link as LinkIcon, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { InvokeLLM } from "@/integrations/Core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

export default function LaudoPDF() {
  const [vistoria, setVistoria] = useState(null);
  const [configuracao, setConfiguracao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gerandoResumo, setGerandoResumo] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarDados = useCallback(async () => {
    try {
      const [vistoriasData, configData] = await Promise.all([
        Vistoria.list(),
        ConfiguracaoEmpresa.list()
      ]);

      const vistoriaEncontrada = vistoriasData.find(v => v.id === vistoriaId);
      setVistoria(vistoriaEncontrada);
      setConfiguracao(configData[0] || null);
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

  const gerarResumoExecutivo = async () => {
    if (!vistoria) return;

    const naoConformidades = Object.entries(vistoria.checklist_data)
      .flatMap(([ambiente, itens]) =>
        itens
          .filter(item => item.status === 'nao_conforme')
          .map(item => `${ambiente} - ${item.texto}: ${item.detalhes?.observacao || 'Não conforme'}`)
      );

    if (naoConformidades.length === 0) {
      alert('Não há não conformidades para gerar resumo');
      return;
    }

    setGerandoResumo(true);
    try {
      const prompt = `Com base nas seguintes não conformidades encontradas em uma vistoria de entrega de imóvel, escreva um parágrafo de resumo executivo técnico e profissional. O resumo deve ser conciso, objetivo e adequado para um laudo oficial:

${naoConformidades.join('\n')}

O resumo deve:
- Ser técnico e profissional
- Destacar os principais problemas encontrados
- Ser escrito em um parágrafo coeso
- Não usar listas ou tópicos
- Ser adequado para inclusão em um laudo oficial`;

      const resumo = await InvokeLLM({ prompt });

      await Vistoria.update(vistoria.id, {
        resumo_executivo: resumo
      });

      setVistoria(prev => ({
        ...prev,
        resumo_executivo: resumo
      }));
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      alert('Erro ao gerar resumo. Tente novamente.');
    } finally {
      setGerandoResumo(false);
    }
  };

  const gerarPDF = () => {
    const conteudoPDF = gerarConteudoHTML();
    const janela = window.open('', '_blank');
    janela.document.write(conteudoPDF);
    janela.document.close();
    janela.print();
  };

  const copiarLink = () => {
    const linkLaudo = window.location.href;
    navigator.clipboard.writeText(linkLaudo).then(() => {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 3000);
    }).catch(() => {
      alert("Erro ao copiar link. Por favor, copie manualmente: " + linkLaudo);
    });
  };

  const compartilharPorWhatsApp = () => {
    const linkLaudo = window.location.href;
    const mensagem = `Olá! Segue o laudo de vistoria do imóvel:

📍 Empreendimento: ${vistoria.empreendimento}
🏠 Unidade: ${vistoria.unidade}
👤 Cliente: ${vistoria.cliente_nome}

Para visualizar o laudo completo, acesse: ${linkLaudo}`;
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const gerarConteudoHTML = () => {
    if (!vistoria) return '';

    const nomeEmpresa = configuracao?.nome_empresa || 'Empresa de Vistorias';
    const logoEmpresa = configuracao?.logo_url || '';
    const cnpj = configuracao?.cnpj || '';
    const endereco = configuracao?.endereco || '';
    const contato = configuracao?.telefone || configuracao?.email || '';

    // Extrair todas as não conformidades com dados completos
    const naoConformidades = Object.entries(vistoria.checklist_data)
      .flatMap(([ambiente, itens]) =>
        itens
          .filter(item => item.status === 'nao_conforme')
          .map(item => ({
            ambiente,
            item: item.texto,
            detalhes: item.detalhes || {}
          }))
      );

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laudo Técnico Pericial - ${vistoria.empreendimento}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Times New Roman', serif;
            margin: 20px; 
            line-height: 1.6;
            color: #1a1a1a;
            font-size: 12pt;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 3px solid #2c5aa0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo { max-width: 180px; max-height: 100px; }
        .company-info { 
            text-align: right; 
            font-size: 10pt;
            color: #444;
        }
        .title-page {
            text-align: center;
            margin: 80px 0;
            page-break-after: always;
        }
        .title { 
            font-size: 28pt;
            font-weight: bold;
            margin: 40px 0;
            color: #2c5aa0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 16pt;
            color: #555;
            margin: 20px 0;
        }
        .metodologia {
            background-color: #f8f9fa;
            border-left: 4px solid #2c5aa0;
            padding: 20px;
            margin: 30px 0;
            page-break-inside: avoid;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background-color: #f7fafc;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
        }
        .info-item {
            margin: 0;
            font-size: 11pt;
            padding: 8px 0;
        }
        .info-label {
            font-weight: bold;
            color: #2c5aa0;
            display: block;
            margin-bottom: 5px;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .summary-title {
            font-size: 16pt;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        .garantias-section {
            background-color: #eff6ff;
            border: 3px solid #2563eb;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .garantias-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 20px;
            text-transform: uppercase;
            text-align: center;
        }
        .garantia-item {
            background-color: white;
            padding: 18px;
            margin-bottom: 15px;
            border-radius: 6px;
            border-left: 5px solid #2563eb;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .garantia-prazo {
            font-weight: bold;
            color: #047857;
            font-size: 13pt;
        }
        .section-title {
            font-size: 16pt;
            font-weight: bold;
            background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
            color: white;
            padding: 15px 20px;
            margin: 40px 0 20px 0;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .nc-section {
            margin-bottom: 50px;
            page-break-inside: avoid;
        }
        .nc-item {
            background-color: #fef2f2;
            border: 2px solid #dc2626;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .nc-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 2px solid #fca5a5;
        }
        .nc-title {
            font-size: 13pt;
            font-weight: bold;
            color: #991b1b;
        }
        .nc-badge {
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-critico { background-color: #dc2626; color: white; }
        .badge-grave { background-color: #ea580c; color: white; }
        .badge-leve { background-color: #ca8a04; color: white; }
        .nc-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .nc-text {
            font-size: 11pt;
            line-height: 1.8;
        }
        .nc-label {
            font-weight: bold;
            color: #7f1d1d;
            margin-top: 12px;
            display: block;
        }
        .nc-images {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .evidence-image { 
            width: 100%;
            max-height: 300px;
            object-fit: cover;
            border-radius: 6px;
            border: 2px solid #dc2626;
        }
        .image-label {
            font-size: 9pt;
            font-weight: bold;
            color: #7f1d1d;
            text-align: center;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .gps-info {
            background-color: #dcfce7;
            border: 1px solid #16a34a;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 9pt;
            margin-top: 10px;
            text-align: center;
        }
        .parecer-tecnico {
            background-color: #dbeafe;
            border-left: 5px solid #2563eb;
            padding: 15px;
            margin-top: 15px;
            border-radius: 4px;
        }
        .sugestao-reparo {
            background-color: #d1fae5;
            border-left: 5px solid #10b981;
            padding: 15px;
            margin-top: 15px;
            border-radius: 4px;
        }
        .checklist-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 10pt;
        }
        .checklist-table th,
        .checklist-table td {
            border: 1px solid #cbd5e0;
            padding: 12px;
            text-align: left;
            vertical-align: top;
        }
        .checklist-table th {
            background-color: #2c5aa0;
            color: white;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-conforme { 
            color: #047857;
            font-weight: bold;
            background-color: #d1fae5;
            padding: 4px 8px;
            border-radius: 3px;
        }
        .status-nao-conforme { 
            color: #dc2626;
            font-weight: bold;
            background-color: #fef2f2;
            padding: 4px 8px;
            border-radius: 3px;
        }
        .status-nao-aplica { 
            color: #64748b;
            font-weight: bold;
            background-color: #f1f5f9;
            padding: 4px 8px;
            border-radius: 3px;
        }
        .signatures {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            text-align: center;
            page-break-inside: avoid;
        }
        .signature {
            border-top: 2px solid #1a1a1a;
            padding-top: 10px;
        }
        .signature-name {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 5px;
        }
        .signature-role {
            font-size: 10pt;
            color: #555;
        }
        .signature-doc {
            font-size: 9pt;
            color: #666;
            margin-top: 3px;
        }
        .signature-img {
            max-width: 300px;
            max-height: 100px;
            margin: 0 auto 15px auto;
            display: block;
        }
        .legal-warning {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            border-radius: 6px;
            margin: 30px 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }
        .legal-warning-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
            font-size: 11pt;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #cbd5e0;
            text-align: center;
            font-size: 9pt;
            color: #666;
        }
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
            .no-print { display: none; }
        }
        @page {
            margin: 2cm;
        }
    </style>
</head>
<body>
    <!-- PÁGINA DE TÍTULO -->
    <div class="title-page">
        ${logoEmpresa ? `<img src="${logoEmpresa}" alt="Logo" class="logo" style="margin: 0 auto 40px auto; display: block;">` : ''}
        
        <div class="title">LAUDO TÉCNICO PERICIAL<br/>DE VISTORIA DE IMÓVEL</div>
        
        <div class="subtitle">
            <strong>Empreendimento:</strong> ${vistoria.empreendimento}<br/>
            <strong>Unidade:</strong> ${vistoria.unidade}
        </div>
        
        <div style="margin-top: 60px; font-size: 11pt; color: #555;">
            <p><strong>Cliente:</strong> ${vistoria.cliente_nome}</p>
            <p><strong>Data da Vistoria:</strong> ${new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}</p>
            <p><strong>Vistoriador Responsável:</strong> ${vistoria.vistoriador_nome}</p>
            ${vistoria.art_rrt_profissional ? `<p><strong>ART/RRT:</strong> ${vistoria.art_rrt_profissional}</p>` : ''}
        </div>
        
        <div style="position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; font-size: 10pt; color: #666;">
            <p><strong>${nomeEmpresa}</strong></p>
            ${cnpj ? `<p>CNPJ: ${cnpj}</p>` : ''}
            ${endereco ? `<p>${endereco}</p>` : ''}
            ${contato ? `<p>${contato}</p>` : ''}
        </div>
    </div>

    <!-- PÁGINA 2: METODOLOGIA E INFORMAÇÕES -->
    <div class="header">
        <div>
            ${logoEmpresa ? `<img src="${logoEmpresa}" alt="Logo" class="logo">` : ''}
        </div>
        <div class="company-info">
            <strong>${nomeEmpresa}</strong><br>
            ${cnpj ? `CNPJ: ${cnpj}<br>` : ''}
            ${endereco ? `${endereco}<br>` : ''}
            ${contato ? `${contato}` : ''}
        </div>
    </div>

    <div class="metodologia">
        <h2 style="margin-top: 0; color: #2c5aa0; font-size: 14pt;">METODOLOGIA APLICADA</h2>
        <p>O presente laudo técnico pericial foi elaborado com base em vistoria <em>in loco</em>, seguindo os critérios estabelecidos pela <strong>NBR 15575 (Norma de Desempenho de Edificações Habitacionais)</strong>, pelo <strong>Código de Defesa do Consumidor (CDC)</strong> e pelo <strong>Código Civil Brasileiro</strong>.</p>
        
        <p>A vistoria foi realizada de forma minuciosa, abrangendo todos os ambientes e sistemas prediais, com registro fotográfico georreferenciado das não conformidades identificadas. Os problemas detectados foram classificados quanto à gravidade (leve, grave ou crítico) e enquadrados nas respectivas garantias legais aplicáveis.</p>
        
        <p>As análises técnicas incluem diagnóstico detalhado, referências normativas, sugestões de reparo e estimativa de prazos de correção, visando fornecer um documento com plena validade jurídica e técnica.</p>
    </div>

    ${vistoria.resumo_executivo ? `
    <div class="summary">
        <div class="summary-title">Resumo Executivo</div>
        <p style="font-size: 11pt; line-height: 1.8;">${vistoria.resumo_executivo}</p>
    </div>
    ` : ''}

    <div class="info-grid">
        <div class="info-item">
            <span class="info-label">Empreendimento:</span>
            ${vistoria.empreendimento}
        </div>
        <div class="info-item">
            <span class="info-label">Unidade:</span>
            ${vistoria.unidade}
        </div>
        <div class="info-item">
            <span class="info-label">Endereço:</span>
            ${vistoria.endereco || 'Não informado'}
        </div>
        <div class="info-item">
            <span class="info-label">Cliente:</span>
            ${vistoria.cliente_nome}
        </div>
        <div class="info-item">
            <span class="info-label">CPF:</span>
            ${vistoria.cliente_cpf || 'Não informado'}
        </div>
        <div class="info-item">
            <span class="info-label">Data da Vistoria:</span>
            ${new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            })}
        </div>
        <div class="info-item">
            <span class="info-label">Vistoriador:</span>
            ${vistoria.vistoriador_nome}
        </div>
        <div class="info-item">
            <span class="info-label">ART/RRT:</span>
            ${vistoria.art_rrt_profissional || 'Não informado'}
        </div>
        <div class="info-item" style="grid-column: 1 / -1;">
            <span class="info-label">Total de Não Conformidades:</span>
            <span style="font-size: 18pt; font-weight: bold; color: ${vistoria.total_nao_conformidades > 0 ? '#dc2626' : '#047857'};">
                ${vistoria.total_nao_conformidades}
            </span>
        </div>
    </div>

    <div class="page-break"></div>

    <!-- GARANTIAS LEGAIS -->
    <div class="garantias-section">
        <div class="garantias-title">Garantias Legais e Contratuais Aplicáveis</div>
        
        <div class="garantia-item">
            <div style="display: flex; justify-between; align-items: center; margin-bottom: 10px;">
                <strong style="font-size: 12pt;">Garantia Legal - Vícios Aparentes</strong>
                <span class="garantia-prazo">90 DIAS</span>
            </div>
            <p style="margin: 8px 0;"><strong>Prazo:</strong> 90 dias a partir da data de recebimento do imóvel</p>
            <p style="margin: 8px 0;"><strong>Base Legal:</strong> Art. 26, inc. II, do Código de Defesa do Consumidor (CDC)</p>
            <p style="margin: 8px 0;"><strong>Cobertura:</strong> Vícios aparentes ou de fácil constatação visíveis na entrega do imóvel</p>
            <p style="margin: 8px 0; font-size: 10pt; color: #555;"><em>Aplicável a defeitos que sejam identificáveis por um consumidor médio sem necessidade de expertise técnica.</em></p>
        </div>
        
        <div class="garantia-item">
            <div style="display: flex; justify-between; align-items: center; margin-bottom: 10px;">
                <strong style="font-size: 12pt;">Garantia Legal - Vícios Ocultos</strong>
                <span class="garantia-prazo">1 ANO</span>
            </div>
            <p style="margin: 8px 0;"><strong>Prazo:</strong> 1 ano a partir da data de recebimento do imóvel ou descoberta do vício</p>
            <p style="margin: 8px 0;"><strong>Base Legal:</strong> Art. 445 do Código Civil Brasileiro</p>
            <p style="margin: 8px 0;"><strong>Cobertura:</strong> Vícios ou defeitos redibitórios (ocultos) que só se revelam após o uso normal do imóvel</p>
            <p style="margin: 8px 0; font-size: 10pt; color: #555;"><em>Inclui problemas que não são imediatamente perceptíveis, mas que comprometem o uso adequado da edificação.</em></p>
        </div>
        
        <div class="garantia-item">
            <div style="display: flex; justify-between; align-items: center; margin-bottom: 10px;">
                <strong style="font-size: 12pt;">Garantia Legal - Solidez e Segurança Estrutural</strong>
                <span class="garantia-prazo">5 ANOS</span>
            </div>
            <p style="margin: 8px 0;"><strong>Prazo:</strong> 5 anos a partir da concessão do habite-se ou entrega do imóvel</p>
            <p style="margin: 8px 0;"><strong>Base Legal:</strong> Art. 618 do Código Civil Brasileiro</p>
            <p style="margin: 8px 0;"><strong>Cobertura:</strong> Solidez e segurança da edificação, incluindo problemas estruturais graves</p>
            <p style="margin: 8px 0; font-size: 10pt; color: #555;"><em>Responsabiliza construtor/incorporador por vícios que comprometam a integridade estrutural da edificação.</em></p>
        </div>
        
        <div class="legal-warning">
            <div class="legal-warning-title">ADVERTÊNCIAS IMPORTANTES:</div>
            <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li>O <strong>mau uso do imóvel</strong> ou modificações não autorizadas podem provocar a <strong>perda das garantias</strong>.</li>
                <li>Materiais que sofrem <strong>desgaste natural</strong> pelo uso (vedantes, calafeções, etc.) devem ser repostos periodicamente pelo usuário.</li>
                <li>Modificações nas <strong>partes comuns da edificação</strong> necessitam aprovação em Assembleia Geral (Art. 10, Lei 4.591/64).</li>
                <li>O <strong>ônus da prova</strong> quanto à natureza do vício (aparente ou oculto) cabe ao fornecedor/construtor.</li>
            </ul>
        </div>
    </div>

    <div class="page-break"></div>

    <!-- NÃO CONFORMIDADES DETALHADAS -->
    ${naoConformidades.length > 0 ? `
        <div class="section-title">Análise Pericial: Não Conformidades Identificadas</div>
        
        ${naoConformidades.map((nc, index) => `
            <div class="nc-item">
                <div class="nc-header">
                    <div>
                        <div class="nc-title">${index + 1}. ${nc.ambiente} - ${nc.item}</div>
                    </div>
                    <div>
                        <span class="nc-badge badge-${nc.detalhes.classificacao || 'leve'}">
                            ${(nc.detalhes.classificacao || 'leve').toUpperCase()}
                        </span>
                    </div>
                </div>

                <div class="nc-content">
                    <div class="nc-text">
                        <span class="nc-label">DESCRIÇÃO DO PROBLEMA:</span>
                        <p>${nc.detalhes.observacao || 'Não conforme'}</p>

                        ${nc.detalhes.garantia_aplicavel ? `
                            <span class="nc-label">GARANTIA APLICÁVEL:</span>
                            <p style="color: #047857; font-weight: bold;">
                                ${nc.detalhes.garantia_aplicavel === 'legal_90_dias' ? '90 dias - Vícios Aparentes (CDC Art. 26, II)' : 
                                  nc.detalhes.garantia_aplicavel === 'legal_1_ano' ? '1 ano - Vícios Ocultos (CC Art. 445)' :
                                  nc.detalhes.garantia_aplicavel === 'legal_5_anos' ? '5 anos - Solidez/Segurança (CC Art. 618)' :
                                  nc.detalhes.garantia_aplicavel}
                            </p>
                        ` : ''}

                        ${nc.detalhes.observacoes_tecnicas_ia ? `
                            <div class="parecer-tecnico">
                                <strong style="color: #1e40af;">PARECER TÉCNICO:</strong>
                                <pre style="white-space: pre-wrap; font-family: inherit; margin: 8px 0 0 0; font-size: 10pt;">${nc.detalhes.observacoes_tecnicas_ia}</pre>
                            </div>
                        ` : ''}

                        ${nc.detalhes.sugestao_correcao ? `
                            <div class="sugestao-reparo">
                                <strong style="color: #047857;">PROCEDIMENTO DE CORREÇÃO:</strong>
                                <pre style="whitespace: pre-wrap; font-family: inherit; margin: 8px 0 0 0; font-size: 10pt;">${nc.detalhes.sugestao_correcao}</pre>
                            </div>
                        ` : ''}
                    </div>

                    <div class="nc-images">
                        ${nc.detalhes.foto_url ? `
                            <div>
                                <div class="image-label">EVIDÊNCIA FOTOGRÁFICA</div>
                                <img src="${nc.detalhes.foto_url}" alt="Evidência" class="evidence-image" />
                                ${nc.detalhes.geolocalizacao ? `
                                    <div class="gps-info">
                                        📍 GPS: ${nc.detalhes.geolocalizacao.latitude.toFixed(6)}, ${nc.detalhes.geolocalizacao.longitude.toFixed(6)}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('')}
    ` : ''}

    <div class="page-break"></div>

    <!-- CHECKLIST COMPLETO -->
    <div class="section-title">Checklist Técnico Detalhado</div>

    ${Object.entries(vistoria.checklist_data).map(([ambiente, itens]) => `
        <h3 style="color: #2c5aa0; font-size: 14pt; margin: 30px 0 15px 0; text-transform: uppercase;">${ambiente}</h3>
        <table class="checklist-table">
            <thead>
                <tr>
                    <th style="width: 45%;">Item Vistoriado</th>
                    <th style="width: 15%;">Status</th>
                    <th style="width: 40%;">Observações</th>
                </tr>
            </thead>
            <tbody>
                ${itens.map(item => `
                    <tr>
                        <td>${item.texto}</td>
                        <td>
                            <span class="status-${item.status === 'conforme' ? 'conforme' : item.status === 'nao_conforme' ? 'nao-conforme' : 'nao-aplica'}">
                                ${item.status === 'conforme' ? 'CONFORME' : item.status === 'nao_conforme' ? 'NÃO CONFORME' : 'N/A'}
                            </span>
                        </td>
                        <td>
                            ${item.status === 'nao_conforme' && item.detalhes ? 
                                item.detalhes.observacao || 'Ver detalhamento acima'
                                : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `).join('')}

    <div class="page-break"></div>

    <!-- TERMO DE ENCERRAMENTO -->
    <div class="section-title">Termo de Encerramento e Aceite</div>
    
    <p style="text-align: justify; line-height: 1.8; margin: 20px 0;">
        Este <strong>Laudo Técnico Pericial</strong> atesta que a vistoria foi realizada conforme os padrões técnicos adequados e a metodologia descrita, tendo sido identificados e documentados todos os itens relacionados neste documento. 
    </p>
    
    <p style="text-align: justify; line-height: 1.8; margin: 20px 0;">
        O(s) cliente(s)/comprador(es), através de sua(s) assinatura(s), declara(m) estar ciente(s) das condições do imóvel conforme apresentado neste laudo, bem como das <strong>garantias legais aplicáveis</strong> e dos <strong>prazos para correção</strong> das não conformidades identificadas.
    </p>
    
    <div class="legal-warning">
        <div class="legal-warning-title">DIREITOS DO CONSUMIDOR:</div>
        <p style="line-height: 1.8;">
            Os problemas identificados neste laudo estão cobertos pelas <strong>garantias legais</strong> mencionadas nas seções anteriores, devendo ser corrigidos pelo <strong>construtor/incorporador</strong> dentro dos prazos estabelecidos pela legislação vigente (CDC e Código Civil).
        </p>
        <p style="line-height: 1.8; margin-top: 10px;">
            Em caso de <strong>recusa ou omissão</strong> na correção das não conformidades dentro dos prazos legais, o consumidor poderá exigir, alternativamente e à sua escolha (Art. 18, CDC):
        </p>
        <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
            <li>A <strong>substituição do produto</strong> por outro da mesma espécie;</li>
            <li>A <strong>restituição imediata</strong> da quantia paga, monetariamente atualizada;</li>
            <li>O <strong>abatimento proporcional</strong> do preço.</li>
        </ul>
    </div>

    <div class="signatures">
        <div class="signature">
            ${vistoria.assinatura_cliente ? `<img src="${vistoria.assinatura_cliente}" alt="Assinatura Cliente" class="signature-img">` : '<div style="height: 80px;"></div>'}
            <div class="signature-name">${vistoria.cliente_nome}</div>
            <div class="signature-role">Cliente/Comprador</div>
            ${vistoria.cliente_cpf ? `<div class="signature-doc">CPF: ${vistoria.cliente_cpf}</div>` : ''}
            <div class="signature-doc" style="margin-top: 8px;">
                Data: ${new Date().toLocaleDateString('pt-BR')}
            </div>
        </div>
        <div class="signature">
            ${vistoria.assinatura_vistoriador ? `<img src="${vistoria.assinatura_vistoriador}" alt="Assinatura Vistoriador" class="signature-img">` : '<div style="height: 80px;"></div>'}
            <div class="signature-name">${vistoria.vistoriador_nome}</div>
            <div class="signature-role">Vistoriador Responsável</div>
            ${vistoria.art_rrt_profissional ? `<div class="signature-doc">ART/RRT: ${vistoria.art_rrt_profissional}</div>` : ''}
            <div class="signature-doc" style="margin-top: 8px;">
                Data: ${new Date().toLocaleDateString('pt-BR')}
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>${nomeEmpresa}</strong></p>
        <p>Laudo gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <p style="font-size: 8pt; color: #999; margin-top: 10px;">
            Este documento foi gerado digitalmente e possui validade jurídica conforme MP 2.200-2/2001
        </p>
    </div>
</body>
</html>`;
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

  if (!vistoria) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vistoria não encontrada</h1>
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Laudo Técnico Pericial</h1>
              <p className="text-gray-600">{vistoria.empreendimento} • {vistoria.cliente_nome}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {vistoria.total_nao_conformidades > 0 && !vistoria.resumo_executivo && (
              <Button
                onClick={gerarResumoExecutivo}
                disabled={gerandoResumo}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                {gerandoResumo ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Gerar Resumo IA
              </Button>
            )}

            <Button onClick={() => setShareModalOpen(true)} variant="outline">
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar
            </Button>

            <Button onClick={gerarPDF} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
              <Download className="w-5 h-5 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </motion.div>

        {/* Preview do Laudo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Pré-visualização do Laudo Pericial
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Cabeçalho do Laudo */}
              <div className="flex justify-between items-start border-b-2 pb-6 mb-8">
                <div>
                  {configuracao?.logo_url && (
                    <img
                      src={configuracao.logo_url}
                      alt="Logo"
                      className="max-w-32 max-h-16 mb-2"
                    />
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div className="font-semibold">{configuracao?.nome_empresa || 'Empresa de Vistorias'}</div>
                  {configuracao?.cnpj && <div>CNPJ: {configuracao.cnpj}</div>}
                  {configuracao?.endereco && <div>{configuracao.endereco}</div>}
                  {(configuracao?.telefone || configuracao?.email) && (
                    <div>{configuracao.telefone || configuracao.email}</div>
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
                LAUDO TÉCNICO PERICIAL DE VISTORIA DE IMÓVEL
              </h1>

              {/* Resumo Executivo */}
              {vistoria.resumo_executivo && (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
                  <h2 className="text-lg font-semibold text-yellow-800 mb-3">Resumo Executivo</h2>
                  <p className="text-gray-700 leading-relaxed">{vistoria.resumo_executivo}</p>
                </div>
              )}

              {/* Informações Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg mb-8">
                <div>
                  <span className="font-semibold text-gray-700">Empreendimento:</span>
                  <div>{vistoria.empreendimento}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Unidade:</span>
                  <div>{vistoria.unidade}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Cliente:</span>
                  <div>{vistoria.cliente_nome}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Data:</span>
                  <div>{new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">ART/RRT do Profissional:</span>
                  <div>{vistoria.art_rrt_profissional || 'Não informado'}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Não Conformidades:</span>
                  <div className={`font-bold ${vistoria.total_nao_conformidades > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {vistoria.total_nao_conformidades}
                  </div>
                </div>
              </div>

              {/* Seção de Garantias Legais (Preview) */}
              <div className="bg-blue-50 border-2 border-blue-600 p-6 rounded-lg mb-8">
                <h2 className="text-lg font-bold text-blue-800 mb-4">GARANTIAS LEGAIS E CONTRATUAIS</h2>

                <div className="bg-white p-4 rounded-md border-l-4 border-blue-600 mb-3">
                  <strong>Garantia Legal - Vícios Aparentes (90 dias)</strong><br />
                  <span className="font-bold text-emerald-700">Prazo:</span> 90 dias a partir da data de recebimento do imóvel<br />
                  <strong>Base Legal:</strong> Art. 26, inc. II, do Código de Defesa do Consumidor<br />
                  <strong>Cobertura:</strong> Vícios aparentes ou de fácil constatação
                </div>

                <div className="bg-white p-4 rounded-md border-l-4 border-blue-600 mb-3">
                  <strong>Garantia Legal - Vícios Ocultos (1 ano)</strong><br />
                  <span className="font-bold text-emerald-700">Prazo:</span> 1 ano a partir da data de recebimento do imóvel<br />
                  <strong>Base Legal:</strong> Art. 445 do Código Civil Brasileiro<br />
                  <strong>Cobertura:</strong> Vícios ou defeitos redibitórios (ocultos)
                </div>

                <div className="bg-white p-4 rounded-md border-l-4 border-blue-600 mb-3">
                  <strong>Garantia Legal - Estrutural (5 anos)</strong><br />
                  <span className="font-bold text-emerald-700">Prazo:</span> 5 anos a partir da concessão do habite-se<br />
                  <strong>Base Legal:</strong> Art. 618 do Código Civil Brasileiro<br />
                  <strong>Cobertura:</strong> Solidez e segurança da edificação
                </div>

                <div className="bg-amber-50 border border-amber-400 p-4 rounded-md mt-4 text-sm">
                  <strong>ADVERTÊNCIAS IMPORTANTES:</strong><br />
                  • O mau uso do imóvel provoca a perda das garantias<br />
                  • Materiais de desgaste natural (vedantes, etc.) devem ser repostos pelo usuário<br />
                  • Modificações nas partes comuns necessitam aprovação em Assembleia Geral (Art. 10, Lei 4.591/64)
                </div>
              </div>

              {/* Checklist por Ambiente */}
              <div className="space-y-8">
                {Object.entries(vistoria.checklist_data).map(([ambiente, itens]) => (
                  <div key={ambiente}>
                    <h3 className="text-lg font-semibold bg-gray-200 p-3 rounded mb-4">
                      {ambiente.toUpperCase()}
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-3 text-left font-semibold">
                              Item Vistoriado
                            </th>
                            <th className="border border-gray-300 p-3 text-left font-semibold w-24">
                              Status
                            </th>
                            <th className="border border-gray-300 p-3 text-left font-semibold">
                              Observações e Evidências
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map((item, index) => (
                            <tr key={index} className={item.status === 'nao_conforme' ? 'bg-red-50' : ''}>
                              <td className="border border-gray-300 p-3">
                                {item.texto}
                              </td>
                              <td className="border border-gray-300 p-3">
                                {getStatusBadge(item.status)}
                              </td>
                              <td className="border border-gray-300 p-3">
                                {item.status === 'nao_conforme' && item.detalhes && (
                                  <div>
                                    <strong className="text-red-600">PROBLEMA IDENTIFICADO:</strong><br />
                                    {item.detalhes.observacao && (
                                      <p className="mb-2">{item.detalhes.observacao}</p>
                                    )}
                                    {item.detalhes.foto_url && (
                                      <img
                                        src={item.detalhes.foto_url}
                                        alt="Evidência"
                                        className="max-w-48 h-32 object-cover rounded border"
                                      />
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assinaturas */}
              <div className="mt-16 pt-8 border-t-2">
                <h3 className="text-lg font-semibold mb-6">TERMO DE ENCERRAMENTO E ACEITE</h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                  Este documento atesta que a vistoria foi realizada conforme os padrões técnicos adequados,
                  tendo sido identificados os itens relacionados acima. O cliente/comprador, através de sua assinatura,
                  declara estar ciente das condições do imóvel conforme apresentado neste laudo.
                </p>
                <p className="text-gray-700 mb-8 leading-relaxed font-bold">
                  IMPORTANTE: Os problemas identificados neste laudo estão cobertos pelas garantias legais
                  mencionadas acima, devendo ser corrigidos pelo construtor/incorporador dentro dos prazos estabelecidos pela legislação.
                </p>

                <div className="flex flex-col md:flex-row justify-around items-center text-center gap-8">
                  <div>
                    <div className="border-b-2 border-gray-800 w-64 h-24 mb-2 flex items-end justify-center">
                      {vistoria.assinatura_cliente && (
                        <img
                          src={vistoria.assinatura_cliente}
                          alt="Assinatura Cliente"
                          className="max-w-full max-h-full"
                        />
                      )}
                    </div>
                    <div className="font-semibold">{vistoria.cliente_nome}</div>
                    <div className="text-sm text-gray-600">Cliente/Comprador</div>
                    {vistoria.cliente_cpf && (
                      <div className="text-sm text-gray-600">CPF: {vistoria.cliente_cpf}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Data: {new Date().toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div>
                    <div className="border-b-2 border-gray-800 w-64 h-24 mb-2 flex items-end justify-center">
                      {vistoria.assinatura_vistoriador && (
                        <img
                          src={vistoria.assinatura_vistoriador}
                          alt="Assinatura Vistoriador"
                          className="max-w-full max-h-full"
                        />
                      )}
                    </div>
                    <div className="font-semibold">{vistoria.vistoriador_nome}</div>
                    <div className="text-sm text-gray-600">Vistoriador Responsável</div>
                    <div className="text-sm text-gray-600">
                      {configuracao?.nome_empresa || 'Empresa de Vistorias'}
                    </div>
                    {vistoria.art_rrt_profissional && (
                      <div className="text-sm text-gray-600">ART/RRT: {vistoria.art_rrt_profissional}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Data: {new Date().toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Modal */}
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compartilhar Laudo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Copiar Link do Laudo</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={copiarLink}
                  >
                    {linkCopiado ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Link Copiado!
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Copiar Link
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Copie o link e compartilhe por email, SMS ou qualquer outro meio
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Enviar por WhatsApp</label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={compartilharPorWhatsApp}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Compartilhar no WhatsApp
                </Button>
                <p className="text-xs text-gray-500">
                  Abrirá o WhatsApp com uma mensagem pronta contendo o link do laudo
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}