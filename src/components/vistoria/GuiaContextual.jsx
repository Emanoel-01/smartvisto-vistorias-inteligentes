import { useState, useEffect, useCallback } from 'react';
import { GuiaVistoria } from '@/entities/GuiaVistoria';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookOpen, Lightbulb, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function GuiaContextual({ ambiente, categoria = null }) {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const carregarGuias = useCallback(async () => {
    setLoading(true);
    try {
      const todosGuias = await GuiaVistoria.list();
      
      const guiasFiltrados = todosGuias.filter(guia => {
        const matchAmbiente = guia.ambiente_aplicavel && 
          (guia.ambiente_aplicavel.includes(ambiente) || 
           guia.ambiente_aplicavel.includes('Todos os ambientes'));
        
        const matchCategoria = !categoria || guia.categoria === categoria;
        
        return matchAmbiente && matchCategoria;
      });

      setGuias(guiasFiltrados);
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
    } finally {
      setLoading(false);
    }
  }, [ambiente, categoria]);

  useEffect(() => {
    if (open) {
      carregarGuias();
    }
  }, [open, carregarGuias]);

  const getCategoriaColor = (cat) => {
    const cores = {
      'Técnicas Manuais': 'bg-blue-100 text-blue-800 border-blue-200',
      'Equipamentos Essenciais': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Tecnologias 4.0': 'bg-purple-100 text-purple-800 border-purple-200',
      'Boas Práticas Gerais': 'bg-amber-100 text-amber-800 border-amber-200',
      'Normas Técnicas': 'bg-red-100 text-red-800 border-red-200'
    };
    return cores[cat] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
          <Lightbulb className="w-4 h-4 mr-1" />
          Dicas Periciais
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Guia do Vistoriador - {ambiente}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : guias.length > 0 ? (
            guias.map((guia, index) => (
              <motion.div
                key={guia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{guia.titulo}</h3>
                    {guia.subtitulo && (
                      <p className="text-sm text-gray-600 mb-2">{guia.subtitulo}</p>
                    )}
                  </div>
                  <Badge className={getCategoriaColor(guia.categoria)}>
                    {guia.categoria}
                  </Badge>
                </div>

                <div 
                  className="prose prose-sm max-w-none text-gray-700 mb-3"
                  dangerouslySetInnerHTML={{ __html: guia.conteudo_html }}
                />

                {guia.equipamentos_necessarios && guia.equipamentos_necessarios.length > 0 && (
                  <div className="mb-3 p-3 bg-emerald-50 rounded-md">
                    <p className="text-xs font-semibold text-emerald-800 mb-1">Equipamentos Necessários:</p>
                    <ul className="text-xs text-emerald-700 list-disc list-inside">
                      {guia.equipamentos_necessarios.map((eq, i) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {guia.referencia_norma && (
                  <div className="p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>Base Legal:</strong> {guia.referencia_norma}
                    </p>
                  </div>
                )}

                {(guia.url_midia_1 || guia.url_midia_2) && (
                  <div className="mt-3 flex gap-2">
                    {guia.url_midia_1 && (
                      <a href={guia.url_midia_1} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Mídia 1
                        </Button>
                      </a>
                    )}
                    {guia.url_midia_2 && (
                      <a href={guia.url_midia_2} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Mídia 2
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Nenhum guia disponível para este ambiente.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}