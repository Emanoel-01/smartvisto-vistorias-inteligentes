import { useState, useEffect } from 'react';
import { Vistoria } from '@/entities/Vistoria';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import GestaoNaoConformidade from "../components/naoconformidade/GestaoNaoConformidade";
import GarantiaInfo from "../components/garantias/GarantiaInfo";

export default function GestaoNaoConformidadePage() {
  const [vistoria, setVistoria] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } else {
        alert('Vistoria não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar vistoria:', error);
    } finally {
      setLoading(false);
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
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Não Conformidades</h1>
            <p className="text-gray-600">{vistoria.empreendimento} • {vistoria.cliente_nome}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Gestão de NC */}
          <div className="lg:col-span-2">
            <GestaoNaoConformidade vistoria={vistoria} />
          </div>

          {/* Coluna Lateral - Informações de Garantia */}
          <div className="lg:col-span-1">
            <GarantiaInfo vistoria={vistoria} />
          </div>
        </div>
      </div>
    </div>
  );
}