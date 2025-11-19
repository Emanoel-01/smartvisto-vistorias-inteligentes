
import { useState, useEffect } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import AssinaturaDigital from "../components/vistoria/AssinaturaDigital";

export default function Assinaturas() {
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [assinaturas, setAssinaturas] = useState({
    cliente: null,
    vistoriador: null
  });

  const vistoriaId = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (vistoriaId) {
      carregarVistoria();
    }
  }, [vistoriaId]);

  const carregarVistoria = async () => {
    try {
      const dados = await Vistoria.list();
      const vistoriaEncontrada = dados.find(v => v.id === vistoriaId);
      
      if (vistoriaEncontrada) {
        setVistoria(vistoriaEncontrada);
        setAssinaturas({
          cliente: vistoriaEncontrada.assinatura_cliente || null,
          vistoriador: vistoriaEncontrada.assinatura_vistoriador || null
        });
      } else {
        alert('Vistoria não encontrada');
        navigate(createPageUrl('Dashboard'));
      }
    } catch (error) {
      console.error('Erro ao carregar vistoria:', error);
      navigate(createPageUrl('Dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const handleAssinaturaChange = (tipo, dataUrl) => {
    setAssinaturas(prev => ({
      ...prev,
      [tipo]: dataUrl
    }));
  };

  const finalizarVistoria = async () => {
    if (!assinaturas.cliente || !assinaturas.vistoriador) {
      alert('Ambas as assinaturas são obrigatórias');
      return;
    }

    setSalvando(true);
    try {
      await Vistoria.update(vistoria.id, {
        assinatura_cliente: assinaturas.cliente,
        assinatura_vistoriador: assinaturas.vistoriador,
        status: 'concluida'
      });

      navigate(createPageUrl(`LaudoPDF?id=${vistoria.id}`));
    } catch (error) {
      console.error('Erro ao finalizar vistoria:', error);
      alert('Erro ao finalizar vistoria');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vistoria) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl(`EditarVistoria?id=${vistoria.id}`)}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assinaturas Digitais</h1>
            <p className="text-gray-600">Finalize a vistoria com as assinaturas do cliente e vistoriador</p>
          </div>
        </motion.div>

        {/* Resumo da Vistoria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resumo da Vistoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Empreendimento</p>
                  <p className="font-semibold">{vistoria.empreendimento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unidade</p>
                  <p className="font-semibold">{vistoria.unidade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold">{vistoria.cliente_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data da Vistoria</p>
                  <p className="font-semibold">
                    {new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                 <div>
                  <p className="text-sm text-gray-500">ART/RRT</p>
                  <p className="font-semibold">{vistoria.art_rrt_profissional || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Não Conformidades</p>
                  <p className={`font-semibold ${vistoria.total_nao_conformidades > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {vistoria.total_nao_conformidades}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Assinaturas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Colete as Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <AssinaturaDigital
                titulo="Assinatura do Cliente/Comprador"
                nome={vistoria.cliente_nome}
                onAssinaturaChange={(dataUrl) => handleAssinaturaChange('cliente', dataUrl)}
                assinaturaExistente={assinaturas.cliente}
              />

              <AssinaturaDigital
                titulo="Assinatura do Vistoriador"
                nome={vistoria.vistoriador_nome}
                onAssinaturaChange={(dataUrl) => handleAssinaturaChange('vistoriador', dataUrl)}
                assinaturaExistente={assinaturas.vistoriador}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Botão de Finalização */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          className="flex justify-end mt-8"
        >
          <Button
            onClick={finalizarVistoria}
            disabled={!assinaturas.cliente || !assinaturas.vistoriador || salvando}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg px-8"
          >
            {salvando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Finalizando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Finalizar Vistoria e Gerar Laudo
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
