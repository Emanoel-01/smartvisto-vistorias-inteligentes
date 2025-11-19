import { useState, useEffect } from 'react';
import { ConfiguracaoEmpresa } from '@/entities/ConfiguracaoEmpresa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Building, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { UploadFile } from "@/integrations/Core";

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadandoLogo, setUploadandoLogo] = useState(false);
  const [configuracao, setConfiguracao] = useState({
    nome_empresa: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    logo_url: '',
    posicao_logo: 'esquerda',
    cor_primaria: '#2563eb'
  });

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const configs = await ConfiguracaoEmpresa.list();
      if (configs.length > 0) {
        setConfiguracao(configs[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfiguracao(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem');
      return;
    }

    setUploadandoLogo(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('logo_url', file_url);
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadandoLogo(false);
    }
  };

  const salvarConfiguracoes = async (e) => {
    e.preventDefault();
    
    if (!configuracao.nome_empresa.trim()) {
      alert('O nome da empresa é obrigatório');
      return;
    }

    setSalvando(true);
    try {
      const configs = await ConfiguracaoEmpresa.list();
      
      if (configs.length > 0) {
        await ConfiguracaoEmpresa.update(configs[0].id, configuracao);
      } else {
        await ConfiguracaoEmpresa.create(configuracao);
      }

      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
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
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">Configurações da Empresa</h1>
            <p className="text-gray-600">Configure as informações que aparecerão nos laudos</p>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={salvarConfiguracoes}
          className="space-y-8"
        >
          {/* Informações da Empresa */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="nome_empresa" className="text-base font-medium">
                    Nome da Empresa *
                  </Label>
                  <Input
                    id="nome_empresa"
                    value={configuracao.nome_empresa}
                    onChange={(e) => handleInputChange('nome_empresa', e.target.value)}
                    placeholder="Razão social da empresa"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="cnpj" className="text-base font-medium">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={configuracao.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone" className="text-base font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={configuracao.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={configuracao.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contato@empresa.com"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endereco" className="text-base font-medium">
                    Endereço Completo
                  </Label>
                  <Input
                    id="endereco"
                    value={configuracao.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Rua, número, bairro, cidade, CEP"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo e Visual */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle>Identidade Visual</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Logotipo da Empresa
                </Label>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload').click()}
                      disabled={uploadandoLogo}
                    >
                      {uploadandoLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Escolher Imagem
                        </>
                      )}
                    </Button>
                    
                    <Select
                      value={configuracao.posicao_logo}
                      onValueChange={(value) => handleInputChange('posicao_logo', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="esquerda">Esquerda</SelectItem>
                        <SelectItem value="centro">Centro</SelectItem>
                        <SelectItem value="direita">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {configuracao.logo_url && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">Preview do Logo:</p>
                      <img 
                        src={configuracao.logo_url} 
                        alt="Logo Preview"
                        className="max-w-48 max-h-24 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="cor_primaria" className="text-base font-medium">
                  Cor Primária
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    id="cor_primaria"
                    type="color"
                    value={configuracao.cor_primaria}
                    onChange={(e) => handleInputChange('cor_primaria', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={configuracao.cor_primaria}
                    onChange={(e) => handleInputChange('cor_primaria', e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={salvando}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}