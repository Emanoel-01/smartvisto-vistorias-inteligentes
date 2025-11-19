import { useState, useEffect, useCallback } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { ReVistoria } from '@/entities/ReVistoria';
import { NaoConformidade } from '@/entities/NaoConformidade';
import { ConfiguracaoEmpresa } from '@/entities/ConfiguracaoEmpresa';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, XCircle, AlertTriangle, Share2, MessageSquare, Link as LinkIcon, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

export default function LaudoReVistoria() {
  const [reVistoria, setReVistoria] = useState(null);
  const [vistoriaOriginal, setVistoriaOriginal] = useState(null);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [configuracao, setConfiguracao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const reVistoriaId = new URLSearchParams(window.location.search).get('id');

  const carregarDados = useCallback(async () => {
    try {
      const [reVistoriasData, vistoriasData, ncData, configData] = await Promise.all([
        ReVistoria.list(),
        Vistoria.list(),
        NaoConformidade.list(),
        ConfiguracaoEmpresa.list()
      ]);

      const reVistoriaEncontrada = reVistoriasData.find(rv => rv.id === reVistoriaId);
      if (!reVistoriaEncontrada) {
        console.error('Re-vistoria não encontrada');
        setLoading(false);
        return;
      }
      setReVistoria(reVistoriaEncontrada);

      const vistoriaOrig = vistoriasData.find(v => v.id === reVistoriaEncontrada.vistoria_original_id);
      setVistoriaOriginal(vistoriaOrig);

      const ncsVerificadas = ncData.filter(nc => 
        reVistoriaEncontrada.itens_para_verificar.includes(nc.id)
      );
      setNaoConformidades(ncsVerificadas);

      setConfiguracao(configData[0] || null);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [reVistoriaId]);

  useEffect(() => {
    if (reVistoriaId) {
      carregarDados();
    }
  }, [reVistoriaId, carregarDados]);

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
    const mensagem = `Olá! Segue o laudo de re-vistoria do imóvel:

📍 Empreendimento: ${vistoriaOriginal?.empreendimento}
🏠 Unidade: ${vistoriaOriginal?.unidade}
📅 Data da Re-Vistoria: ${new Date(reVistoria?.data_agendada).toLocaleDateString('pt-BR')}

Para visualizar o laudo completo, acesse: ${linkLaudo}`;
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const gerarPDF = () => {
    const conteudoPDF = gerarConteudoHTML();
    const janela = window.open('', '_blank');
    janela.document.write(conteudoPDF);
    janela.document.close();
    janela.print();
  };

  const gerarConteudoHTML = () => {
    if (!reVistoria || !vistoriaOriginal) return '';

    const nomeEmpresa = configuracao?.nome_empresa || 'Empresa de Vistorias';
    const logoEmpresa = configuracao?.logo_url || '';
    const cnpj = configuracao?.cnpj || '';
    const endereco = configuracao?.endereco || '';
    const contato = configuracao?.telefone || configuracao?.email || '';

    const itensCorrigidos = naoConformidades.filter(nc => nc.status_na_revistoria === 'Corrigido').length;
    const itensParcialmenteCorrigidos = naoConformidades.filter(nc => nc.status_na_revistoria === 'Parcialmente Corrigido').length;
    const itensNaoCorrigidos = naoConformidades.filter(nc => nc.status_na_revistoria === 'Não Corrigido').length;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laudo de Re-Vistoria - ${vistoriaOriginal.empreendimento}</title>
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
        .summary-box {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 3px solid #3b82f6;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .summary-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }
        .stat-box {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border-left: 4px solid;
        }
        .stat-box.corrigido { border-left-color: #10b981; }
        .stat-box.parcial { border-left-color: #f59e0b; }
        .stat-box.nao-corrigido { border-left-color: #ef4444; }
        .stat-number {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
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
        .item-revistoria {
            background-color: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
        }
        .item-title {
            font-size: 13pt;
            font-weight: bold;
            color: #1f2937;
        }
        .status-badge {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-corrigido { background-color: #d1fae5; color: #065f46; border: 2px solid #10b981; }
        .status-parcial { background-color: #fef3c7; color: #92400e; border: 2px solid #f59e0b; }
        .status-nao-corrigido { background-color: #fee2e2; color: #991b1b; border: 2px solid #ef4444; }
        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        .before-after-box {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
        }
        .before-after-box h4 {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .before-after-box.before h4 { color: #dc2626; }
        .before-after-box.after h4 { color: #059669; }
        .evidence-image { 
            width: 100%;
            max-height: 250px;
            object-fit: cover;
            border-radius: 6px;
            border: 2px solid #9ca3af;
            margin-top: 10px;
        }
        .observation-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin-top: 15px;
            border-radius: 4px;
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
        
        <div class="title">LAUDO DE RE-VISTORIA<br/>VERIFICAÇÃO DE CORREÇÕES</div>
        
        <div class="subtitle">
            <strong>Empreendimento:</strong> ${vistoriaOriginal.empreendimento}<br/>
            <strong>Unidade:</strong> ${vistoriaOriginal.unidade}
        </div>
        
        <div style="margin-top: 60px; font-size: 11pt; color: #555;">
            <p><strong>Cliente:</strong> ${vistoriaOriginal.cliente_nome}</p>
            <p><strong>Data da Vistoria Original:</strong> ${new Date(vistoriaOriginal.data_vistoria).toLocaleDateString('pt-BR')}</p>
            <p><strong>Data da Re-Vistoria:</strong> ${new Date(reVistoria.data_agendada).toLocaleDateString('pt-BR')}</p>
            <p><strong>Vistoriador Responsável:</strong> ${reVistoria.vistoriador_nome}</p>
        </div>
        
        <div style="position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; font-size: 10pt; color: #666;">
            <p><strong>${nomeEmpresa}</strong></p>
            ${cnpj ? `<p>CNPJ: ${cnpj}</p>` : ''}
            ${endereco ? `<p>${endereco}</p>` : ''}
            ${contato ? `<p>${contato}</p>` : ''}
        </div>
    </div>

    <!-- PÁGINA 2: INFORMAÇÕES E RESULTADOS -->
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

    <h1 style="text-align: center; font-size: 22pt; margin-bottom: 40px;">LAUDO DE RE-VISTORIA - TRILHA DE AUDITORIA</h1>

    <div class="info-grid">
        <div class="info-item">
            <span class="info-label">Empreendimento:</span>
            ${vistoriaOriginal.empreendimento}
        </div>
        <div class="info-item">
            <span class="info-label">Unidade:</span>
            ${vistoriaOriginal.unidade}
        </div>
        <div class="info-item">
            <span class="info-label">Cliente:</span>
            ${vistoriaOriginal.cliente_nome}
        </div>
        <div class="info-item">
            <span class="info-label">Data da Vistoria Original:</span>
            ${new Date(vistoriaOriginal.data_vistoria).toLocaleDateString('pt-BR')}
        </div>
        <div class="info-item">
            <span class="info-label">Data da Re-Vistoria:</span>
            ${new Date(reVistoria.data_agendada).toLocaleDateString('pt-BR')}
        </div>
        <div class="info-item">
            <span class="info-label">Vistoriador Responsável:</span>
            ${reVistoria.vistoriador_nome}
        </div>
    </div>

    <div class="summary-box">
        <div class="summary-title">Resumo da Re-Vistoria</div>
        <p style="font-size: 11pt; line-height: 1.8; margin-bottom: 20px;">
            <strong>Motivo:</strong> ${reVistoria.motivo}
        </p>
        ${reVistoria.observacoes ? `
        <p style="font-size: 11pt; line-height: 1.8; margin-bottom: 20px;">
            <strong>Observações Gerais:</strong> ${reVistoria.observacoes}
        </p>
        ` : ''}
        
        <div class="stats-grid">
            <div class="stat-box corrigido">
                <div class="stat-number" style="color: #10b981;">${itensCorrigidos}</div>
                <div class="stat-label">Itens Corrigidos</div>
            </div>
            <div class="stat-box parcial">
                <div class="stat-number" style="color: #f59e0b;">${itensParcialmenteCorrigidos}</div>
                <div class="stat-label">Parcialmente Corrigidos</div>
            </div>
            <div class="stat-box nao-corrigido">
                <div class="stat-number" style="color: #ef4444;">${itensNaoCorrigidos}</div>
                <div class="stat-label">Não Corrigidos</div>
            </div>
        </div>
    </div>

    <div class="page-break"></div>

    <!-- DETALHAMENTO DOS ITENS VERIFICADOS -->
    <div class="section-title">Detalhamento dos Itens Verificados</div>

    ${naoConformidades.map((nc, index) => `
        <div class="item-revistoria">
            <div class="item-header">
                <div>
                    <div class="item-title">${index + 1}. ${nc.ambiente} - ${nc.item_texto}</div>
                    <p style="font-size: 10pt; color: #666; margin-top: 5px;">
                        Classificação Original: <strong>${(nc.classificacao || 'leve').toUpperCase()}</strong>
                    </p>
                </div>
                <div>
                    <span class="status-badge status-${
                        nc.status_na_revistoria === 'Corrigido' ? 'corrigido' :
                        nc.status_na_revistoria === 'Parcialmente Corrigido' ? 'parcial' :
                        'nao-corrigido'
                    }">
                        ${nc.status_na_revistoria || 'Não Verificado'}
                    </span>
                </div>
            </div>

            <div class="comparison-grid">
                <div class="before-after-box before">
                    <h4>❌ PROBLEMA ORIGINAL (ANTES)</h4>
                    <p style="font-size: 10pt; margin-bottom: 10px;">${nc.descricao_problema}</p>
                    ${nc.foto_url_before || nc.foto_url ? `
                        <img src="${nc.foto_url_before || nc.foto_url}" alt="Foto Antes" class="evidence-image" />
                        ${nc.geolocalizacao ? `
                            <p style="font-size: 8pt; color: #666; margin-top: 5px; text-align: center;">
                                📍 GPS: ${nc.geolocalizacao.latitude.toFixed(6)}, ${nc.geolocalizacao.longitude.toFixed(6)}
                            </p>
                        ` : ''}
                    ` : '<p style="font-size: 9pt; color: #999; font-style: italic;">Foto não disponível</p>'}
                </div>

                <div class="before-after-box after">
                    <h4>${nc.status_na_revistoria === 'Corrigido' ? '✅' : nc.status_na_revistoria === 'Parcialmente Corrigido' ? '⚠️' : '❌'} VERIFICAÇÃO DA RE-VISTORIA (DEPOIS)</h4>
                    ${nc.observacoes_correcao ? `
                        <p style="font-size: 10pt; margin-bottom: 10px;"><strong>Observações:</strong> ${nc.observacoes_correcao}</p>
                    ` : '<p style="font-size: 9pt; color: #999; font-style: italic; margin-bottom: 10px;">Sem observações registradas</p>'}
                    ${nc.foto_url_after ? `
                        <img src="${nc.foto_url_after}" alt="Foto Depois" class="evidence-image" />
                    ` : '<p style="font-size: 9pt; color: #999; font-style: italic;">Foto pós-reparo não disponível</p>'}
                </div>
            </div>

            ${nc.observacoes_tecnicas_ia ? `
                <div class="observation-box">
                    <strong style="color: #1e40af;">📋 ANÁLISE TÉCNICA ORIGINAL:</strong>
                    <p style="font-size: 10pt; margin: 8px 0 0 0; white-space: pre-wrap;">${nc.observacoes_tecnicas_ia}</p>
                </div>
            ` : ''}
        </div>
    `).join('')}

    <div class="page-break"></div>

    <!-- CONCLUSÃO E ASSINATURAS -->
    <div class="section-title">Conclusão da Re-Vistoria</div>

    <p style="text-align: justify; line-height: 1.8; margin: 20px 0;">
        Este laudo de re-vistoria documenta a verificação realizada em <strong>${new Date(reVistoria.data_agendada).toLocaleDateString('pt-BR')}</strong> para confirmar o status das correções dos problemas identificados na vistoria original realizada em <strong>${new Date(vistoriaOriginal.data_vistoria).toLocaleDateString('pt-BR')}</strong>.
    </p>

    <p style="text-align: justify; line-height: 1.8; margin: 20px 0;">
        Dos <strong>${naoConformidades.length}</strong> itens verificados nesta re-vistoria:
    </p>

    <ul style="line-height: 1.8; margin: 20px 0 20px 40px;">
        <li><strong style="color: #10b981;">${itensCorrigidos} ${itensCorrigidos === 1 ? 'item foi' : 'itens foram'} CORRIGIDO(S)</strong> de acordo com as especificações técnicas</li>
        ${itensParcialmenteCorrigidos > 0 ? `
            <li><strong style="color: #f59e0b;">${itensParcialmenteCorrigidos} ${itensParcialmenteCorrigidos === 1 ? 'item está' : 'itens estão'} PARCIALMENTE CORRIGIDO(S)</strong>, necessitando ajustes complementares</li>
        ` : ''}
        ${itensNaoCorrigidos > 0 ? `
            <li><strong style="color: #ef4444;">${itensNaoCorrigidos} ${itensNaoCorrigidos === 1 ? 'item permanece' : 'itens permanecem'} NÃO CORRIGIDO(S)</strong>, exigindo intervenção imediata</li>
        ` : ''}
    </ul>

    ${itensCorrigidos === naoConformidades.length ? `
        <div style="background-color: #d1fae5; border: 3px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="font-size: 12pt; font-weight: bold; color: #065f46; text-align: center; margin: 0;">
                ✅ TODAS AS NÃO CONFORMIDADES FORAM CORRIGIDAS COM SUCESSO
            </p>
            <p style="font-size: 10pt; color: #047857; text-align: center; margin: 10px 0 0 0;">
                O imóvel encontra-se em conformidade com os padrões técnicos exigidos.
            </p>
        </div>
    ` : `
        <div style="background-color: #fef3c7; border: 3px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="font-size: 11pt; font-weight: bold; color: #92400e; margin-bottom: 10px;">
                ⚠️ ATENÇÃO: CORREÇÕES PENDENTES
            </p>
            <p style="font-size: 10pt; color: #78350f; line-height: 1.6;">
                Este laudo documenta que ainda existem não conformidades pendentes de correção. As garantias legais permanecem em vigência para os itens não corrigidos, devendo o responsável promover as correções no prazo estabelecido pela legislação vigente.
            </p>
        </div>
    `}

    <div class="footer">
        <p><strong>${nomeEmpresa}</strong></p>
        <p>Laudo de Re-Vistoria gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <p style="font-size: 8pt; color: #999; margin-top: 10px;">
            Este documento constitui trilha de auditoria completa das correções realizadas e possui validade jurídica conforme MP 2.200-2/2001
        </p>
    </div>
</body>
</html>`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Corrigido':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'Não Corrigido':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'Parcialmente Corrigido':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Corrigido':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Não Corrigido':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Parcialmente Corrigido':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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

  if (!reVistoria || !vistoriaOriginal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Re-vistoria não encontrada</h1>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados da re-vistoria.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const itensCorrigidos = naoConformidades.filter(nc => nc.status_na_revistoria === 'Corrigido').length;
  const itensParcialmenteCorrigidos = naoConformidades.filter(nc => nc.status_na_revistoria === 'Parcialmente Corrigido').length;
  const itensNaoCorrigidos = naoConformidades.filter(nc => nc.status_na_revistoria === 'Não Corrigido').length;

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
            <Link to={createPageUrl(`DetalhesVistoria?id=${vistoriaOriginal.id}`)}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Laudo de Re-Vistoria</h1>
              <p className="text-gray-600">{vistoriaOriginal.empreendimento} • {vistoriaOriginal.unidade}</p>
            </div>
          </div>

          <div className="flex gap-3">
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

        {/* Card de Informações Gerais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle>Informações da Re-Vistoria</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Empreendimento</p>
                  <p className="font-semibold">{vistoriaOriginal.empreendimento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unidade</p>
                  <p className="font-semibold">{vistoriaOriginal.unidade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold">{vistoriaOriginal.cliente_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data da Vistoria Original</p>
                  <p className="font-semibold">
                    {new Date(vistoriaOriginal.data_vistoria).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data da Re-Vistoria</p>
                  <p className="font-semibold">
                    {new Date(reVistoria.data_agendada).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vistoriador Responsável</p>
                  <p className="font-semibold">{reVistoria.vistoriador_nome}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-2">Motivo da Re-Vistoria</p>
                <p className="font-semibold">{reVistoria.motivo}</p>
                {reVistoria.observacoes && (
                  <>
                    <p className="text-sm text-gray-500 mt-4 mb-2">Observações Gerais</p>
                    <p className="text-gray-700">{reVistoria.observacoes}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card de Resumo de Resultados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="mb-8"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardTitle>Resumo de Resultados</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-green-700">{itensCorrigidos}</p>
                  <p className="text-sm text-green-600 font-medium">Itens Corrigidos</p>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-orange-700">{itensParcialmenteCorrigidos}</p>
                  <p className="text-sm text-orange-600 font-medium">Parcialmente Corrigidos</p>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                  <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-red-700">{itensNaoCorrigidos}</p>
                  <p className="text-sm text-red-600 font-medium">Não Corrigidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detalhamento dos Itens Verificados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Detalhamento dos Itens Verificados</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {naoConformidades.map((nc, index) => (
                <div key={nc.id} className="border-2 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {index + 1}. {nc.ambiente} - {nc.item_texto}
                      </h3>
                      <Badge variant="outline" className="mt-2">
                        Classificação: {(nc.classificacao || 'leve').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(nc.status_na_revistoria)}
                      <Badge className={`${getStatusBadgeClass(nc.status_na_revistoria)} border-2`}>
                        {nc.status_na_revistoria || 'Não Verificado'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Problema Original */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Problema Original (ANTES)
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">{nc.descricao_problema}</p>
                      {(nc.foto_url_before || nc.foto_url) && (
                        <img
                          src={nc.foto_url_before || nc.foto_url}
                          alt="Foto Antes"
                          className="w-full h-48 object-cover rounded border-2 border-red-300"
                        />
                      )}
                      {!nc.foto_url_before && !nc.foto_url && (
                        <p className="text-xs text-gray-500 italic">Foto não disponível</p>
                      )}
                    </div>

                    {/* Verificação na Re-Vistoria */}
                    <div className={`${
                      nc.status_na_revistoria === 'Corrigido' ? 'bg-green-50 border-green-200' :
                      nc.status_na_revistoria === 'Parcialmente Corrigido' ? 'bg-orange-50 border-orange-200' :
                      'bg-red-50 border-red-200'
                    } border-2 rounded-lg p-4`}>
                      <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                        nc.status_na_revistoria === 'Corrigido' ? 'text-green-800' :
                        nc.status_na_revistoria === 'Parcialmente Corrigido' ? 'text-orange-800' :
                        'text-red-800'
                      }`}>
                        {getStatusIcon(nc.status_na_revistoria)}
                        Verificação na Re-Vistoria (DEPOIS)
                      </h4>
                      {nc.observacoes_correcao ? (
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Observações:</strong> {nc.observacoes_correcao}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 italic mb-3">Sem observações registradas</p>
                      )}
                      {nc.foto_url_after ? (
                        <img
                          src={nc.foto_url_after}
                          alt="Foto Depois"
                          className={`w-full h-48 object-cover rounded border-2 ${
                            nc.status_na_revistoria === 'Corrigido' ? 'border-green-300' :
                            nc.status_na_revistoria === 'Parcialmente Corrigido' ? 'border-orange-300' :
                            'border-red-300'
                          }`}
                        />
                      ) : (
                        <p className="text-xs text-gray-500 italic">Foto pós-reparo não disponível</p>
                      )}
                    </div>
                  </div>

                  {nc.observacoes_tecnicas_ia && (
                    <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-sm font-semibold text-blue-900 mb-2">📋 Análise Técnica Original:</p>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{nc.observacoes_tecnicas_ia}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Modal */}
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compartilhar Laudo de Re-Vistoria</DialogTitle>
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