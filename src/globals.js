/**
 * Arquivo de variáveis globais da extensão Jiraya
 * IMPORTANTE: Deve ser carregado APÓS jiraya-tools.js
 */

// Aguardar o evento jirayaToolsReady disparado por jiraya-tools.js
window.addEventListener('jirayaToolsReady', function initGlobalsOnEvent() {
  console.log('[JIRAYA-GLOBALS] jirayaToolsReady recebido! Inicializando globals...');

  // Agora podemos usar jirayaTools com segurança
  window.JIRAYA_ELEMENTOS = {
    logo: "#logo",
    descricaoIssue: "#description-val",
    detalhesIssue: "#issuedetails",
    containerDescricaoIssue: "#description-form",
    headerIssue: ".issue-view .aui-page-header",
    modalRegistrarTempo: "#tempo-global-dialog-bundled",
    menuLateral: ".aui-navgroup-inner.sidebar-content-container.jira-navigation",
    menuLateralFooter: ".aui-sidebar-footer",
    tituloIssue: "#summary-val",
    linkIssue: ".aui-nav.aui-nav-breadcrumbs",
    listaComentarios: ".issue-data-block[id*='comment-']",
    containerComentarios: "#issue_actions_container",
    comentario: ".wiki-edit:visible",
    editarComentarioContainer: ".jira-editor-container:visible",
    barraAcoesComentario: ".wiki-button-bar-content",
    botaoComentario: "#footer-comment-button",
    modalEditarIssue: "#edit-issue-dialog",
    geralIssue: "#customfield-panel-1",
    modalEditarComentario: "#edit-comment",
    botaoJirayaEditor: ".botao-template-customizado",
    blocoDeCodigo: ".preformattedContent.panelContent",
    blocoDeCodigoNaoProcessado:
      ".preformattedContent.panelContent:not([data-jiraya-processado='true'])",
    folhaDeHoras: "#tt-project-timesheet-app",
    tempoReportContainer: ".tempo-report-container",
    modalImpedimento: "form#impediment-classification",
    rotulosTDN: "#edit-labels-dialog",
    menuSuperiorTDN: ".aui-header-secondary",
  };

  window.JIRAYA = {
    ATIVO: true, // Será atualizado pela função verificarEstadoPlugin
    ATIVO_JIRA: true,
    ATIVO_TDN: true,
    VERSAO_LIMITE: 0.10,
    LINK_DOCUMENTACAO:
      "https://jirayaplugin.short.gy/documentacao",
    LINK_DOWNLOAD:
      "https://jirayaplugin.short.gy/download",
    LINK_ATUALIZACAO: "https://raw.githubusercontent.com/franciscol99/jiraya.github.io/refs/heads/main/update_.json",
    LINK_IA_TDN: "https://totvs.dta.totvs.ai/admin/#/public/chat/dta-varejo-supermercados-engenharia/flow/068934bc-13c3-7857-8000-aaaa1ff39ba3?appVersion=13&apiKey=sk-4fecuFxe230Fmwd-FJIA4fQgF3-k1schgf-KFWxpTEm6K2Wn",
    LINK_MODELOS: "https://raw.githubusercontent.com/franciscol99/jiraya.github.io/refs/heads/main/src/modelos/",
    EMAIL_CONTATO: "francisco.ben@totvs.com.br",
    APP_NOME: chrome.runtime.getManifest().name || "Jiraya Plugin",
    VERSAO: chrome.runtime.getManifest().version || "",
    IMAGENS: {
      LOGO_TOTVS_BRANCO: chrome.runtime.getURL(
        "/midias/imagens/logo-totvs-branco.png"
      ),
      ICONE_48: chrome.runtime.getURL("/midias/icones/icone48.png"),
    },
    TDN: {
      ADD_ROTULO: true,
    },
    COMENTARIOS_FLAG: {},
    COMENTARIOS_ISSUE: {},
    mensagens: {
      avisoCausaOcorrenciaPendente: "Causa ocorrência pendente",
      testeDeAceitacaoFinalizado: "Concluído com sucesso.",
    },
    emojs: {
      ok: `(/)`,
      erro: `(x)`,
      info: `(i)`,
      alert: `(!)`,
      mais: `(+)`,
      menos: `(-)`,
      pergunta: `(?)`,
      estrela: `(*)`,
      estrela2: `(*y)`,
      bandeiraVermelha: `(flag)`,
      bandeiraBranca: `(flagoff)`,
    },
    textos: {},
    // Usar ícones da fonte única (icones.js)
    icones: window.JIRAYA_ICONES || {
      iaTdn: /* html */`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" width="44" height="44" style="--base-time: 10s; --play-state: paused;">
          <style>
            .animated-group {
              --anim-time: var(--base-time, 0);
              --anim-state: var(--play-state, 'running');
              animation: spinAndFade var(--anim-time) ease-out infinite;
              animation-play-state: var(--anim-state, 'running');
              transform-origin: center;
            }
            .spin {
              --anim-time: calc(var(--base-time, 0) * 3);
              --anim-state: var(--play-state, 'running');
              animation: spin var(--anim-time) linear infinite;
              animation-play-state: var(--anim-state);
              transform-origin: center;
            }
            @keyframes spinAndFade {
              0% { transform: scale(1) rotate(0deg); opacity: 1; }
              30% { transform: scale(1.5) rotate(220deg); opacity: 0; }
              31% { transform: scale(0.1) rotate(220deg); opacity: 0; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <mask id="a" width="30" height="30" x="3" y="0" maskUnits="userSpaceOnUse" style="mask-type: alpha;">
            <path fill="#000" d="M54.17.625a97.675 97.675 0 0 1 36.673 21.173c2.01 1.843 3.436 4.245 4.03 6.906a97.679 97.679 0 0 1 0 42.592c-.594 2.661-2.02 5.063-4.03 6.906A97.667 97.667 0 0 1 54.17 99.376a13.503 13.503 0 0 1-8.117 0A97.676 97.676 0 0 1 9.38 78.202c-2.01-1.843-3.436-4.245-4.03-6.906a97.678 97.678 0 0 1 0-42.592c.594-2.662 2.02-5.063 4.03-6.906A97.667 97.667 0 0 1 46.053.625a13.5 13.5 0 0 1 8.117 0Z"></path>
          </mask>
          <g mask="url(#a)">
            <g class="spin">
              <circle cx="50.111" cy="49.938" r="50.763" fill="#254687"></circle>
              <circle cx="50.111" cy="49.938" r="50.763" fill="url(#b)" shape-rendering="crispEdges"></circle>
              <circle cx="50.111" cy="49.938" r="50.763" fill="url(#c)" fill-opacity=".52" shape-rendering="crispEdges"></circle>
              <circle cx="50.111" cy="49.938" r="50.763" fill="url(#d)" fill-opacity=".52" shape-rendering="crispEdges"></circle>
              <circle cx="50.111" cy="49.938" r="50.763" fill="url(#e)" fill-opacity=".52" shape-rendering="crispEdges"></circle>
              <circle cx="50.111" cy="49.938" r="50.763" fill="url(#f)" fill-opacity=".52" shape-rendering="crispEdges"></circle>
            </g>
          </g>
          <g class="animated-group">
            <path fill="#fff" d="M59.86 72.57c.25-.73.48-1.488.701-2.27a67.815 67.815 0 0 1-4.73-1.57c-.22.796-.454 1.56-.702 2.294-1.972 5.813-4.094 7.364-5.036 7.364-.667 0-1.825-.76-3.078-2.897-.7-1.194-1.362-2.698-1.96-4.467a40.308 40.308 0 0 1-.812-2.701c-.09-.337-.176-.674-.259-1.013a58.894 58.894 0 0 1-.935-4.722c-.053-.325-.102-.65-.147-.978l-.144-1.064a81.438 81.438 0 0 1-.597-7.57 94.545 94.545 0 0 1-.019-5.269 77.543 77.543 0 0 0-5.005 3.555c.034 2.501.168 4.992.4 7.407.123 1.265.272 2.51.448 3.725l.153 1.021c.291 1.862.666 3.71 1.123 5.538l.26.989c.25.91.518 1.788.802 2.63 3.004 8.855 6.97 10.714 9.767 10.714 2.798 0 6.764-1.859 9.767-10.715l.002-.001Z"></path>
            <path fill="#fff" d="M79.452 66.406c1.4-2.382 1.744-6.687-4.558-13.67A49.602 49.602 0 0 0 73.241 51a65.776 65.776 0 0 1-3.748 3.242c.573.565 1.13 1.146 1.67 1.742 3.73 4.135 4.135 6.431 4.135 7.225 0 .31-.057.568-.164.748-.332.563-1.582 1.166-4.09 1.166-1.402 0-3.057-.19-4.918-.562-.937-.19-1.867-.41-2.789-.662a44.087 44.087 0 0 1-1.02-.287 62.82 62.82 0 0 1-4.632-1.564l-.933-.365-1.005-.409a84.1 84.1 0 0 1-6.97-3.279c-.9-.47-1.79-.957-2.672-1.458a81.406 81.406 0 0 1-1.985-1.16c.13 2.02.34 4.036.631 6.04a95.678 95.678 0 0 0 6.726 3.363c1.18.526 2.35 1.024 3.506 1.48l.98.38a66.212 66.212 0 0 0 5.44 1.813l1.002.273c.9.239 1.808.45 2.721.633 2.186.44 4.176.662 5.92.662 4.11 0 7.016-1.251 8.406-3.615Z"></path>
            <path fill="#fff" d="M35.06 69.583a44.48 44.48 0 0 0 2.352-.538 65.526 65.526 0 0 1-.98-4.81c-.81.213-1.6.396-2.372.55-1.862.375-3.518.564-4.919.564-2.51 0-3.76-.603-4.089-1.17-.332-.565-.24-1.93 1.014-4.064.7-1.191 1.694-2.505 2.958-3.904A41.588 41.588 0 0 1 31 54.17c.247-.243.502-.486.763-.727a60.402 60.402 0 0 1 3.695-3.156l.788-.612.863-.653a85.185 85.185 0 0 1 6.377-4.294 95.759 95.759 0 0 1 4.635-2.651 78.563 78.563 0 0 0-5.635-2.48 93.048 93.048 0 0 0-6.328 4.04A81.846 81.846 0 0 0 33.1 45.88l-.826.643a65.728 65.728 0 0 0-4.32 3.726c-.92.87-1.807 1.775-2.658 2.713-6.303 6.985-5.958 11.288-4.558 13.669 1.39 2.365 4.295 3.616 8.404 3.616 1.75 0 3.741-.222 5.922-.662l-.004-.003Z"></path>
            <path fill="#fff" d="M57.704 60.353a95.712 95.712 0 0 0 6.326-4.043 79.945 79.945 0 0 0 3.059-2.241l.827-.644a64.89 64.89 0 0 0 4.316-3.725c.25-.235.497-.473.74-.714.68-.668 1.32-1.335 1.92-2 1.478-1.64 2.67-3.222 3.543-4.706 2.054-3.497 2.405-6.596 1.016-8.961-1.39-2.366-4.295-3.617-8.405-3.617-1.75 0-3.74.222-5.922.662-.79.158-1.574.337-2.354.538.388 1.59.715 3.195.982 4.81.81-.213 1.6-.396 2.372-.552 1.862-.372 3.516-.562 4.918-.562 1.947 0 2.986.357 3.515.658.278.157.473.329.576.51.473.803.169 3.385-3.97 7.97-.61.677-1.27 1.358-1.975 2.04-.25.243-.502.484-.763.73a62.023 62.023 0 0 1-3.697 3.156s-1.36 1.048-1.65 1.264a84.225 84.225 0 0 1-6.377 4.293 89.434 89.434 0 0 1-4.634 2.654c1.356.659 2.73 1.28 4.12 1.864.51.212 1.017.418 1.519.616h-.002Z"></path>
            <path fill="#fff" d="M61.743 49.667c.442-.325.877-.652 1.303-.98a90.72 90.72 0 0 0-.4-7.404 82.737 82.737 0 0 0-.448-3.728l-.153-1.022a63.814 63.814 0 0 0-1.125-5.537c-.084-.332-.168-.66-.26-.988a43.917 43.917 0 0 0-.8-2.63c-.705-2.08-1.506-3.884-2.378-5.37-2.056-3.498-4.61-5.346-7.39-5.346-2.78 0-6.762 1.858-9.768 10.714-.247.73-.482 1.488-.702 2.27 1.524.443 3.112.97 4.73 1.57.22-.794.455-1.56.702-2.294 1.78-5.24 3.6-6.73 4.3-7.128.27-.154.524-.236.738-.236.944 0 3.066 1.551 5.04 7.367.29.855.56 1.76.81 2.703l.258 1.013c.363 1.503.678 3.091.932 4.72.053.322.103.65.148.975l.143 1.064c.31 2.42.51 4.968.597 7.57.061 1.757.068 3.515.021 5.272a78.765 78.765 0 0 0 3.702-2.575Z"></path>
            <path fill="#fff" d="M30.692 45.48a42.776 42.776 0 0 1-1.669-1.741c-4.138-4.585-4.445-7.168-3.973-7.97.332-.568 1.582-1.172 4.09-1.172 1.396 0 3.053.19 4.92.566.901.18 1.832.4 2.784.66.34.092.681.186 1.025.288 1.564.461 3.11.983 4.633 1.563l.932.364 1.005.41a84.02 84.02 0 0 1 6.973 3.278c.89.467 1.78.956 2.667 1.46.673.38 1.335.767 1.987 1.158a76.02 76.02 0 0 0-.63-6.038 95.3 95.3 0 0 0-6.727-3.362 81.37 81.37 0 0 0-4.487-1.862 66.438 66.438 0 0 0-5.437-1.813l-1.005-.273c-.9-.238-1.807-.449-2.72-.633-2.18-.44-4.173-.662-5.922-.662-4.108 0-7.015 1.25-8.404 3.617-1.4 2.38-1.745 6.685 4.558 13.67a46.479 46.479 0 0 0 1.652 1.732 66.924 66.924 0 0 1 3.748-3.24Z"></path>
          </g>
          <defs>
            <radialGradient id="b" cx="0" cy="0" r="1" gradientTransform="rotate(41.313 -16.512 22.454) scale(52.4517 48.9487)" gradientUnits="userSpaceOnUse">
              <stop offset=".186" stop-color="#A44DFF"></stop>
              <stop offset=".935" stop-color="#A44DFF" stop-opacity=".44"></stop>
            </radialGradient>
            <radialGradient id="c" cx="0" cy="0" r="1" gradientTransform="matrix(-61.68965 61.0811 -57.8984 -58.47524 96.94 25.843)" gradientUnits="userSpaceOnUse">
              <stop offset=".284" stop-color="#14E0FF"></stop>
              <stop offset=".935" stop-color="#0BDDFF" stop-opacity="0"></stop>
            </radialGradient>
            <radialGradient id="d" cx="0" cy="0" r="1" gradientTransform="matrix(33.60921 -55.9033 53.90382 32.40713 24.494 94.4)" gradientUnits="userSpaceOnUse">
              <stop offset=".107" stop-color="#13335D"></stop>
              <stop offset=".684" stop-color="#10355C" stop-opacity="0"></stop>
            </radialGradient>
            <radialGradient id="e" cx="0" cy="0" r="1" gradientTransform="rotate(-126.529 62.32 23.982) scale(45.3175 42.1132)" gradientUnits="userSpaceOnUse">
              <stop offset=".173" stop-color="#037F99"></stop>
              <stop offset=".935" stop-color="#038DA8" stop-opacity="0"></stop>
            </radialGradient>
            <radialGradient id="f" cx="0" cy="0" r="1" gradientTransform="rotate(160.451 45.36 24.429) scale(65.1168 60.5124)" gradientUnits="userSpaceOnUse">
              <stop offset=".173" stop-color="#05E2FF"></stop>
              <stop offset=".935" stop-color="#0BDDFF" stop-opacity="0"></stop>
            </radialGradient>
          </defs>
        </svg>`,
    },
  };

  // Função para verificar e atualizar o estado do plugin
  window.JIRAYA.verificarEstadoPlugin = function() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getConfig' }, function(response) {
        const config = response.config || {};
        console.log('[JIRAYA-GLOBALS] Config recebida:', config);
        
        // Verificar se foi desativado pelo servidor
        if (config.desativadoPeloServidor === true) {
          console.log('[JIRAYA-GLOBALS] Extensão foi desativada pelo servidor. Não carregar nenhuma função.');
          window.JIRAYA.ATIVO_JIRA = false;
          window.JIRAYA.ATIVO_TDN = false;
          window.JIRAYA.ATIVO_IA_TDN = false;
          window.JIRAYA.ATIVO = false;
          window.JIRAYA.DESATIVADO_SERVIDOR = true;
          window.JIRAYA.AVISO_ADMIN = config.avisoAdmin || null;
          resolve(false);
          return;
        }
        
        // Verificar se foi desativado pelo usuário via toggle
        chrome.storage.local.get(['jiraya_ativo'], function(result) {
          const jirayaAtivo = result.jiraya_ativo !== false; // Padrão: true
          
          // Se usuário desativou, não carregar extensão
          if (!jirayaAtivo) {
            console.log('[JIRAYA-GLOBALS] Extensão foi desativada pelo usuário. Não carregar nenhuma função.');
            window.JIRAYA.ATIVO_JIRA = false;
            window.JIRAYA.ATIVO_TDN = false;
            window.JIRAYA.ATIVO_IA_TDN = false;
            window.JIRAYA.ATIVO = false;
            resolve(false);
            return;
          }
          
          // Padrão: ativo nos dois sites
          window.JIRAYA.ATIVO_JIRA = config.ativoJira !== undefined ? config.ativoJira : true;
          window.JIRAYA.ATIVO_TDN = config.ativoTDN !== undefined ? config.ativoTDN : true;
          window.JIRAYA.ATIVO_IA_TDN = config.ativoIaTDN !== undefined ? config.ativoIaTDN : true;
          window.JIRAYA.DESATIVADO_SERVIDOR = false;
          
          // Detectar site atual
          const ehJira = window.location.hostname.includes('jira');
          const ehTDN = window.location.hostname.includes('tdn.totvs.com');
          
          // Definir ATIVO baseado no site atual
          if (ehJira) {
            window.JIRAYA.ATIVO = window.JIRAYA.ATIVO_JIRA;
          } else if (ehTDN) {
            window.JIRAYA.ATIVO = window.JIRAYA.ATIVO_TDN;
          } else {
            window.JIRAYA.ATIVO = true; // Outros sites sempre ativo
          }
          
          resolve(window.JIRAYA.ATIVO);
        });
      });
    });
  };

  // Função para obter informações de atualização encriptadas
  window.JIRAYA.obterInfoAtualizacao = function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['jiraya-update-info'], function(result) {
        const infoEncriptada = result['jiraya-update-info'];
        if (!infoEncriptada) {
          console.log('[JIRAYA-GLOBALS] Nenhuma informação de atualização encontrada');
          resolve(null);
          return;
        }
        
        try {
          const info = jirayaTools.decriptar(infoEncriptada, true);
          console.log('[JIRAYA-GLOBALS] Informações de atualização decriptadas com sucesso');
          resolve(info);
        } catch (error) {
          console.error('[JIRAYA-GLOBALS] Erro ao decriptar informações:', error);
          resolve(null);
        }
      });
    });
  };

  // Função para salvar configuração
  window.JIRAYA.salvarConfig = function(ativoJira, ativoTDN, ativoIaTDN) {
    return new Promise((resolve) => {
      const config = {
        ativoJira: ativoJira,
        ativoTDN: ativoTDN,
        ativoIaTDN: ativoIaTDN !== undefined ? ativoIaTDN : true
      };
      
      chrome.runtime.sendMessage({ action: 'setConfig', config: config }, function(response) {
        if (response.success) {
          // Atualizar variáveis
          window.JIRAYA.ATIVO_JIRA = ativoJira;
          window.JIRAYA.ATIVO_TDN = ativoTDN;
          window.JIRAYA.ATIVO_IA_TDN = config.ativoIaTDN;
          window.JIRAYA.verificarEstadoPlugin().then(resolve);
        }
      });
    });
  };

  // Verificar estado inicial
  window.JIRAYA.verificarEstadoPlugin().then(() => {
    // Disparar evento indicando que globals está pronto para jiraya.js
    window.dispatchEvent(new CustomEvent('JirayaGlobalsReady'));
    console.log('[JIRAYA-GLOBALS] Globals inicializado com sucesso!');
    console.log('[JIRAYA-GLOBALS] Plugin ativo:', window.JIRAYA.ATIVO, '| Jira:', window.JIRAYA.ATIVO_JIRA, '| TDN:', window.JIRAYA.ATIVO_TDN, '| IA TDN:', window.JIRAYA.ATIVO_IA_TDN);
  });
  
  // Remover o listener após executar uma vez
  window.removeEventListener('jirayaToolsReady', initGlobalsOnEvent);
}, { once: true });

