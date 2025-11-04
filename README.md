# Plugin Jiraya – Extensão Jira


Extensão para aumentar a produtividade e usabilidade no sistema Jira, trazendo recursos visuais, automações e atalhos para o dia a dia.


## 🧠 Como instalar a extensão no Chrome (modo desenvolvedor)
1. Baixe o plugin no link do drive e extraia para uma pasta fixa
2. No Chrome, acesse `chrome://extensions/` e ative o **modo desenvolvedor**
3. Clique em **"Carregar sem compactação/Load unpacked"** e selecione a pasta do plugin
4. Para atualizar, substitua os arquivos antigos pelos novos e clique em **"Atualizar / Update"** nas extensões

## 🚀 Funcionalidades

### 📝 Issue / Editar Issue

| Função | Status | Descrição |
|--------|--------|-----------|
| **Campos de texto ajustados** | ✅ | Redimensionam conforme o conteúdo |
| **Modais ajustáveis** | ✅ | Maximize, minimize, fullscreen e fechar |
| **Barra de tarefas personalizada** | ✅ | Funções extras para o Jira |
| **Templates visuais e interativos** | ✅ | Modelos prontos, editáveis e campos guiados |
| **Botão Copiar código** | ✅ | Em blocos de código no comentário |
| **Blocos informativos** | ✅ | Dicas visuais em campos como "Causa Ocorrência" |
| **Imagens redimensionadas** | ✅ | Ajustadas a 90% do container e centralizadas |
| **Flag fixada no topo** | ✅ | Comentários importantes sempre visíveis |
| **Botão Ir para flags fixadas** | ✅ | Navegação rápida para comentários com flag |
| **Download de comentários** | ✅ | Exporta todos ou apenas o comentário sinalizado |

### 🧩 Templates

Templates disponíveis para uso, classificados por área, tipo e local de aplicação.

| Área | Template | Tipo | Local |
|------|----------|------|-------|
| **Agile** | Checklist DT | Visual/Dinâmico | Issue/Comentário |
| **Agile** | Checklist DR | Visual/Dinâmico | Issue/Comentário |
| **Agile** | Story | Visual | Issue/Comentário |
| **Agile** | TI | Visual | Issue/Comentário |
| **Agile** | Checklist Incompleto | Texto | Classificar Impedimento - Retorno Suporte |
| **Agile** | Liberação de conexão | Texto | Classificar Impedimento - Retorno Suporte |
| **Agile** | Falta de análise | Texto | Classificar Impedimento - Retorno Suporte |
| **Agile** | Retorno de Validação | Texto | Classificar Impedimento - Retorno Suporte |
| **Agile** | Análise Ponto Focal | Texto | Classificar Impedimento - Retorno Suporte |
| **Dev** | Codificação | Visual | Issue/Comentário |
| **Dev** | Checklist de Qualidade | Visual/Dinâmico | Issue/Comentário |
| **Dev** | Causa Ocorrência | Texto | Editar Issue - Manutenção |
| **QA** | Teste ISAE | Visual | Issue/Comentário |
| **QA** | Teste Concluído | Visual | Issue/Comentário |

### ✨ Templates Interativos e Dinâmicos

Os templates customizados oferecem uma interface guiada e interativa para criar comentários estruturados no Jira. Com campos dinâmicos e inteligentes, facilitam o preenchimento de checklists e garantem consistência na documentação.

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| **Modal Interativo** | ✅ | Interface guiada com formulário estruturado para preenchimento de templates. Suporta maximizar, minimizar e tela cheia. |
| **Campos por Categoria** | ✅ | Organização automática dos campos em categorias visuais, facilitando navegação e compreensão do template. |
| **Tipos de Campo Múltiplos** | ✅ | Suporta **radio buttons** (escolha única), **checkboxes** (múltipla escolha) e **textarea** (texto livre) com auto-redimensionamento. |
| **Opção "Outras"** | ✅ | Campos dinâmicos para adicionar opções personalizadas além das pré-definidas. Permite múltiplos valores com botões adicionar/remover. |
| **Botão "Marcar Todas"** | ✅ | Em campos checkbox, permite marcar/desmarcar todas as opções com um clique (excluindo automaticamente a opção "Outras"). |
| **Auto-seleção Inteligente** | ✅ | Ao preencher campo "Outras", marca automaticamente o checkbox correspondente para garantir que a resposta seja incluída. |
| **Validação Visual** | ✅ | Marcadores visuais (✅/❌) aplicados automaticamente às respostas para identificação rápida de status. |
| **Campos Vazios Opcionais** | ✅ | Opção de incluir ou ocultar campos sem resposta no resultado final, mantendo o template limpo e objetivo. |
| **Formatação Jira** | ✅ | Conversão automática para markup do Jira com painéis coloridos, tabelas e formatação adequada. |
| **Links de Documentação** | ✅ | Suporte a links no cabeçalho do modal para acesso rápido a documentação relacionada ao template. |
| **Personalização de Cores** | ✅ | Campos podem ter cores de fundo personalizadas (bgColor, titleBGColor) para destaque visual no resultado. |
| **Modo Tabela ou Painel** | ✅ | Geração flexível em formato de tabela estruturada ou painéis individuais, conforme configuração do template. |
| **Prevenção de Duplicação** | ✅ | Sistema inteligente que evita duplicação de campos e eventos ao reabrir o modal, garantindo estabilidade. |
| **IDs Únicos Automáticos** | ✅ | Geração automática de identificadores únicos usando timestamp para campos dinâmicos "Outras". |
| **Feedback de Carregamento** | ✅ | Indicador visual durante a criação do modelo, informando o progresso ao usuário. |


### ⏱️ Folha de Horas (Timesheets)

| Função | Status | Descrição |
|--------|--------|-----------|
| **Cor por média diária** | ✅ | Indicação visual do desempenho |
| **Copiar nome do colaborador** | ⚠️ | Desativado |
| **Configuração de limites** | ✅ | Ajuste de limites diários |
| **Exportações** | ✅ | Relatório, Resumo, CSV, JSON |
| **Estatísticas na tela** | ✅ | Indicadores variados |
| **Informações do período** | ✅ | Visão ampla do desempenho |
| **Análises diversas** | ✅ | Performance, produtividade e distribuição |
| **Alertas** | ✅ | Notificações úteis |
| **Média por colaborador/dia útil** | ✅ | Cálculos automáticos |
| **Configuração de mín./média/máx.** | ✅ | Controle completo |

### 🛠️ Sistema / Jira

| Função | Status | Descrição |
|--------|--------|-----------|
| **Logo atualizada** | ✅ | Versão mais recente |
| **Checagem de atualização automática** | ✅ | Verifica se há atualizações disponíveis |

---

## 📎 Dicas de uso
- Mantenha a pasta do plugin organizada para facilitar atualizações
- Ao baixar uma atualização, delete os arquivos antigos e adicione os novos na mesma pasta
- Se algo não carregar, desabilite e habilite a extensão novamente ou clique em "Atualizar / Update"
- Sugestões ou bugs? Envie uma mensagem ao desenvolvedor

---

## ⬆️ Atualizações
- A extensão verifica automaticamente uma vez ao dia se há uma nova versão disponível
- Atualizações críticas exibem um modal obrigatório
- Se a versão instalada estiver muito defasda, o modal de atualização será exibido forçadamente

---

## 🤝 Contribuindo
Sugestões são bem-vindas! Basta enviar mensagem ao desenvolvedor ✨

---

## 📄 Licença
Projeto de uso interno. Reprodução não autorizada sem permissão.

---

🛠 Desenvolvido para facilitar o dia a dia no Jira 💙

---

