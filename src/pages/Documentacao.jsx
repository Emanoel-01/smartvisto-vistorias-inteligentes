import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

export default function Documentacao() {
  const documentacaoMarkdown = `# Documentação Arquitetural e Funcional Detalhada - SmartVisto 2.0

## Visão Geral do Sistema (Core)

A plataforma SmartVisto 2.0 é uma solução robusta para gestão de vistorias imobiliárias, focada em produtividade, segurança jurídica e rastreabilidade. Construída com React, TypeScript e Tailwind CSS no frontend, e Deno com o SDK Base44 no backend (incluindo entidades e funções serverless), a arquitetura é modular e escalável.

---

## Lógica de Licença/Acesso (Core)

| Item | Detalhe como a plataforma valida o acesso | Endpoints Simulados (Operações de Entidade) |
|:-----|:-------------------------------------------|:--------------------------------------------|
| **Autenticação** | O acesso é validado via login Google (padrão Base44). O sistema verifica se o usuário está autenticado (\`base44.auth.me()\`). Se não, redireciona para a tela de login. | \`GET /auth/me\` (verifica usuário logado) |
| **Autorização (RLS)** | Após a autenticação, a autorização é controlada por **Row-Level Security (RLS)** nas entidades, e por \`PerfilUsuario\` para permissões específicas de vistoria. Cada entidade possui regras de leitura/escrita que dependem do \`created_by\` do usuário, \`user.email\` ou \`user.role\` (\`admin\`). Em \`GuiaVistoria\`, por exemplo, apenas \`admin\` ou o email 'admin' podem escrever, mas todos podem ler. | \`POST /entities/Vistoria/create\` (verifica \`created_by\` ou \`admin\`) <br> \`GET /entities/NaoConformidade/list\` (verifica \`created_by\` ou \`admin\`) <br> \`PUT /entities/PerfilUsuario/{id}\` (verifica \`created_by\` ou \`admin\` ou \`usuario_email\`) |
| **Perfis de Usuário** | A entidade \`PerfilUsuario\` define o tipo de papel do usuário dentro de uma vistoria específica (\`vistoriador_principal\`, \`proprietario\`, \`inquilino\`, etc.) e suas permissões granulares (\`visualizar\`, \`comentar\`, \`editar\`, \`aprovar_reparos\`, \`marcar_concluido\`). A UI se adapta dinamicamente a essas permissões. | \`GET /entities/PerfilUsuario/filter?vistoria_id={id}&usuario_email={email}\` <br> \`POST /entities/PerfilUsuario/create\` |
| **Acesso a Funções** | Funções de backend verificam a autenticação (\`base44.auth.me()\`) e podem conter lógica de autorização adicional, como a necessidade de um perfil específico ou ser \`admin\`. | \`POST /functions/someFunction\` (invocado via SDK no frontend, com validação interna) |

---

## Entidades Principais do Sistema

| Nome da Tabela Principal | Três Campos Mais Críticos (Schema) | Como a Entidade se Conecta com os Módulos e a Lógica de Licença |
|:------------------------|:-----------------------------------|:----------------------------------------------------------------|
| **User** | \`email: string\`, \`full_name: string\`, \`role: string\` | Entidade de usuário embutida na Base44. \`role\` (\`admin\`/\`user\`) é usado nos RLS de várias entidades para acesso elevado. \`email\` é crucial para identificar o usuário \`created_by\` e para o vínculo em \`PerfilUsuario\` e \`ComentarioVistoria\`. Não é uma tabela que você cria; é gerenciada pelo sistema Base44. |
| **Vistoria** | \`empreendimento: string\`, \`status: enum\`, \`checklist_data: object\` | Representa a vistoria central. Seu \`id\` é referenciado por \`NaoConformidade\`, \`ComentarioVistoria\`, \`ReVistoria\`, \`PerfilUsuario\`, \`GarantiaLegal\`, \`AnaliseIA\`. O \`status\` controla o fluxo de trabalho. Os RLS permitem que o criador ou admins a leiam/escrevam. |
| **NaoConformidade** | \`vistoria_id: string\`, \`descricao_problema: string\`, \`status: enum\` | Detalha um problema específico encontrado em uma vistoria. Linkado a \`Vistoria\` via \`vistoria_id\`. O \`status\` e a \`classificacao\` são críticos para gestão e priorização. RLS similar à \`Vistoria\`. |
| **PerfilUsuario** | \`vistoria_id: string\`, \`usuario_email: string\`, \`permissoes: object\` | Define o papel (\`tipo_perfil\`) e as permissões (\`visualizar\`, \`comentar\`, \`editar\`, etc.) de um usuário (\`usuario_email\`) dentro de uma \`Vistoria\` específica (\`vistoria_id\`). Essencial para a lógica de acesso granular no \`LaudoInterativo\` e outros módulos. |
| **ComentarioVistoria** | \`vistoria_id: string\`, \`autor_email: string\`, \`conteudo: string\` | Armazena interações e discussões sobre itens da vistoria ou a vistoria em geral. Linkado a \`Vistoria\`. O \`autor_email\` é vital para o RLS e para identificar quem fez o comentário. |
| **ReVistoria** | \`vistoria_original_id: string\`, \`data_agendada: date\`, \`status: enum\` | Gerencia o processo de re-vistoria. Linka a uma \`Vistoria\` original. Seu \`status\` e \`data_agendada\` são cruciais para o acompanhamento. RLS similar à \`Vistoria\`. |
| **GuiaVistoria** | \`titulo: string\`, \`categoria: string\`, \`conteudo_html: string\` | Armazena técnicas e dicas para vistoriadores. Usado pelo \`GuiaContextual\` na página \`EditarVistoria\`. Seu conteúdo é renderizado diretamente. RLS: Apenas admins podem escrever, todos podem ler. |
| **AnaliseIA** | \`vistoria_id: string\`, \`tipo_analise: enum\`, \`resultado_ia: object\` | Armazena os resultados das análises de IA realizadas em uma vistoria. Permite rastrear as interações com a IA e seus resultados. RLS similar à \`Vistoria\`. |
| **TemplateVistoria** | \`nome_template: string\`, \`tipo_imovel: enum\`, \`checklist_padrao: object\` | Armazena templates de checklist reutilizáveis para diferentes tipos de imóveis. Acelera a criação de novas vistorias. |
| **ConfiguracaoEmpresa** | \`nome_empresa: string\`, \`logo_url: string\`, \`cor_primaria: string\` | Personalização da marca e identidade visual da empresa que aparece nos laudos. |
| **GarantiaLegal** | \`vistoria_id: string\`, \`tipo_garantia: enum\`, \`data_inicio: date\`, \`data_fim: date\` | Gerencia os prazos de garantias legais aplicáveis às não conformidades identificadas. |

---

## Agentes Auxiliares/IA Existente

| Função de IA Existente | Campos de Entrada para a Função de IA | Entregável (Saída de Dados) |
|:-----------------------|:--------------------------------------|:----------------------------|
| **Geração de Resumo Executivo** | Lista de não conformidades (ambiente, item, descrição do problema) de uma \`Vistoria\`. | **Texto de Resumo:** Um parágrafo coeso e técnico que resume as principais não conformidades da vistoria. (\`vistoria.resumo_executivo\`) |
| **Análise de Tendências (Analytics)** | Dados de \`Vistoria\` e \`NaoConformidade\` ao longo do tempo (total de vistorias, não conformidades, tempo médio de correção, taxa de reincidência). | **Insights em Texto:** Frases que descrevem tendências, pontos críticos e recomendações estratégicas para a gestão (\`analytics.insights_ia\`). |
| **Processamento de Voz (VistoriaPorVoz)** | Texto transcrito da fala do vistoriador, ambiente atual, \`checklist_data\` da \`Vistoria\` e \`GuiaVistoria\` relevantes. | **Sugestão de Ação:** JSON com comando (\`atualizar_status\`, \`criar_nc\`), item alvo (\`item_id\`, \`ambiente\`), e novos dados (\`status\`, \`observacao\`, \`classificacao\`, \`garantia_aplicavel\`). |
| **Análise de Imagem (NC)** | Foto da não conformidade (\`foto_url\`), contexto do item (\`ambiente\`, \`item_texto\`), conteúdo do \`GuiaVistoria\`. | **Observações Técnicas:** Descrição técnica do problema identificado (\`observacoes_tecnicas_ia\`). <br> **Sugestão de Correção:** Procedimento para reparo (\`sugestao_correcao\`). <br> **Classificação:** Gravidade do problema (\`classificacao\`: critico/grave/leve). <br> **Garantia Aplicável:** Tipo de garantia legal (\`garantia_aplicavel\`). |
| **Extração de Dados de Arquivo** | \`file_url: string\`, \`json_schema: object\` (integração \`Core.ExtractDataFromUploadedFile\`) | **Dados Estruturados:** Objeto JSON contendo os dados extraídos do arquivo, seguindo o \`json_schema\` fornecido. |

---

## Módulos do Sistema

### 1. Dashboard Principal

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Dashboard - Visão geral do sistema |
| **URL Interno** | \`/Dashboard\` |
| **Objetivo Funcional** | Apresentar estatísticas gerais, vistorias recentes, alertas de prazo e atalhos para ações principais. Interface adaptativa baseada no perfil do usuário (vistoriador vs. construtora/gerente). |
| **Componentes de Campos/Inputs** | - Filtros de busca (texto) <br> - Seleção de status <br> - Seleção de projeto |
| **Tipo de Dado e Validação** | - \`String\` para busca (opcional) <br> - \`Enum\` para status e projeto (opcional) |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Nenhuma (carregamento automático) <br> **Saída:** Lista de vistorias, não conformidades, re-vistorias e analytics calculados <br> **Endpoints:** \`GET /entities/Vistoria/list\`, \`GET /entities/NaoConformidade/list\`, \`GET /entities/ReVistoria/list\` |
| **Funções de UX (Mobile)** | - Cards responsivos que se adaptam ao tamanho da tela <br> - Skeleton loading para feedback visual <br> - Animações suaves com Framer Motion |

---

### 2. Nova Vistoria

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Nova Vistoria - Criação de nova vistoria |
| **URL Interno** | \`/NovaVistoria\` |
| **Objetivo Funcional** | Coletar dados iniciais do imóvel, cliente e vistoria, além de permitir adicionar envolvidos com permissões granulares. Gera checklist inteligente baseado no tipo de vistoria. |
| **Componentes de Campos/Inputs** | - **Empreendimento:** Input de texto (obrigatório) <br> - **Unidade:** Input de texto <br> - **Endereço:** Input de texto <br> - **Cliente Nome:** Input de texto (obrigatório) <br> - **Cliente CPF:** Input de texto <br> - **Vistoriador Nome:** Input de texto (auto-preenchido) <br> - **ART/RRT:** Input de texto <br> - **Data Vistoria:** Input de data <br> - **Tipo Vistoria:** Select (enum) <br> - **Envolvidos:** Lista dinâmica com nome, email, telefone, tipo_perfil e permissões (checkboxes) |
| **Tipo de Dado e Validação** | - \`String\` para textos (empreendimento e cliente_nome obrigatórios) <br> - \`Date\` para data_vistoria <br> - \`Enum\` para tipo_vistoria <br> - \`Array<Object>\` para envolvidos (nome e email obrigatórios para cada envolvido) |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Objeto com dados da vistoria e array de envolvidos <br> **Saída:** ID da vistoria criada e redirecionamento para EditarVistoria <br> **Endpoints:** \`POST /entities/Vistoria/create\`, \`POST /entities/PerfilUsuario/create\` (para cada envolvido) |
| **Funções de UX (Mobile)** | - Cards coloridos com gradientes para separação visual <br> - Validação em tempo real <br> - Botão flutuante de adicionar envolvido <br> - Badge de progresso de preenchimento |

---

### 3. Editar/Realizar Vistoria

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Editar Vistoria - Realização do checklist |
| **URL Interno** | \`/EditarVistoria?id={vistoria_id}\` |
| **Objetivo Funcional** | Permitir ao vistoriador percorrer o checklist, marcar status dos itens (conforme/não conforme/N/A), registrar não conformidades com fotos e observações, e acessar guias técnicas contextuais. |
| **Componentes de Campos/Inputs** | - **Status do Item:** Botões de seleção (conforme/não conforme/N/A) <br> - **Detalhes da NC:** Modal com textarea para observação, upload de foto, classificação (select), garantia aplicável (select) <br> - **Gerenciamento de Ambientes:** Adicionar, renomear e excluir ambientes do checklist |
| **Tipo de Dado e Validação** | - \`Enum\` para status do item <br> - \`String\` (texto longo) para observação (obrigatório se não conforme) <br> - \`File/URL\` para foto (opcional) <br> - \`Enum\` para classificacao e garantia_aplicavel <br> - \`Object\` com latitude/longitude para geolocalização |
| **Entradas/Saídas (API Simulada)** | **Entrada:** \`vistoria_id\`, alterações no \`checklist_data\`, dados da não conformidade <br> **Saída:** Vistoria atualizada, NC criada <br> **Endpoints:** \`PUT /entities/Vistoria/{id}\`, \`POST /entities/NaoConformidade/create\`, \`POST /integrations/Core/UploadFile\` |
| **Funções de UX (Mobile)** | - **Guia Contextual:** Botão que abre um dialog com técnicas periciais relevantes ao ambiente atual <br> - **Câmera com Geolocalização:** Captura foto e coordenadas GPS automaticamente <br> - **Barra de Progresso:** Mostra percentual de conclusão do checklist <br> - **Trigger:** Clique em "Não Conforme" abre modal; botão de câmera ativa captura de imagem |

---

### 4. Assinaturas Digitais

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Assinaturas - Coleta de assinaturas digitais |
| **URL Interno** | \`/Assinaturas?id={vistoria_id}\` |
| **Objetivo Funcional** | Coletar as assinaturas digitais do cliente e do vistoriador para validar o laudo. |
| **Componentes de Campos/Inputs** | - **Canvas de Assinatura (Cliente):** Área de desenho para assinatura digital <br> - **Canvas de Assinatura (Vistoriador):** Área de desenho para assinatura digital <br> - Botões de Limpar e Salvar para cada assinatura |
| **Tipo de Dado e Validação** | - \`String\` (Data URL - base64) para cada assinatura <br> - Ambas as assinaturas são obrigatórias para finalizar |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Data URLs das assinaturas <br> **Saída:** Vistoria com status atualizado para "concluida" e redirecionamento para LaudoPDF <br> **Endpoints:** \`PUT /entities/Vistoria/{id}\` |
| **Funções de UX (Mobile)** | - Canvas responsivo que se adapta ao toque <br> - Botão de limpar para refazer a assinatura <br> - Pré-visualização da assinatura capturada <br> - **Trigger:** Desenho no canvas; clique em "Finalizar" salva e atualiza a vistoria |

---

### 5. Laudo PDF (Visualização e Download)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Laudo PDF - Visualização e geração do laudo final |
| **URL Interno** | \`/LaudoPDF?id={vistoria_id}\` |
| **Objetivo Funcional** | Exibir uma pré-visualização do laudo técnico pericial completo, permitir gerar resumo executivo com IA e baixar/imprimir o PDF. |
| **Componentes de Campos/Inputs** | - Nenhum (visualização apenas) <br> - Botão "Gerar Resumo IA" (se não houver resumo) <br> - Botão "Compartilhar" <br> - Botão "Gerar PDF" |
| **Tipo de Dado e Validação** | - Leitura apenas de dados já salvos |
| **Entradas/Saídas (API Simulada)** | **Entrada:** \`vistoria_id\` <br> **Saída:** HTML completo do laudo para impressão/PDF <br> **Endpoints:** \`GET /entities/Vistoria/{id}\`, \`GET /entities/ConfiguracaoEmpresa/list\`, \`POST /integrations/Core/InvokeLLM\` (para resumo) |
| **Geração de PDF** | **Campos Principais Injetados:** <br> - Dados da Vistoria: empreendimento, unidade, endereço, cliente_nome, cliente_cpf, vistoriador_nome, art_rrt_profissional, data_vistoria, total_nao_conformidades <br> - Resumo Executivo (IA): resumo_executivo <br> - Não Conformidades: ambiente, item_texto, descricao_problema, classificacao, garantia_aplicavel, foto_url, geolocalizacao, observacoes_tecnicas_ia, sugestao_correcao <br> - Checklist Detalhado: todos os itens de checklist_data <br> - Assinaturas: assinatura_cliente, assinatura_vistoriador <br> - Configurações da Empresa: nome_empresa, cnpj, endereco, telefone, email, logo_url <br><br> **Layout:** <br> - Papel timbrado com logo e dados da empresa <br> - Página de título com informações da vistoria <br> - Metodologia aplicada com base em NBRs <br> - Resumo executivo destacado <br> - Seção de garantias legais detalhada (90 dias, 1 ano, 5 anos) <br> - Não conformidades com fotos, classificação, garantias e análises de IA <br> - Checklist completo em formato de tabela <br> - Termo de encerramento e direitos do consumidor <br> - Assinaturas digitalizadas <br> - Quebra de página automática para organização profissional |
| **Funções de UX (Mobile)** | - Pré-visualização do laudo antes da impressão <br> - Botão de compartilhamento com link copiável e WhatsApp <br> - Modal de compartilhamento <br> - **Trigger:** Clique em "Gerar PDF" abre janela de impressão; clique em "Compartilhar" abre modal com opções |

---

### 6. Gestão de Não Conformidades

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Gestão de Não Conformidades - Gerenciamento e acompanhamento |
| **URL Interno** | \`/GestaoNaoConformidade?id={vistoria_id}\` |
| **Objetivo Funcional** | Permitir que o vistoriador ou gerente defina prazos de correção, monitore o status de cada não conformidade e gerencie garantias legais aplicáveis. |
| **Componentes de Campos/Inputs** | - **Prazo de Correção:** Input de data <br> - **Responsável pela Correção:** Input de texto <br> - **Status:** Select (pendente/em_correcao/corrigido/nao_corrigido) <br> - **Observações de Correção:** Textarea |
| **Tipo de Dado e Validação** | - \`Date\` para prazo_correcao <br> - \`String\` para responsavel_correcao <br> - \`Enum\` para status <br> - \`String\` (texto longo) para observacoes_correcao |
| **Entradas/Saídas (API Simulada)** | **Entrada:** \`vistoria_id\`, alterações em cada NC <br> **Saída:** NCs atualizadas <br> **Endpoints:** \`PUT /entities/NaoConformidade/{id}\` |
| **Funções de UX (Mobile)** | - Cards de NC com código de cores por classificação <br> - Filtros por status e classificação <br> - Badges visuais para prazos vencidos <br> - **Trigger:** Edição de campos atualiza a NC em tempo real |

---

### 7. Analytics (Construtoras/Gerentes)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Analytics - Análise de desempenho e tendências |
| **URL Interno** | \`/Analytics\` |
| **Objetivo Funcional** | Fornecer insights estratégicos sobre o desempenho das vistorias, tendências de problemas, ambientes mais críticos e KPIs operacionais. Geração de insights por IA. |
| **Componentes de Campos/Inputs** | - Nenhum (visualização de dados calculados) <br> - Botão "Gerar Insights com IA" |
| **Tipo de Dado e Validação** | - Leitura e processamento de dados de Vistoria e NaoConformidade |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Todas as vistorias e NCs do sistema <br> **Saída:** KPIs, gráficos de tendência, distribuição de classificação, análise por ambiente, insights de IA <br> **Endpoints:** \`GET /entities/Vistoria/list\`, \`GET /entities/NaoConformidade/list\`, \`POST /integrations/Core/InvokeLLM\` |
| **Funções de UX (Mobile)** | - Gráficos responsivos (Recharts: Line Chart, Pie Chart, Bar Chart) <br> - Cards de KPIs com ícones e cores <br> - Seção de insights expandível <br> - **Trigger:** Clique em "Gerar Insights" invoca a IA |

---

### 8. Vistoria por Voz

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Vistoria por Voz - Registro por comando de voz |
| **URL Interno** | \`/VistoriaPorVoz?id={vistoria_id}\` |
| **Objetivo Funcional** | Permitir ao vistoriador realizar a vistoria ditando observações e comandos, que são transcritos e processados por IA para atualizar o checklist automaticamente. |
| **Componentes de Campos/Inputs** | - **Seleção de Ambiente:** Select <br> - **Botão de Gravação:** Toggle para iniciar/parar gravação <br> - **Transcrição em Tempo Real:** Display de texto <br> - **Sugestões da IA:** Cards com ações sugeridas e botões de aceitar/rejeitar |
| **Tipo de Dado e Validação** | - \`String\` para ambiente selecionado <br> - \`String\` (texto longo) para transcrição <br> - \`Object\` (JSON) para sugestões da IA |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Texto transcrito da fala, ambiente atual, checklist_data, GuiaVistoria relevantes <br> **Saída:** Sugestões de ação (atualizar status, criar NC) em formato JSON <br> **Endpoints:** \`POST /integrations/Core/InvokeLLM\`, \`PUT /entities/Vistoria/{id}\`, \`POST /entities/NaoConformidade/create\` |
| **Funções de UX (Mobile)** | - **Gravação de Áudio:** Usa SpeechRecognition API do navegador <br> - **Feedback Visual:** Animação de microfone pulsante durante gravação <br> - **Transcrição Automática:** Texto aparece em tempo real <br> - **Trigger:** Clique no botão de microfone inicia/para gravação; fim da gravação dispara análise de IA |

---

### 9. Re-Vistoria (Agendamento e Realização)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Agendar Re-Vistoria e Realizar Re-Vistoria |
| **URL Interno** | \`/AgendarReVistoria?id={vistoria_id}\` <br> \`/RealizarReVistoria?id={revistoria_id}\` |
| **Objetivo Funcional** | Agendar uma re-vistoria selecionando NCs a verificar e depois realizar a verificação, documentando o status de cada correção com fotos "antes e depois". |
| **Componentes de Campos/Inputs** | **Agendamento:** <br> - Checkboxes para selecionar NCs <br> - Data agendada (input date) <br> - Motivo (textarea) <br> - Vistoriador responsável (input text) <br><br> **Realização:** <br> - Status da NC na re-vistoria (select: Corrigido/Não Corrigido/Parcialmente Corrigido) <br> - Observações (textarea) <br> - Upload de foto "depois" (file input) |
| **Tipo de Dado e Validação** | - \`Array<String>\` para itens_para_verificar (IDs das NCs) <br> - \`Date\` para data_agendada (obrigatório) <br> - \`String\` para motivo (obrigatório) <br> - \`Enum\` para status_na_revistoria <br> - \`File/URL\` para foto_url_after |
| **Entradas/Saídas (API Simulada)** | **Entrada (Agendamento):** vistoria_original_id, data_agendada, motivo, itens_para_verificar <br> **Saída (Agendamento):** ReVistoria criada <br> **Entrada (Realização):** revistoria_id, resultados para cada NC <br> **Saída (Realização):** Vistoria original atualizada, NCs atualizadas, ReVistoria marcada como realizada <br> **Endpoints:** \`POST /entities/ReVistoria/create\`, \`PUT /entities/Vistoria/{id}\`, \`PUT /entities/NaoConformidade/{id}\`, \`POST /integrations/Core/UploadFile\` |
| **Funções de UX (Mobile)** | - Seleção múltipla de NCs com checkboxes <br> - Validação de campos obrigatórios <br> - Componente de upload de imagem com pré-visualização <br> - **Trigger:** Submissão do formulário cria ou atualiza registros |

---

### 10. Laudo Interativo (Colaboração Multi-usuário)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Laudo Interativo - Visualização colaborativa |
| **URL Interno** | \`/LaudoInterativo?id={vistoria_id}\` |
| **Objetivo Funcional** | Permitir que envolvidos (proprietário, inquilino, corretor, prestadores) visualizem o laudo, adicionem comentários, acompanhem o status de reparos e interajam de acordo com suas permissões. |
| **Componentes de Campos/Inputs** | - **Comentários Gerais:** Textarea para discussão geral <br> - **Comentários por Item:** Textarea contextual para cada item/NC <br> - **Upload de Imagens:** File input para anexar fotos aos comentários <br> - **Menções:** Possibilidade de mencionar outros usuários (futuro) |
| **Tipo de Dado e Validação** | - \`String\` (texto longo) para conteúdo do comentário (obrigatório) <br> - \`Array<String>\` para fotos_anexas (opcional) <br> - \`Enum\` para tipo_comentario (comentario/contestacao/aprovacao/etc.) |
| **Entradas/Saídas (API Simulada)** | **Entrada:** vistoria_id, item_id (opcional), conteudo, tipo_comentario, fotos_anexas <br> **Saída:** ComentarioVistoria criado <br> **Endpoints:** \`POST /entities/ComentarioVistoria/create\`, \`POST /integrations/Core/UploadFile\`, \`GET /entities/PerfilUsuario/filter\` |
| **Funções de UX (Mobile)** | - **Verificação de Permissões:** UI se adapta dinamicamente com base em \`PerfilUsuario.permissoes\` <br> - **Upload de Fotos:** Componente de câmera para adicionar evidências visuais <br> - **Thread de Comentários:** Visualização cronológica de discussões <br> - **Trigger:** Clique em "Adicionar Comentário" salva; upload de imagem adiciona foto ao comentário |

---

### 11. Gerenciar Guias (Admin)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Gerenciar Guias - Administração do Guia do Vistoriador |
| **URL Interno** | \`/GerenciarGuias\` |
| **Objetivo Funcional** | Permitir que administradores criem, editem e excluam técnicas periciais do Guia do Vistoriador. |
| **Componentes de Campos/Inputs** | - **Título:** Input de texto (obrigatório) <br> - **Subtítulo:** Input de texto <br> - **Categoria:** Select (Técnicas Manuais/Equipamentos/Tecnologias 4.0/etc.) <br> - **Ambientes Aplicáveis:** Input de array (chips) <br> - **Conteúdo HTML:** Editor de texto rico (react-quill) <br> - **Equipamentos Necessários:** Input de array (chips) <br> - **Referência Norma:** Textarea <br> - **Metodologia:** Textarea <br> - **Base Legal:** Textarea <br> - **Tipo de Vício:** Select (aparente/oculto/estrutural) <br> - **URLs de Mídia:** Input de URL |
| **Tipo de Dado e Validação** | - \`String\` para título, subtítulo (obrigatórios) <br> - \`Enum\` para categoria (obrigatório) <br> - \`Array<String>\` para ambiente_aplicavel e equipamentos_necessarios <br> - \`String\` (HTML) para conteudo_html (obrigatório) <br> - \`String\` para referências, metodologia, base_legal <br> - \`Enum\` para tipo_vicio |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Objeto GuiaVistoria completo <br> **Saída:** Guia criado/atualizado/excluído <br> **Endpoints:** \`POST /entities/GuiaVistoria/create\`, \`PUT /entities/GuiaVistoria/{id}\`, \`DELETE /entities/GuiaVistoria/{id}\` |
| **Funções de UX (Mobile)** | - Grid responsivo de cards de guias <br> - Filtros por categoria e busca por texto <br> - Modal de edição em tela cheia <br> - Editor WYSIWYG para conteúdo HTML <br> - **Trigger:** Clique em "Adicionar Guia" abre modal; clique em card abre para edição |

---

### 12. Configurações da Empresa

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Configurações - Personalização da empresa |
| **URL Interno** | \`/Configuracoes\` |
| **Objetivo Funcional** | Permitir que administradores configurem os dados da empresa (nome, CNPJ, logo, cores) que aparecem nos laudos. |
| **Componentes de Campos/Inputs** | - **Nome Empresa:** Input de texto (obrigatório) <br> - **CNPJ:** Input de texto <br> - **Endereço:** Input de texto <br> - **Telefone:** Input de texto <br> - **Email:** Input de email <br> - **Upload Logo:** File input (imagem) <br> - **Posição Logo:** Select (esquerda/centro/direita) <br> - **Cor Primária:** Color picker |
| **Tipo de Dado e Validação** | - \`String\` para textos (nome_empresa obrigatório) <br> - \`File/URL\` para logo_url <br> - \`Enum\` para posicao_logo <br> - \`String\` (HEX) para cor_primaria |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Objeto ConfiguracaoEmpresa <br> **Saída:** Configuração criada/atualizada <br> **Endpoints:** \`POST /entities/ConfiguracaoEmpresa/create\`, \`PUT /entities/ConfiguracaoEmpresa/{id}\`, \`POST /integrations/Core/UploadFile\` |
| **Funções de UX (Mobile)** | - Upload de logo com pré-visualização <br> - Color picker para cor primária <br> - Feedback de salvamento <br> - **Trigger:** Upload de arquivo envia para o servidor; clique em "Salvar" atualiza a configuração |

---

### 13. Colaboração na Vistoria

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Colaboração Vistoria - Gerenciamento de envolvidos |
| **URL Interno** | \`/ColaboracaoVistoria?id={vistoria_id}\` |
| **Objetivo Funcional** | Permitir ao vistoriador principal convidar e gerenciar os envolvidos na vistoria, definindo permissões e visualizando comentários. |
| **Componentes de Campos/Inputs** | - **Novo Envolvido:** Nome, email, telefone, tipo_perfil (select), permissões (checkboxes) <br> - **Comentários:** Textarea para adicionar comentários gerais |
| **Tipo de Dado e Validação** | - \`String\` para nome e email (obrigatórios) <br> - \`String\` para telefone (opcional) <br> - \`Enum\` para tipo_perfil <br> - \`Object\` (boolean flags) para permissoes |
| **Entradas/Saídas (API Simulada)** | **Entrada:** vistoria_id, dados do novo envolvido <br> **Saída:** PerfilUsuario criado, comentários listados <br> **Endpoints:** \`POST /entities/PerfilUsuario/create\`, \`GET /entities/ComentarioVistoria/filter\`, \`POST /entities/ComentarioVistoria/create\` |
| **Funções de UX (Mobile)** | - Formulário de convite com validação <br> - Lista de envolvidos com badges de perfil <br> - Thread de comentários <br> - **Trigger:** Clique em "Convidar" cria PerfilUsuario; submissão de comentário cria registro |

---

### 14. Prestador de Serviço (Dashboard)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Prestador de Serviço - Dashboard de reparos |
| **URL Interno** | \`/PrestadorServico\` |
| **Objetivo Funcional** | Fornecer aos prestadores de serviço uma visão de todas as não conformidades atribuídas a eles, permitindo iniciar correções, fazer upload de evidências e marcar como concluído. |
| **Componentes de Campos/Inputs** | - **Observações de Correção:** Textarea <br> - **Upload Foto "Depois":** File input <br> - **Data de Correção:** Input de data (auto-preenchido) |
| **Tipo de Dado e Validação** | - \`String\` para observacoes_correcao <br> - \`File/URL\` para foto_url_after <br> - \`Date\` para data_correcao |
| **Entradas/Saídas (API Simulada)** | **Entrada:** nc_id, observacoes_correcao, foto_url_after <br> **Saída:** NC atualizada com status "corrigido" <br> **Endpoints:** \`GET /entities/NaoConformidade/filter\`, \`PUT /entities/NaoConformidade/{id}\`, \`POST /integrations/Core/UploadFile\` |
| **Funções de UX (Mobile)** | - Cards de NC filtradas por usuário <br> - Componente de câmera para evidência de reparo <br> - Estados visuais por classificação <br> - **Trigger:** Clique em "Iniciar Correção" muda status; upload de foto e submissão finalizam reparo |

---

### 15. Gerenciar Templates

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Gerenciar Templates - Administração de templates de checklist |
| **URL Interno** | \`/GerenciarTemplates\` |
| **Objetivo Funcional** | Permitir criar, editar, duplicar e excluir templates de checklist reutilizáveis para diferentes tipos de imóveis. |
| **Componentes de Campos/Inputs** | - **Nome Template:** Input de texto (obrigatório) <br> - **Tipo de Imóvel:** Select (apartamento/casa/comercial/etc.) <br> - **Descrição:** Textarea <br> - **Checklist Padrão:** Editor estruturado (JSONB simulado) <br> - **Ambientes Padrão:** Input de array (chips) <br> - **Público:** Checkbox <br> - **Tags:** Input de array |
| **Tipo de Dado e Validação** | - \`String\` para nome_template (obrigatório) <br> - \`Enum\` para tipo_imovel (obrigatório) <br> - \`Object\` para checklist_padrao (obrigatório) <br> - \`Array<String>\` para ambientes_padrao e tags <br> - \`Boolean\` para publico |
| **Entradas/Saídas (API Simulada)** | **Entrada:** Objeto TemplateVistoria <br> **Saída:** Template criado/atualizado/duplicado/excluído <br> **Endpoints:** \`POST /entities/TemplateVistoria/create\`, \`PUT /entities/TemplateVistoria/{id}\`, \`DELETE /entities/TemplateVistoria/{id}\` |
| **Funções de UX (Mobile)** | - Grid de cards de templates <br> - Filtros por tipo de imóvel e busca <br> - Modal de edição com validação <br> - Ação de duplicar template <br> - **Trigger:** Clique em "Novo Template" ou card existente abre modal |

---

### 16. Detalhes da Vistoria (Histórico)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Detalhes Vistoria - Histórico completo e timeline |
| **URL Interno** | \`/DetalhesVistoria?id={vistoria_id}\` |
| **Objetivo Funcional** | Fornecer uma visão histórica completa da vistoria, incluindo todas as versões de laudo, re-vistorias, comentários e ações contextuais. |
| **Componentes de Campos/Inputs** | - Visualização apenas (não há inputs diretos) <br> - Botões de ação contextual (Compartilhar, Agendar Re-vistoria, Ver Laudo) |
| **Tipo de Dado e Validação** | - Leitura de dados relacionados à vistoria |
| **Entradas/Saídas (API Simulada)** | **Entrada:** vistoria_id <br> **Saída:** Vistoria completa, NCs relacionadas, ReVistorias, PerfilUsuario, ComentarioVistoria <br> **Endpoints:** \`GET /entities/Vistoria/{id}\`, \`GET /entities/NaoConformidade/filter\`, \`GET /entities/ReVistoria/filter\`, \`GET /entities/PerfilUsuario/filter\`, \`GET /entities/ComentarioVistoria/filter\` |
| **Funções de UX (Mobile)** | - Timeline cronológica de eventos <br> - Cards informativos com badges de status <br> - Botões de ação contextual baseados no status da vistoria <br> - Modal de compartilhamento com opções de link e WhatsApp <br> - **Trigger:** Navegação para a página carrega dados; clique em ações executa operações específicas |

---

### 17. Laudo de Re-Vistoria (Comparativo)

| Item | Descrição |
|:-----|:----------|
| **Nome da Página/Módulo** | Laudo de Re-Vistoria - Relatório comparativo |
| **URL Interno** | \`/LaudoReVistoria?id={revistoria_id}\` |
| **Objetivo Funcional** | Gerar e exibir um laudo comparativo da re-vistoria, mostrando o status de cada correção com fotos "antes e depois". |
| **Componentes de Campos/Inputs** | - Visualização apenas <br> - Botão "Gerar PDF" <br> - Botão "Compartilhar" |
| **Tipo de Dado e Validação** | - Leitura de dados da ReVistoria, Vistoria original e NCs |
| **Entradas/Saídas (API Simulada)** | **Entrada:** revistoria_id <br> **Saída:** HTML completo do laudo de re-vistoria para impressão/PDF <br> **Endpoints:** \`GET /entities/ReVistoria/{id}\`, \`GET /entities/Vistoria/{id}\`, \`GET /entities/NaoConformidade/filter\` |
| **Geração de PDF** | **Campos Principais Injetados:** <br> - Dados da Re-Vistoria: data_agendada, motivo, vistoriador_nome, observacoes <br> - Dados da Vistoria Original: empreendimento, unidade, cliente_nome, data_vistoria <br> - NCs Verificadas: item_texto, status_na_revistoria, observacoes_correcao, foto_url (antes), foto_url_after (depois), geolocalizacao <br> - Estatísticas: total verificado, corrigidos, não corrigidos, parcialmente corrigidos <br><br> **Layout:** <br> - Cabeçalho com logo e dados da empresa <br> - Título "LAUDO DE RE-VISTORIA" <br> - Informações da vistoria original e da re-vistoria <br> - Resumo de resultados com percentuais <br> - Tabela comparativa de NCs com fotos antes/depois <br> - Geolocalização de evidências <br> - Conclusão técnica <br> - Assinaturas |
| **Funções de UX (Mobile)** | - Visualização de imagens antes/depois lado a lado <br> - Botão de compartilhamento <br> - **Trigger:** Clique em "Gerar PDF" abre janela de impressão |

---

## Estilo Atual da Interface (SmartVisto 2.0)

| Item | Descrição | Detalhes |
|:-----|:----------|:---------|
| **Cores Primárias** | - Primária (Ação): Azul \`#2563eb\`, gradientes \`from-blue-600 to-purple-600\` <br> - Secundária (Destaque): Indigo/Purple \`from-indigo-500 to-purple-600\`, \`from-purple-500 to-pink-600\` <br> - Sucesso: Esmeralda/Verde \`bg-emerald-600\` (#10b981) <br> - Atenção: Âmbar/Laranja \`bg-amber-100\`, \`bg-orange-500\` (#f59e0b) <br> - Perigo: Vermelho \`bg-red-500\` (#dc2626) | Usado em botões principais, cabeçalhos de cards, badges de status e alertas |
| **Tipografia** | - Fonte Principal: Sans-serif (padrão Tailwind: Inter ou similar) <br> - Títulos (H1): \`text-4xl font-bold\` (Dashboards), \`text-3xl font-bold\` (páginas internas) <br> - Títulos (H2/H3): \`text-2xl font-bold\`, \`text-xl font-semibold\` <br> - Corpo do Texto: \`text-gray-600\`, \`text-gray-700\` com line-height espaçado <br> - Ênfase: \`font-semibold\` e \`font-bold\` | Grande e impactante para títulos principais, legível e confortável para texto corrido |
| **Componentes UI** | Shadcn/UI: Button, Card, Badge, Input, Select, Dialog, DropdownMenu, Checkbox, Alert, Textarea, Calendar, Popover <br> Ícones: Lucide-React | Componentes modernos e acessíveis com variantes (outline, ghost, default) |
| **Animações** | Framer Motion: \`initial\`, \`animate\`, \`exit\` para transições suaves <br> AnimatePresence para entrada/saída de elementos | Micro-interações que melhoram a experiência sem comprometer performance |
| **Layout Responsivo** | Grid e Flexbox com breakpoints Tailwind (\`md:\`, \`lg:\`) <br> Cards que se adaptam de 1 coluna (mobile) para 2-4 colunas (desktop) | Mobile-first com expansão progressiva para telas maiores |

---

## Fluxo de Trabalho Completo (Exemplo de Uso)

### Cenário: Vistoria de Entrega de Imóvel Novo

1. **Criação (NovaVistoria):**
   - Vistoriador cria nova vistoria, preenche dados do imóvel e cliente
   - Seleciona "Recebimento de Imóvel Novo" como tipo
   - Adiciona proprietário como envolvido (com permissões de visualizar e comentar)
   - Sistema gera checklist padrão automaticamente

2. **Realização (EditarVistoria):**
   - Vistoriador percorre cada ambiente do checklist
   - Acessa "Guia Contextual" para consultar técnicas periciais (ex: Teste do Som Oco para cerâmica)
   - Marca itens como "Conforme" ou "Não Conforme"
   - Para NCs, registra foto com geolocalização, observação e solicita análise de IA
   - IA retorna classificação, garantia aplicável, observações técnicas e sugestão de correção

3. **Gestão de NCs (GestaoNaoConformidade):**
   - Define prazos de correção para cada NC
   - Atribui responsáveis
   - Sistema muda status da vistoria para "aguardando_correcao"

4. **Assinaturas (Assinaturas):**
   - Cliente e vistoriador assinam digitalmente o laudo
   - Status muda para "concluida"

5. **Geração do Laudo (LaudoPDF):**
   - Sistema gera resumo executivo com IA
   - Laudo completo é exibido com metodologia, garantias legais, NCs detalhadas e checklist
   - PDF é gerado para download/impressão

6. **Compartilhamento (LaudoInterativo):**
   - Vistoriador compartilha link do laudo interativo com o proprietário
   - Proprietário acessa, visualiza NCs, adiciona comentários
   - Construtora é notificada e agenda reparos

7. **Re-Vistoria (AgendarReVistoria → RealizarReVistoria):**
   - Após prazo de correção, vistoriador agenda re-vistoria
   - Seleciona NCs a verificar
   - Realiza re-vistoria, marca cada item como "Corrigido", "Não Corrigido" ou "Parcialmente Corrigido"
   - Faz upload de fotos "depois" com geolocalização

8. **Laudo Comparativo (LaudoReVistoria):**
   - Gera laudo da re-vistoria com comparação antes/depois
   - Documentação completa da trilha de auditoria
   - Versão do laudo é incrementada

---

## Tecnologias e Dependências

- **Frontend:** React 18, TypeScript, Tailwind CSS 3
- **UI Components:** Shadcn/UI (completo)
- **Ícones:** Lucide React
- **Animações:** Framer Motion
- **Gráficos:** Recharts
- **Formulários:** React Hook Form
- **Data Management:** @tanstack/react-query
- **Roteamento:** React Router DOM
- **Editor de Texto Rico:** React Quill
- **Markdown:** React Markdown
- **Datas:** date-fns, moment
- **Utilitários:** lodash

- **Backend:** Deno Deploy
- **SDK:** @base44/sdk@0.8.4
- **Database:** Base44 Entities (PostgreSQL subjacente)
- **Storage:** Base44 File Storage (público e privado)
- **Auth:** Base44 Auth (Google Login)
- **Integrations:** Core (InvokeLLM, SendEmail, UploadFile, GenerateImage, ExtractDataFromUploadedFile)

---

## Segurança e Conformidade

### Row-Level Security (RLS)

Todas as entidades implementam RLS para garantir que:
- Usuários só acessem dados que criaram (\`created_by\`)
- Ou dados onde têm permissão explícita (via \`PerfilUsuario\`)
- Ou se são administradores (\`role: 'admin'\`)

### Rastreabilidade

Todos os registros incluem:
- \`created_date\`: Timestamp de criação
- \`updated_date\`: Timestamp da última atualização
- \`created_by\`: Email do usuário criador
- Geolocalização em fotos de evidência para validação jurídica

### Garantias Legais

O sistema incorpora as garantias do CDC e Código Civil:
- **90 dias:** Vícios aparentes (CDC Art. 26, II)
- **1 ano:** Vícios ocultos (CC Art. 445)
- **5 anos:** Solidez e segurança estrutural (CC Art. 618)

---

## Guia do Vistoriador - Técnicas Periciais

### Categorias de Técnicas

1. **Técnicas Manuais (4 técnicas)**
   - Teste do Som Oco
   - Teste da Bola de Gude
   - Técnica da Luz Rasante
   - Teste do Papel em Esquadrias

2. **Equipamentos Essenciais (1 técnica)**
   - Medidor de Umidade Portátil

3. **Tecnologias 4.0 (10 técnicas)**
   - Câmera Termográfica (TIR)
   - Drones para Inspeção de Fachadas
   - Medição de Desvios de Prumo e Nível
   - Mapeamento de Fissuras
   - Inspeção Endoscópica
   - Teste de Desempenho Acústico
   - Medição de Vibração em Lajes
   - Teste de Estanqueidade da Rede de Gás
   - Medição de Vazão de Ar (Anemometria)
   - Medição de Espessura de Revestimento (DFT)

### Estrutura de Cada Técnica

Cada guia contém:
- **Título e Subtítulo:** Nome da técnica e objetivo
- **Categoria:** Classificação da técnica
- **Ambientes Aplicáveis:** Onde pode ser usada
- **Conteúdo Detalhado:** Procedimento passo a passo em HTML
- **Equipamentos Necessários:** Lista de ferramentas
- **Referência Normativa:** NBRs e normas técnicas aplicáveis
- **Metodologia:** Descrição técnica do procedimento
- **Base Legal:** Artigos do CDC e Código Civil aplicáveis
- **Tipo de Vício:** Classificação (aparente/oculto/estrutural)
- **URLs de Mídia:** Links para vídeos ou imagens ilustrativas

---

## Processo de Acesso de Usuários Envolvidos

### 1. Cadastro do Envolvido
- Vistoriador adiciona envolvido na criação ou edição da vistoria
- Define: nome, email, telefone, tipo_perfil e permissões granulares
- Registro \`PerfilUsuario\` é criado com \`status_convite: 'pendente'\`

### 2. Compartilhamento do Link
- Vistoriador usa botão "Compartilhar" no LaudoPDF ou DetalhesVistoria
- Copia link do laudo interativo ou envia via WhatsApp
- Link formato: \`/LaudoInterativo?id={vistoria_id}\`

### 3. Acesso do Envolvido
- Usuário clica no link recebido
- Sistema verifica autenticação (redireciona para login se necessário)
- Após login, valida se o \`usuario_email\` tem \`PerfilUsuario\` para aquela vistoria
- Se autorizado, carrega interface com permissões específicas

### 4. Experiência Personalizada
- **Proprietário:** Visualiza, comenta, aprova reparos
- **Inquilino:** Visualiza, comenta
- **Corretor/Imobiliária:** Visualiza, comenta
- **Prestador de Serviço:** Visualiza NCs atribuídas, marca como corrigido, faz upload de evidências
- **Construtora/Gerente:** Acesso completo, pode editar e gerenciar todo o processo

### 5. Notificações (Futuro)
- Sistema pode enviar emails automáticos sobre:
  - Novos comentários
  - Prazos de correção próximos
  - Mudanças de status
  - Agendamento de re-vistoria

---

## Roadmap e Melhorias Futuras

### Curto Prazo
- [ ] Notificações automáticas por email
- [ ] Assinatura eletrônica com certificado digital (ICP-Brasil)
- [ ] Integração com sistemas de CRM imobiliário
- [ ] App mobile nativo (React Native)

### Médio Prazo
- [ ] OCR para extração automática de dados de documentos
- [ ] Integração com Google Maps para visualização de imóveis
- [ ] Dashboard executivo com Power BI embarcado
- [ ] Módulo de orçamentação de reparos

### Longo Prazo
- [ ] IA para detecção automática de problemas em fotos
- [ ] Marketplace de prestadores de serviço
- [ ] Blockchain para certificação de laudos
- [ ] Integração com cartórios para registro de laudos

---

**Documentação gerada em:** ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}

**Versão do Sistema:** SmartVisto 2.0

**Plataforma:** Base44

**Contato:** Para suporte técnico, consulte a documentação da Base44 ou entre em contato com o desenvolvedor do aplicativo.
`;

  const handleDownloadMarkdown = () => {
    const blob = new Blob([documentacaoMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartVisto-2.0-Documentacao-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Documentação Técnica</h1>
              <p className="text-gray-600 text-lg">SmartVisto 2.0 - Arquitetura e Funcionalidades</p>
            </div>
          </div>

          <Button
            onClick={handleDownloadMarkdown}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar Markdown
          </Button>
        </motion.div>

        {/* Conteúdo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6" />
                Documentação Completa do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-strong:font-semibold prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:bg-gray-100 prose-th:font-semibold prose-th:text-gray-900 prose-td:text-gray-700">
                <ReactMarkdown>{documentacaoMarkdown}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          className="mt-8 text-center text-gray-600"
        >
          <p className="text-sm">
            Esta documentação é gerada automaticamente e reflete o estado atual do sistema SmartVisto 2.0.
          </p>
          <p className="text-sm mt-2">
            Para atualizações ou dúvidas, entre em contato com a equipe de desenvolvimento.
          </p>
        </motion.div>
      </div>
    </div>
  );
}