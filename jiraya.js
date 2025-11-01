
window.JIRAYA_ELEMENTOS = {
  logo: "#logo",
  detalhesIssue: "#issuedetails",
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
};

window.JIRAYA = {
  EMAIL_CONTATO: "francisco.ben@totvs.com.br",
  APP_NOME: chrome.runtime.getManifest().name || "Jiraya Plugin",
  VERSAO: chrome.runtime.getManifest().version || "",
  IMAGENS: {
    LOGO_TOTVS_BRANCO: chrome.runtime.getURL(
      "/midias/imagens/logo-totvs-branco.png"
    ),
    ICONE_48: chrome.runtime.getURL("/midias/icones/icone48.png"),
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
  textos: {
    botaoCopiar: "copiar", //📋
    botaoCopiarSucesso: "copiado", //✅
    botaoCopiarErro: "erro ao copiar", //❌
  },
};
function elementosObservados() {
  // tudo que tiver que observar, precisa estar aqui, mesmo que seja colocado em outro metodo
  observarElementoVisivel({
    seletor: "textarea:visible",
    callback: function () {
      $("textarea:visible:not([data-jiraya-textarea])").each(function () {
        $(this).attr("data-jiraya-textarea", true);
        jirayaModeloUtil.configurarRedimensionamentoAutomatico($(this), 2);
      });
    },
    nome: "Modal de edição de comentário",
    aguardarVisibilidade: true,
  });
  observarElementoVisivel({
    seletor: "input:visible",
    callback: function () {
      $("input:visible:not([data-jiraya-input])").each(function () {
        $(this).attr("data-jiraya-input", true);
      });
    },
    nome: "Modal de edição de comentário",
    aguardarVisibilidade: true,
  });

  // observarElementoVisivel({
  //   seletor: JIRAYA_ELEMENTOS.modalRegistrarTempo,
  //   callback: modalEditarIssueAberto,
  //   nome: "Registrar tempo",
  //   aguardarVisibilidade: true,
  // });

  observarElementoVisivel({
    seletor: JIRAYA_ELEMENTOS.blocoDeCodigoNaoProcessado,
    callback: function (elemento) {
      jirayaTools.adicionarBotaoCopiar($(elemento));
    },
    nome: "Botao de Copiar",
    aguardarVisibilidade: true,
  });

  observarElementoVisivel({
    seletor: JIRAYA_ELEMENTOS.comentario,
    callback: comentarioAberto,
    nome: "Box de comentário",
    aguardarVisibilidade: true,
  });

  // ISSUE
  if (jirayaTools.ehIssue()) {
    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.listaComentarios,
      callback: fixarComentariosFlag,
      nome: "Lista de Comentários",
      aguardarVisibilidade: true,
      condicao: (elemento) => jirayaTools.ehIssue(),
    });

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.geralIssue,
      callback: abaGeralIssue,
      nome: "Issue geral",
      aguardarVisibilidade: false,
      condicao: (elemento) =>
        JIRAYA.tipo == "Manutenção" && jirayaTools.ehIssue(),
    });

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.modalEditarIssue,
      callback: modalEditarIssueAberto,
      nome: "Modal de edição",
      aguardarVisibilidade: true,
      condicao: (elemento) => jirayaTools.ehIssue(),
    });

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.editarComentarioContainer,
      callback: tratamentoEditarComentario,
      nome: "Modal de edição de comentário",
      aguardarVisibilidade: true,
      condicao: (elemento) => jirayaTools.ehIssue(),
    });
  }

  observarElementoVisivel({
    seletor: JIRAYA_ELEMENTOS.modalImpedimento,
    callback: classificarImpedimento,
    nome: "Classificar Impedimento",
    aguardarVisibilidade: true,
    condicao: (elemento) =>
      $("select#classification").val() === "Retorno Suporte",
  });

  // folha de horas
  observarElementoVisivel({
    seletor: JIRAYA_ELEMENTOS.folhaDeHoras,
    callback: function (elemento) {
      jirayaFolhaDeHoras.inicializar();
    },
    nome: "Folhas de Hora",
    aguardarVisibilidade: true,
  });
}

jirayaTools.injetarJQuery(() => {
  $(function () {
    injetarComponentes();
    if (jirayaTools) jirayaTools.inicializar();
    if (jirayaModeloCustomizado) jirayaModeloCustomizado.inicializar();
    if (jirayaModeloUtil) jirayaModeloUtil.inicializar();
    if (jirayaFolhaDeHoras) jirayaFolhaDeHoras.inicializar();
    if (jirayaBarraFerramentas) jirayaBarraFerramentas.inicializar();
    if (jirayaMotorModelos) jirayaMotorModelos.inicializar();
  })
    .on(
      "click",
      "[name=add-comment], .edit-comment",
      function () {
        observarElementoVisivel({
          seletor: JIRAYA_ELEMENTOS.comentario,
          callback: comentarioAberto,
          nome: "Box de comentário",
          aguardarVisibilidade: true,
          condicao: (elemento) => jirayaTools.ehIssue(),
        });
        observarElementoVisivel({
          seletor: JIRAYA_ELEMENTOS.editarComentarioContainer,
          callback: tratamentoEditarComentario,
          nome: "Modal de edição de comentário",
          aguardarVisibilidade: true,
          condicao: (elemento) => jirayaTools.ehIssue(),
        });
      }
    )
    .on("change", "select#classification", function () {
      classificarImpedimento();
    });
  // .on(
  //   "mousedown",
  //   ".sc-gKXOVf.sc-iBkjds.jiLcsj.fGtqyQ:contains('Edit Worklog')",
  //   function () {
  //     listarHorariosBatidosNoEditar();
  //   }
  // )
  // .on(
  //   "mouseup",
  //   ".sc-gKXOVf.sc-iBkjds.jiLcsj.fGtqyQ:contains('Edit Worklog')",
  //   function () {
  //     setTimeout(() => {
  //       $("body").after($('<div class="jiraya-modal-worklog"></div>').append(window.JIRAYA_TEMP_CLONE));
  //     }, 1000);
  //   }
  // );
});

async function injetarComponentes() {
  jirayalog("Jiraya injetado!");

  observadoresJiraya();

  if (jirayaTools.ehIssue()) {
    var linksIssue = $(JIRAYA_ELEMENTOS.linkIssue);
    detalhesIssue = $(JIRAYA_ELEMENTOS.detalhesIssue);

    var tituloCompleto = $(JIRAYA_ELEMENTOS.tituloIssue).text().trim();
    var prefixosParaRemover = [
      "Codificação -",
      "Code Review -",
      "Teste Integrado -",
      "Documentação - ",
      "Revisão documentação técnico -",
      "Merge -",
    ];

    var tituloIssue = tituloCompleto;
    prefixosParaRemover.forEach((prefixo) => {
      if (tituloCompleto.startsWith(prefixo)) {
        tituloIssue = tituloCompleto.substring(prefixo.length).trim();
      }
    });

    const projectNameEl = linksIssue.find("#project-name-val");
    const issueLinkFirst = linksIssue.find(".issue-link").first();
    const issueLinkLast = linksIssue.find(".issue-link").last();
    const tipoEl = detalhesIssue
      .find("strong[title=Tipo]")
      .closest(".wrap")
      .find("#type-val");
    const prioridadeEl = detalhesIssue
      .find("strong[title=Prioridade]")
      .closest(".wrap")
      .find("#priority-val");

    window.JIRAYA.EQUIPE = obterTextoSeguro(projectNameEl, (texto) =>
      splitSeguro(texto, " - ", 1)
    );
    window.JIRAYA.ISSUE_PAI = obterTextoSeguro(issueLinkFirst, (texto) =>
      splitSeguro(texto, " ", 0)
    );

    window.JIRAYA.ISSUE = obterTextoSeguro(issueLinkLast);
    window.JIRAYA.TITULO_PAGINA = tituloCompleto || "";
    window.JIRAYA.TITULO = tituloIssue || "";
    window.JIRAYA.TIPO = obterTextoSeguro(tipoEl);
    window.JIRAYA.PRIORIDADE = obterTextoSeguro(prioridadeEl);

    window.JIRAYA.COMENTARIOS_FLAG[JIRAYA.ISSUE] = [];
    window.JIRAYA.COMENTARIOS_ISSUE[JIRAYA.ISSUE] = [];

    jirayalog("Issue detectada:", window.JIRAYA);

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.listaComentarios,
      callback: fixarComentariosFlag,
      nome: "Lista de Comentários",
      aguardarVisibilidade: true,
      condicao: (elemento) => jirayaTools.ehIssue(),
    });

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.geralIssue,
      callback: abaGeralIssue,
      nome: "Issue geral",
      aguardarVisibilidade: false,
      condicao: (elemento) =>
        JIRAYA.tipo == "Manutenção" && jirayaTools.ehIssue(),
    });

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.comentario,
      callback: comentarioAberto,
      nome: "Box de comentário",
      aguardarVisibilidade: true,
      condicao: (elemento) => jirayaTools.ehIssue(),
    });

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.modalEditarIssue,
      callback: modalEditarIssueAberto,
      nome: "Modal de edição",
      aguardarVisibilidade: true,
      condicao: (elemento) => jirayaTools.ehIssue(),
    });

    observarElementoVisivel({
      seletor: JIRAYA_ELEMENTOS.editarComentarioContainer,
      callback: tratamentoEditarComentario,
      nome: "Modal de edição de comentário",
      aguardarVisibilidade: true,
      condicao: (elemento) => jirayaTools.ehIssue(),
    });
  }

  var identificacaoJiraya = $("<div>").addClass("jiraya-plugin-container");
  JirayaImagemUtil.getImagemSrc("/midias/icones/icone48.png").then((img) => {
    JIRAYA.IMAGENS.ICONE_48 = img;
    $("<img>")
      .attr("src", img)
      .addClass("jiraya-plugin-icone")
      .addClass("jira-issue-status-lozenge")
      // .attr(
      //   "data-tooltip",
      //   `<span class="jira-issue-status-tooltip-title">${window.JIRAYA.APP_NOME} - ${window.JIRAYA.VERSAO}</span>`
      // )
      .appendTo(identificacaoJiraya);
  });

  $(JIRAYA_ELEMENTOS.menuLateralFooter).length > 0 &&
    $(JIRAYA_ELEMENTOS.menuLateralFooter).prepend(identificacaoJiraya);

  JirayaImagemUtil.getImagemSrc("/midias/imagens/logo-totvs-branco.png").then(
    (img) => {
      JIRAYA.IMAGENS.LOGO_TOTVS_BRANCO = img;
      $(JIRAYA_ELEMENTOS.logo).length > 0 &&
        $(JIRAYA_ELEMENTOS.logo).find("img").attr("src", img);
    }
  );
  $(JIRAYA_ELEMENTOS.logo).length > 0 &&
    $(JIRAYA_ELEMENTOS.logo).attr("style", "visibility: visible;");

  observarElementoVisivel({
    seletor: JIRAYA_ELEMENTOS.modalImpedimento,
    callback: classificarImpedimento,
    nome: "Classificar Impedimento",
    aguardarVisibilidade: true,
    condicao: (elemento) =>
      $("select#classification").val() === "Retorno Suporte",
  });
}

function observadoresJiraya() {
  const observer = new MutationObserver((mutations) => {
    // Verificar se houve mudanças relevantes antes de executar observadores
    let hasRelevantChanges = false;

    mutations.forEach((mutation) => {
      if (
        mutation.type === "childList" ||
        (mutation.type === "attributes" &&
          (mutation.attributeName === "aria-disabled" ||
            mutation.attributeName === "class") &&
          mutation.addedNodes.length > 0 &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0))
      ) {
        // Verificar se algum nó adicionado contém elementos que nos interessam
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const $node = $(node);
            Object.keys(JIRAYA_ELEMENTOS).forEach((key) => {
              if (
                $node.is(JIRAYA_ELEMENTOS[key]) ||
                $node.find(JIRAYA_ELEMENTOS[key]).length > 0 ||
                $node.closest(JIRAYA_ELEMENTOS[key]).length > 0 ||
                $node.parents(JIRAYA_ELEMENTOS[key]).length > 0
              ) {
                hasRelevantChanges = true;
              }
            });
          }
        });
      }
    });

    // Só executar observadores se houver mudanças relevantes
    if (hasRelevantChanges) {
      jirayalog("Mudanças relevantes detectadas, executando observadores");
      elementosObservados();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
}

function observarElementoVisivel(opcoes) {
  const {
    seletor,
    callback,
    nome = seletor,
    aguardarVisibilidade = false,
    maxTentativas = 20,
    intervalo = 100,
    condicao = null,
  } = opcoes;

  $(seletor)
    .not("[data-jiraya-injetado='true']")
    .not("[data-jiraya-processado='true']")
    .each(function () {
      const elemento = $(this);
      elemento.attr("data-jiraya-injetado", "true");
      jirayalog(`${nome} detectado`);

      if (condicao && !condicao(elemento)) {
        jirayalog(`${nome} não atende à condição - ignorando`);
        return;
      }

      if (!aguardarVisibilidade) {
        setTimeout(() => {
          try {
            callback(this);
          } catch (erro) {
            jirayalog(`Erro ${nome} callback:`, erro);
          }
        }, intervalo);
        return;
      }

      function verificarVisibilidade() {
        const visible = elemento.is(":visible");
        const display = elemento.css("display") !== "none";
        const visibility = elemento.css("visibility") !== "hidden";
        const opacity = parseFloat(elemento.css("opacity")) > 0;

        if (visible && display && visibility && opacity) {
          jirayalog(`${nome} está visível - executando callback`);
          elemento.attr("data-jiraya-processado", "true");
          try {
            callback(elemento[0]);
          } catch (erro) {
            jirayalog(`Erro ${nome} callback:`, erro);
          }
          return true;
        }
        return false;
      }

      if (!verificarVisibilidade()) {
        let tentativas = 0;

        const intervalId = setInterval(() => {
          tentativas++;

          if (verificarVisibilidade() || tentativas >= maxTentativas) {
            clearInterval(intervalId);
            if (tentativas >= maxTentativas) {
              jirayalog(
                `${nome} não ficou visível após ${maxTentativas} tentativas`
              );
              elemento.removeAttr("data-jiraya-injetado");
              elemento.removeAttr("data-jiraya-processado");
            }
          }
        }, intervalo);
      }
    });
}

function tratamentoEditarComentario($this) {
  jirayalog("tratamentoEditarComentario iniciado para:", $this);

  setTimeout(() => {
    const container = $($this);
    const iframe = container.find("iframe");

    if (iframe.length > 0) {
      jirayalog("Iframe encontrado, configurando auto-resize");

      function ajustarTamanhoContainer(iframeDoc) {
        try {
          const bodyHeight = $(iframeDoc.body).height();
          const scrollHeight = iframeDoc.body.scrollHeight;
          const alturaFinal = Math.max(bodyHeight, scrollHeight);

          jirayalog(
            "Ajustando tamanho - Body:",
            bodyHeight,
            "Scroll:",
            scrollHeight,
            "Final:",
            alturaFinal
          );

          if (alturaFinal > 0) {
            container.css("height", `${alturaFinal + 50}px`);
          }
        } catch (erro) {
          jirayalog("Erro ao ajustar tamanho do container:", erro);
        }
      }

      function configurarObserverIframe(iframeDoc) {
        try {
          ajustarTamanhoContainer(iframeDoc);

          observarElementoVisivel({
            seletor: $(iframeDoc.body),
            callback: function () {
              ajustarTamanhoContainer(iframeDoc);
            },
            nome: "Body do iframe",
            aguardarVisibilidade: true,
            intervalo: 50,
          });

          $(iframeDoc).on("input keyup paste change", function () {
            setTimeout(() => ajustarTamanhoContainer(iframeDoc), 50);
          });

          $(iframeDoc).on(
            "focus blur",
            "textarea, input, [contenteditable]",
            function () {
              setTimeout(() => ajustarTamanhoContainer(iframeDoc), 100);
            }
          );

          return true;
        } catch (erro) {
          jirayalog("Erro ao configurar observer do iframe:", erro);
          return null;
        }
      }

      iframe.on("load", function () {
        try {
          const iframeDoc = this.contentDocument || this.contentWindow.document;
          configurarObserverIframe(iframeDoc);
        } catch (erro) {
          jirayalog("Erro ao acessar conteúdo do iframe no load:", erro);
        }
      });

      if (
        iframe[0].contentDocument &&
        iframe[0].contentDocument.readyState === "complete"
      ) {
        try {
          const iframeDoc =
            iframe[0].contentDocument || iframe[0].contentWindow.document;
          configurarObserverIframe(iframeDoc);
        } catch (erro) {
          jirayalog("Erro ao acessar conteúdo do iframe já carregado:", erro);
        }
      }
    } else {
      jirayalog("Nenhum iframe encontrado no container");
    }
  }, 300);
}

function comentarioAberto($this) {
  var idRandom = Math.floor(Math.random() * 1000000);

  $($this).attr("data-jiraya-id", idRandom);

  jirayalog("comentarioAberto - ID:", idRandom);

  const barraDeFerramentas = $($this).find(
    ".aui-toolbar2 .aui-toolbar2-inner .aui-toolbar2-primary"
  );

  jirayalog("Barra de ferramentas encontrada:", barraDeFerramentas.length > 0);

  barraDeFerramentas.attr("data-jiraya-injetado", "true");
  barraDeFerramentasJiraya({
    elementoPai: barraDeFerramentas,
    id: idRandom,
    modo: "append",
    callback: async function () {
      jirayalog("Callback da barra de ferramentas executado");

      // Garante que o motor de templates está inicializado
      await jirayaBarraFerramentas.garantirMotorCarregamentoInicializado();

      const { botoesDiretos, dropdowns } =
        await jirayaBarraFerramentas.criarMenuAreasDinamico(
          idRandom,
          "comentario"
        );
      jirayalog("Botões diretos:", botoesDiretos);
      jirayalog("Dropdowns:", dropdowns);

      const elementoPai = $(
        `.barra-jiraya-editor-body[data-jiraya-id=${idRandom}]`
      );

      const nomePadrao = "";
      // Cria botões diretos (para modelos individuais)
      Object.keys(botoesDiretos).forEach((botaoKey) => {
        const botao = botoesDiretos[botaoKey];

        jirayaBarraFerramentas.criarBotaoDireto({
          nome: `${botao.icone || ""} ${botao.nome || nomePadrao}`,
          cor: botao.cor,
          acao: botao.acao,
          descricao: botao.descricao || "",
          elementoPai: elementoPai,
          idRandom: idRandom + "_" + botaoKey,
        });
      });

      // Cria dropdowns - categorias ou varios modelos
      Object.keys(dropdowns).forEach((areaKey) => {
        const area = dropdowns[areaKey];

        jirayaBarraFerramentas.menuSuspenso({
          descricao: area.descricao || "",
          tituloBotaoMenu: `${area.icone || ""} ${area.nome || nomePadrao}`,
          separador: area.separador,
          idRandom: idRandom + "_" + areaKey,
          elementoPai: elementoPai,
          itens: area.subItens,
          cor: area.cor,
          referencia: "comentario",
          class: "jiraya-botao-area",
        });
      });

      // Se não tiver nenhum item vai criar o botão padrão
      if (
        Object.keys(botoesDiretos).length === 0 &&
        Object.keys(dropdowns).length === 0
      ) {
        jirayaBarraFerramentas.menuSuspenso({
          descricao: "Modelos de comentário",
          tituloBotaoMenu: "Modelos",
          idRandom: idRandom,
          referencia: "comentario",
          elementoPai: elementoPai,
          itens: {},
        });
      }

      jirayalog(
        "Interface criada - Botões diretos:",
        Object.keys(botoesDiretos).length,
        "| Dropdowns:",
        Object.keys(dropdowns).length
      );
    },
  });
}

function removerBarraDeFerramentasJiraya(id) {
  const barra = $(`.barra-jiraya-editor[data-jiraya-id='${id}']`);
  if (barra.length > 0) {
    barra.remove();
  } else {
  }
}

function barraDeFerramentasJiraya(opt = {}) {
  var elemento = opt.elementoPai;
  if (
    elemento.length > 0 &&
    elemento.find(".barra-jiraya-editor").length == 0
  ) {
    var icone = JIRAYA.IMAGENS.ICONE_48;
    var barra = $("<div>")
      .attr("data-jiraya-id", opt.id)
      .addClass("barra-jiraya-editor")
      .append(
        $("<div>")
          .addClass("barra-jiraya-editor-cointainer")
          .attr("data-jiraya-id", opt.id)
          .append(
            $("<div>").addClass("barra-jiraya-editor-icone").append(
              $("<img>")
                .attr("src", icone)
                .addClass("jiraya-plugin-icone")
                .addClass("jira-issue-status-lozenge")
              // .attr(
              //   "data-tooltip",
              //   `<span class="jira-issue-status-tooltip-title">${window.JIRAYA.APP_NOME} - ${window.JIRAYA.VERSAO}</span>`
              // )
            )
          )
          .append(
            $("<div>")
              .addClass("barra-jiraya-editor-body")
              .attr("data-jiraya-id", opt.id)
          )
      );
    var containerJiraya = elemento;
    if (opt.modo === "prepend") {
      containerJiraya.prepend(barra);
    } else if (opt.modo === "before") {
      containerJiraya.before(barra);
    } else if (opt.modo === "after") {
      containerJiraya.after(barra);
    } else {
      containerJiraya.append(barra);
    }
  }

  observarElementoVisivel({
    seletor: $(".barra-jiraya-editor-body[data-jiraya-id='" + opt.id + "']"),
    callback: opt.callback
      ? async function (element) {
          await opt.callback(element);
        }
      : function () {},
    nome: "Barra de ferramentas Jiraya",
    aguardarVisibilidade: true,
  });

  // (Sticky removido)
}

function criarInformativoSimples(opcoes = {}) {
  var { titulo, conteudo, icone, cor, corBorda, corBackground, tema } = opcoes;
  //
  if (tema == "warning") {
    cor = "#333";
    corBorda = "#ffeaae";
    corBackground = "#fffdf6";
    icone = '<i class="aui-icon aui-icon-small aui-iconfont-info"></i>';
  } else if (tema == "success") {
    cor = "#333";
    corBorda = "#91c89c";
    corBackground = "#f3f9f4";
    icone = '<i class="aui-icon aui-icon-small aui-iconfont-success"></i>';
  } else if (tema == "error") {
    cor = "#cf4336";
    corBorda = "#d04437";
    corBackground = "#fff8f7";
    icone = '<i class="aui-icon aui-icon-small aui-iconfont-error"></i>';
  } else if (tema == "info") {
    cor = "#344563";
    corBorda = "#dfe1e6";
    corBackground = "#f4f5f7";
    icone = '<i class="aui-icon aui-icon-small aui-iconfont-info"></i>';
  }

  var informativoSimples = $("<div>")
    .addClass("jiraya-informativo-simples")
    .css({
      "background-color": corBackground,
      border: "1px solid",
      "border-color": corBorda,
      color: cor,
      "border-radius": "4px",
      padding: "12px",
      margin: "8px 0",
      "font-size": "13px",
      "line-height": "1.4",
    })
    .append(
      $("<div>")
        .addClass("jiraya-informativo-titulo")
        .css({
          "font-weight": "bold",
          "margin-bottom": "4px",
          display: "flex",
          "align-items": "center",
          gap: "6px",
        })
        .html(`${icone} ${titulo}`)
    );

  if (conteudo) {
    informativoSimples.append(
      $("<div>")
        .addClass("jiraya-informativo-conteudo")
        .css({
          color: "#424242",
        })
        .html(conteudo)
    );
  }

  return informativoSimples;
}

function criarAvisoCausaOcorrencia() {
  var titulo =
    "ℹ️ <span>Instruções - Análise de Causa Ocorrência - PDV</span> ";
  var avisoCausaOcorrencia = $("<div>")
    .addClass("jiraya-aviso-campo")
    .append(
      $("<div>")
        .addClass(
          "jiraya-aviso-header aui-dropdown2-trigger aui-dropdown2-sub-trigger"
        )
        .html(titulo)
        .on("click", function () {
          var conteudo = $(this).next(".jiraya-instrucoes-content");
          var isVisible = conteudo.is(":visible");

          if (isVisible) {
            conteudo.slideUp(300);
            $(this)
              .empty()
              .html(titulo)
              .toggleClass("aui-dropdown2-sub-trigger");
          } else {
            conteudo.slideDown(300);
            $(this)
              .empty()
              .html(titulo)
              .toggleClass("aui-dropdown2-sub-trigger");
          }
        })
    )
    .append(
      $("<div>").addClass("jiraya-instrucoes-content").html(/* html */ `
        <div class="jiraya-secao-classificacao">
          <a href="https://tdn.totvs.com/pages/viewpage.action?pageId=896389224" target="_blank" class="jiraya-link-documentacao" >
            📚 Acesse a documentação completa sobre Análise de Causa Ocorrência - PDV
          </a>
          <h4 class="jiraya-titulo-secao">
            🔍 CLASSIFICAÇÃO DO PROBLEMA
          </h4>
          <p class="jiraya-intro-texto">O problema poderá ser classificado em 3 opções:</p>
          <div class="jiraya-card-recente">
            <span class="jiraya-label-recente">RECENTE:</span> Manutenções geradas por outras issues, a menos de 1 ano da data de abertura da issue de manutenção, rejeição-manutenção, história ou legislação.
          </div>
          
          <div class="jiraya-card-legado">
            <span class="jiraya-label-legado">LEGADO:</span> Manutenções geradas por outras issues, a mais de 1 ano da data de abertura da issue de manutenção, rejeição-manutenção, história ou legislação.
          </div>
          
          <div class="jiraya-card-novo">
            <span class="jiraya-label-novo">NOVO:</span> Manutenções geradas por problemas novos, não previstos ou mapeados anteriormente, seja na codificação da inovação, ou em manutenções que aconteceram.
          </div>
        </div>
        
        <div class="jiraya-secao-campos">
          <h4 class="jiraya-titulo-secao">
            📝 CAMPOS OBRIGATÓRIOS
          </h4>
          
          <div class="jiraya-campo-item">
            <span class="jiraya-campo-label">• CLASSIFICAÇÃO:</span> Mencionar uma das opções acima (Recente/Legado/Novo).
          </div>
          
          <div class="jiraya-campo-item">
            <span class="jiraya-campo-label">• FATO:</span> Informar a issue que originou essa manutenção. No caso de classificação "Novo", informar "Não Se Aplica".
          </div>
          
          <div class="jiraya-campo-item">
            <span class="jiraya-campo-label">• CAUSA:</span> Qual o problema que precisa ser resolvido.
          </div>
          
          <div class="jiraya-campo-item">
            <span class="jiraya-campo-label">• AÇÃO:</span> Ação realizada para solucionar o problema e evitar que se repita.
          </div>
          
          <div class="jiraya-campo-item">
            <span class="jiraya-campo-label">• AUTOMAÇÃO:</span> "Sim" (quando houver possibilidade de criar testes automatizados) ou "Não" (quando não houver possibilidade).
          </div>
          
          <div class="jiraya-campo-item">
            <span class="jiraya-campo-label">• TESTE:</span> Na reunião de análise de causa ocorrência, quando houver possibilidade de automação, deverá ser criada uma issue para este fim, vinculada à issue de manutenção como predecessora.
          </div>
        </div>
        
        <div class="jiraya-secao-exemplo">
          <h4 class="jiraya-titulo-secao">
            📄 EXEMPLO DE CAUSA OCORRÊNCIA
          </h4>
          
          <div class="jiraya-exemplo-box">
            <div class="jiraya-exemplo-item">
              <span class="jiraya-exemplo-label">[Classificação]</span> Recente
            </div>
            
            <div class="jiraya-exemplo-item">
              <span class="jiraya-exemplo-label">[Fato]</span> DSUPPDVTURING-XXXX
            </div>
            
            <div class="jiraya-exemplo-item">
              <span class="jiraya-exemplo-label">[Causa]</span> A implementação da issue DSUPPDVTURING-XXXX no método XXXXX causou o erro reportado.
            </div>
            
            <div class="jiraya-exemplo-item">
              <span class="jiraya-exemplo-label">[Ação]</span> Foi corrigido o método XXXX para não executar de maneira erronia a ação de calculo.
            </div>
            
            <div class="jiraya-exemplo-item">
              <span class="jiraya-exemplo-label">[Automação]</span> Sim
            </div>
            
            <div class="jiraya-exemplo-item">
              <span class="jiraya-exemplo-label">[Teste]</span> Deverá ser preenchido quando a issue for criada.
            </div>
          </div>
        </div>
      `)
    );

  return avisoCausaOcorrencia;
}

function editarIssue(opt = {}) {
  $this = opt.elemento;

  Object.keys(opt.campos).forEach(function (campoKey) {
    var idRandom = Math.floor(Math.random() * 1000000);
    var campo = opt.campos[campoKey];
    var fieldGroup = $($this)
      .find(`.field-group label:contains('${campo.titulo}')`)
      .closest(".field-group");

    if (fieldGroup.length == 0) {
      jirayalog("Campo não encontrado na issue:", campo.titulo);
      return;
    }

    var label = fieldGroup.find("label");
    var textarea = fieldGroup.find("textarea");

    if (campo.informativo && campo.informativo.html) {
      if (campo.informativo.modo == "after") {
        fieldGroup.after(campo.informativo.html);
      } else if (campo.informativo.modo == "before") {
        fieldGroup.before(campo.informativo.html);
      } else if (campo.informativo.modo == "prepend") {
        fieldGroup.prepend(campo.informativo.html);
      } else {
        fieldGroup.append(campo.informativo.html);
      }
    }
    // Configura auto-resize da textarea usando o módulo jirayaModeloUtil.inserirTemplates
    // jirayaModeloUtil.configurarRedimensionamentoAutomatico(textarea);

    // Usa o novo sistema de referências se definido
    if (campo.referencia) {
      jirayalog(
        "Criando menu por referência:",
        campo.referencia,
        "para campo:",
        campo.titulo
      );

      barraDeFerramentasJiraya({
        elementoPai: textarea,
        id: idRandom,
        modo: "before",
        callback: async function () {
          await jirayaBarraFerramentas.criarMenuPorReferencia(
            campo.referencia,
            textarea,
            idRandom
          );
        },
      });
    } else if (campo.barraDeFerramentas) {
      // Sistema legado (mantido para compatibilidade)
      barraDeFerramentasJiraya({
        elementoPai: textarea,
        id: idRandom,
        modo: campo.barraDeFerramentas.modo || "before",
        callback: function () {
          var itensMenuSuspenso = campo.barraDeFerramentas.menuSuspenso.itens;
          var itens = {};
          Object.keys(itensMenuSuspenso).forEach(function (chave) {
            var item = itensMenuSuspenso[chave];
            itens[chave] = {
              nome: item.nome,
              descricao: item.descricao || "",
              acao: async function () {
                const conteudoModelo = await MODELOS[item.modelo]();
                jirayaModeloUtil.inserirTemplateTextarea(
                  conteudoModelo,
                  textarea
                );
              },
            };
          });
          jirayalog("itens", itens);
          jirayaBarraFerramentas.menuSuspenso({
            descricao: campo.barraDeFerramentas.menuSuspenso.descricao || "",
            tituloBotaoMenu:
              campo.barraDeFerramentas.menuSuspenso.tituloBotaoMenu,
            idRandom: idRandom,
            elementoPai: $(
              `.barra-jiraya-editor-body[data-jiraya-id=${idRandom}]`
            ),
            itens: itens,
          });
        },
      });
    }

    if (
      textarea.length == 0 ||
      $(JIRAYA_ELEMENTOS.botaoJirayaEditor).length > 0
    ) {
      return;
    }
  });
}

async function modalEditarIssueAberto($this) {
  // Garante que o motor está inicializado
  var idJiraya = Math.floor(Math.random() * 1000000);
  $($this).attr("data-jiraya-id", idJiraya);

  await jirayaBarraFerramentas.garantirMotorCarregamentoInicializado();

  const todasAreas = jirayaMotorModelos.obterModelosPorArea();
  const camposModal = {};

  var header = $($this).find("header");

  header.append($(jirayaTools.btnFullscreen(idJiraya)));

  Object.keys(todasAreas).forEach((areaId) => {
    const area = todasAreas[areaId];
    const infoArea = area.info;
    const referencia = infoArea.referencia;
    const tipoReferencia = infoArea.tipoReferencia;

    // Só processa referências que são explicitamente marcadas como "modal"
    if (referencia && tipoReferencia === "modal") {
      jirayalog("Campo encontrado para modal:", referencia, "da área:", areaId);

      // Cria configuração do campo baseada na referência
      const configCampo = {
        titulo: referencia, // Usa a própria referência como título do campo
        referencia: referencia,
      };

      // Adiciona informativo se configurado no JSON
      if (infoArea.informativo) {
        const infoConfig = infoArea.informativo;
        jirayalog("Configuração de informativo encontrada:", infoConfig);

        let htmlInformativo = null;

        // Gera HTML baseado no tipo
        switch (infoConfig.tipo) {
          case "causaOcorrencia":
            htmlInformativo = criarAvisoCausaOcorrencia();
            break;

          case "customHtml":
            htmlInformativo = infoConfig.conteudo || "";
            break;

          case "simples":
            htmlInformativo = criarInformativoSimples({
              titulo: infoConfig.titulo || "Informação",
              conteudo: infoConfig.conteudo || "",
              tema: infoConfig.tema || "warning", // warning, success, error, info
              icone: infoConfig.icone,
              cor: infoConfig.cor,
              corBackground: infoConfig.corBackground,
              corBorda: infoConfig.corBorda,
            });
            break;

          default:
            jirayalog("Tipo de informativo não reconhecido:", infoConfig.tipo);
        }

        if (htmlInformativo) {
          configCampo.informativo = {
            html: htmlInformativo,
            modo: infoConfig.modo || "before",
          };
        }
      }

      // Usa a referência como chave (mas sanitizada para identificador)
      const chaveCampo = referencia
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");
      camposModal[chaveCampo] = configCampo;
    }
  });

  jirayalog(
    "Campos configurados automaticamente para modal:",
    Object.keys(camposModal)
  );

  editarIssue({
    elemento: $this,
    campos: camposModal,
  });
}

function abaGeralIssue($this) {
  var idRandom = Math.floor(Math.random() * 1000000);
  $($this).attr("data-jiraya-id", idRandom);

  var filedGroup = $($this)
    .find(".item .wrap strong:contains('Causa Ocorrência')")
    .closest(".item");

  var label = filedGroup.find("strong");
  var boxDatextarea = filedGroup.find("[data-fieldtype='textarea']");

  var conteudo = boxDatextarea.find(".flooded");

  if (conteudo.length == 0) {
    var notificacao = $("<span>")
      .addClass("aui-label ghx-label ghx-label-single ghx-label-14")
      .attr(
        "data-tooltip",
        `<span class="jira-issue-status-tooltip-title">${JIRAYA.mensagens.avisoCausaOcorrenciaPendente}</span>`
      )
      .attr("original-title", "")
      .text(JIRAYA.mensagens.avisoCausaOcorrenciaPendente);

    var avisoPreenchimento = $("<span>")
      .css({
        color: "red",
        "font-weight": "bold",
        "margin-left": "10px",
      })
      .text("⚠️ Preencha a causa ocorrência assim que possível.");

    $(JIRAYA_ELEMENTOS.tituloIssue).append("<br>").append(notificacao);
    return;
  }
}

function fixarComentariosFlag(elemento) {
  const comentario = $(elemento);
  const id = $(comentario).attr("id").split("-")[1];
  const autor = obterTextoSeguro($(comentario).find(".user-hover"));
  const data = $(comentario).find(".date").attr("title");
  const conteudo = $(comentario).find(".action-body");
  const conteudoTexto = obterTextoSeguro(conteudo);
  const flag = conteudo.find('img[src*="flag.png"]').length > 0;
  window.JIRAYA.COMENTARIOS_ISSUE[JIRAYA.ISSUE].push({
    issue: JIRAYA.ISSUE,
    id: id,
    autor: autor,
    data: data,
    conteudo: conteudoTexto,
  });
  $(comentario)
    // .find(".action-links")
    .prepend(
      $("<span>")
        .addClass("jiraya-btn-menu-dropdown-comentario")
        .on("click", function (e) {
          e.stopPropagation();
          menuDropDownCustom({
            botao: this,
            itensMenu: [
              `<a class="jiraya-menu-dropdown-custom-item jiraya-exportar-comentario" jiraya-data-comentario="${id}">Baixar comentário</a>`,
            ],
          });
        })
    );

  if (flag) {
    $(comentario).addClass("jiraya-comentario-flag");
    window.JIRAYA.COMENTARIOS_FLAG[JIRAYA.ISSUE].push({
      issue: JIRAYA.ISSUE,
      id: id,
      autor: autor,
      data: data,
      conteudo: conteudoTexto,
    });
    $(".jiraya-badge-flag").length === 0 &&
      $(JIRAYA_ELEMENTOS.headerIssue).append(
        $("<div>")
          .addClass("jiraya-badge-flag-container")
          .append(
            $("<a>")
              .attr("href", JIRAYA_ELEMENTOS.containerComentarios)
              .addClass("jiraya-badge-flag")
              .html("Comentário com flag")
          )
          .append(
            $("<span>")
              .addClass(
                "jiraya-btn-outline-secundario jiraya-badge-flag-download"
              )
              .html("Baixar flags")
              .on("click", function () {
                exportarComentariosComFlag();
              })
          )
      );
  }
  $(".jiraya-comentario-flag").each(function () {
    $(this).parent().prepend(this);
  });
}
function exportarComentario(idComentario) {
  jirayaTools.mostrarLoading("Preparando download do comentário...");
  setTimeout(() => {
    var comentarios = window.JIRAYA.COMENTARIOS_ISSUE[JIRAYA.ISSUE].filter(
      (c) => c.id == idComentario
    );
    if (comentarios.length == 0) {
      jirayaTools.ocultarLoading();
      alert("Comentário não encontrado.");
      return;
    }
    var issue = JIRAYA.ISSUE;
    let relatorio = "";
    relatorio += `Comentário - Issue ${issue}\n`;
    relatorio += `${"-".repeat(50)}`;
    Object.values(comentarios).forEach((comentario) => {
      idComentario = comentario.id;
      relatorio += `\n${"-".repeat(50)}\n\n`;
      relatorio += `ID Comentário: ${comentario.id}\n`;
      relatorio += `Autor: ${comentario.autor}\n`;
      relatorio += `Issue: ${comentario.issue}\n`;
      relatorio += `Data: ${comentario.data}\n`;
      relatorio += `Conteúdo: \n${comentario.conteudo}\n`;
      relatorio += `\n${"-".repeat(50)}\n`;
    });
    // relatorio += `\n${"-".repeat(50)}\n`;
    jirayaTools.baixarArquivo(
      relatorio,
      `COMENTARIO_${issue}_${idComentario}_${jirayaTools.obterDataFormatada()}.txt`,
      "text/plain"
    );
    jirayaTools.ocultarLoading();
  }, 1000);
}

function exportarComentariosComFlag() {
  jirayaTools.mostrarLoading("Preparando download dos comentários com flag...");
  setTimeout(() => {
    var comentarios = window.JIRAYA.COMENTARIOS_FLAG[JIRAYA.ISSUE];
    if (comentarios.length == 0) {
      jirayaTools.ocultarLoading();
      alert("Comentários não encontrados.");
      return;
    }
    var issue = JIRAYA.ISSUE;
    let relatorio = "";
    relatorio += `Comentários com Flag - Issue ${issue}\n`;
    relatorio += `${"-".repeat(50)}`;
    Object.values(comentarios).forEach((comentario) => {
      relatorio += `\n${"-".repeat(50)}\n\n`;
      relatorio += `ID Comentário: ${comentario.id}\n`;
      relatorio += `Autor: ${comentario.autor}\n`;
      relatorio += `Issue: ${comentario.issue}\n`;
      relatorio += `Data: ${comentario.data}\n`;
      relatorio += `Conteúdo: \n${comentario.conteudo}\n`;
      relatorio += `\n${"-".repeat(50)}\n`;
    });
    // relatorio += `\n${"-".repeat(50)}\n`;
    jirayaTools.baixarArquivo(
      relatorio,
      `COMENTARIOS_${issue}_FLAGS_${jirayaTools.obterDataFormatada()}.txt`,
      "text/plain"
    );
    jirayaTools.ocultarLoading();
  }, 1000);
}

function classificarImpedimento() {
  jirayalog("classificarImpedimento iniciado");

  var modalImpedimento = $(JIRAYA_ELEMENTOS.modalImpedimento);
  if (modalImpedimento.length == 0) {
    return;
  }

  var textarea = modalImpedimento.find("#impediment-comment");
  var idRandom = "jiraya-retornoSuporte";
  $(textarea).attr("data-jiraya-id", idRandom);

  if ($("select#classification").val() === "Retorno Suporte") {
    barraDeFerramentasJiraya({
      elementoPai: textarea,
      id: idRandom,
      modo: "before",
      callback: async function () {
        await jirayaBarraFerramentas.criarMenuPorReferencia(
          "Comentário:",
          textarea,
          idRandom
        );
      },
    });
  } else {
    removerBarraDeFerramentasJiraya(idRandom);
  }
}

function listarHorariosBatidosNoEditar() {
  var idRandom = Math.floor(Math.random() * 1000000);

  var tabela = $('[name="worklogTable"]');
  if (tabela.length == 0) {
    return;
  }
  window.JIRAYA_TEMP_CLONE = tabela.clone();
}

// Utilitário para salvar e recuperar a data da última checagem
function getDataUltimaChecagem() {
  return localStorage.getItem("jiraya-ultima-checagem-versao") || "";
}

function setDataUltimaChecagem() {
  const hoje = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  localStorage.setItem("jiraya-ultima-checagem-versao", hoje);
}
// Carrega e injeta arquivos JS e CSS na página via fetch (async)

// Checagem de atualização da extensão Chrome (com controle de frequência)
async function checarAtualizacaoExtensao(
  force = false,
  mostrarModalStatus = true
) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const ultima = getDataUltimaChecagem();
    if (!force && ultima === hoje) return; // Já checou hoje

    if (mostrarModalStatus) exibirModalChecandoVersao();

    var url = "https://franciscol99.github.io/jiraya.github.io/update.json";
    const resposta = await fetch(url, { cache: "no-cache" });
    if (!resposta.ok) throw new Error("Erro ao buscar informações de versão");
    const info = await resposta.json();

    const versaoAtual = chrome.runtime.getManifest().version;
    const versaoRemota = info.versao || info.version;
    const mensagem =
      info.mensagem || info.description || "Há uma nova versão disponível!";
    const linkAtualizacao =
      info.link || "https://chrome.google.com/webstore/detail/jiraya-plugin/";
    const linkDocumentacao =
      info.linkDocumentacao ||
      "https://github.com/franciscol99/jiraya.github.io/tree/main";
    const forcarAtualizacao = !!(info.forcarAtualizacao || info.force);

    setDataUltimaChecagem();

    var botaoImportante = ``;
    if (forcarAtualizacao) {
      botaoImportante = `<span class="jiraya-badge-text-erro">Atualização Importante</span>`;
    }
    if (mostrarModalStatus) {
      if (versaoAtual === versaoRemota) {
        // exibirModalCentralJiraya({
        //   titulo: "Extensão atualizada!",
        //   mensagem: `Versão instalada: <b>${versaoAtual}</b>`,
        //   bloquearFechar: false,
        //   importante: false,
        // });
      } else {
        exibirModalCentralJiraya({
          mensagem: `<div class="jiraya-modal-mensagem-atualizacao-versao"><span class="jiraya-titulo-versao">Nova versão disponível!</span>
          <span class="jiraya-versoes">Versão instalada: <strong>${versaoAtual}</strong>${botaoImportante}</span>
          <span class="jiraya-versoes-divider">➨</span>
          <span class="jiraya-versoes">Versão atual: <strong>${versaoRemota}</strong></span></div>
          <div class="jiraya-modal-mensagem-atualizacao">${mensagem}</div>`,
          bloquearFechar: forcarAtualizacao,
          importante: forcarAtualizacao,
          linkAtualizacao: linkAtualizacao,
          linkDocumentacao: linkDocumentacao,
        });
      }
    } else if (versaoAtual !== versaoRemota) {
      exibirModalAtualizacaoJiraya(
        mensagem,
        linkAtualizacao,
        forcarAtualizacao
      );
    }
  } catch (erro) {
    jirayaTools.ocultarLoading();
    if (mostrarModalStatus) {
      exibirModalCentralJiraya({
        titulo: "Erro ao checar atualização",
        // mensagem: `<b>Erro ao checar atualização:</b><br>${erro.message}`,
        mensagem: `<b>Erro ao checar atualização:</b><br>Tente novamente mais tarde.`,
        bloquearFechar: false,
        importante: false,
      });
    }
    console.error("Erro ao checar atualização da extensão:", erro);
  }
}

// Exibe modal padrão Jiraya (canto inferior direito para atualização)
function exibirModalCentralJiraya({
  titulo,
  mensagem,
  bloquearFechar,
  importante,
  linkAtualizacao,
  linkDocumentacao,
}) {
  bloquearFechar = false;
  $("#jiraya-modal-central").remove();
  const corTitulo = importante
    ? "var(--jiraya-cor-abaixo-minima)"
    : "var(--jiraya-cor-primaria)";
  const icone = importante ? "⚠️" : "ℹ️";
  const tituloFinal = importante
    ? "Atualização importante disponível"
    : titulo || "Jiraya Plugin";
  const html = /* html */ `
    <div class="jiraya-modal-overlay" id="jiraya-modal-central" style="position:fixed;top:auto;left:auto;right:32px;bottom:32px;width:auto;height:auto;align-items:flex-end;justify-content:flex-end;background:none;z-index:99999;">
      <div class="jiraya-modal-base jiraya-modal-customizado jiraya-modal-customizado-sm">
        <div class="jiraya-modal-header">
          <span class="jiraya-modal-titulo" style="color:${corTitulo}">${icone} ${tituloFinal}</span>
          ${
            !bloquearFechar
              ? '<button type="button" id="jiraya-modal-central-fechar" data-jiraya-id="jiraya-modal-central" class="jiraya-modal-btn-acoes-fechar jiraya-btn-outline-primario" title="Fechar" aria-label="Fechar"></button>'
              : ""
          }
        </div>
        <div class="jiraya-modal-body jiraya-modal-body-centralizado" >
          <div class="jiraya-modal-body-update">${mensagem}</div>
        </div>
        <div class="botoes-jiraya-modal">
          ${
            linkDocumentacao
              ? `<a href='${linkDocumentacao}' target='_blank' class="jiraya-btn-outline-primario">Documentação</a>`
              : ""
          }
          ${
            linkAtualizacao
              ? `<a href='${linkAtualizacao}' target='_blank' class="jiraya-btn-primario jiraya-update-link ">Atualizar agora</a>`
              : ""
          }
      </div>
      </div>
    </div>
  `;
  $("body").append(html);
  if (!bloquearFechar) {
    $(".jiraya-update-link").on("click", function () {
      $("#jiraya-modal-central").remove();
    });
  }
  jirayaTools.ocultarLoading();
}

// Atualize as chamadas dos modais para usar o padrão Jiraya
function exibirModalChecandoVersao() {
  jirayaTools.mostrarLoading("Checando versão da extensão...", {
    tooltip: true,
  });
  // exibirModalCentralJiraya({
  //   header: false,
  //   mensagem: '<span style="font-size:16px;">Checando versão da extensão...</span>',
  //   bloquearFechar: true,
  //   importante: false
  // });
}

function exibirModalAtualizacaoJiraya(mensagem, link, forcar) {
  exibirModalCentralJiraya({
    titulo: "",
    mensagem: mensagem,
    bloquearFechar: !!forcar,
    importante: !!forcar,
    linkAtualizacao: link,
  });
}

// Menu contextual inteligente (abre ao lado direito do ícone, alinhado pelo end do menu)
$(document).on("click", ".jiraya-plugin-container", function (e) {
  e.stopPropagation();
  menuDropDownCustom({
    idMenu: "jiraya-menu-contextual",
    botao: this,
    itensMenu: [
      `<div class="jiraya-menu-dropdown-custom-item jiraya-menu-info-ext" >${window.JIRAYA.APP_NOME} - ${window.JIRAYA.VERSAO}</div>`,
      `<a class="jiraya-menu-dropdown-custom-item" id="jiraya-menu-checar-atualizacao" >🔃 Buscar atualizações</a>`,
      `<a class="jiraya-menu-dropdown-custom-item" href="https://github.com/franciscol99/jiraya.github.io/tree/main" target="_blank">📄 Documentação</a>`,
      `<div class="jiraya-menu-divider"></div>`,
      `<a class="jiraya-menu-dropdown-custom-item jiraya-email-contato" data-jiraya-evento-mouse="false"><strong>Sugestões/Templates/Bugs:</strong><br> ${window.JIRAYA.EMAIL_CONTATO}</a>`,
    ],
  });
});

function menuDropDownCustom({ idMenu, botao, itensMenu }) {
  idMenu = idMenu || Math.floor(Math.random() * 1000000);
  $(".jiraya-menu-dropdown-custom").remove();

  // Calcula posição para abrir ao lado direito do ícone, alinhando o final do menu com o final do ícone
  const menuWidth = 200,
    menuHeight = 48 * itensMenu.length; // 2 itens
  const btnOffset = $(botao).offset();
  const btnHeight = $(botao).outerHeight();
  const btnWidth = $(botao).outerWidth();
  const winWidth = $(window).width();
  const winHeight = $(window).height();

  // O topo do menu será o topo do ícone + altura do ícone - altura do menu (alinha pelo final)
  let top = btnOffset.top + btnHeight - menuHeight;
  let left = btnOffset.left + btnWidth + 8; // 8px de espaçamento à direita

  // Ajusta se sair da tela
  if (left + menuWidth > winWidth) left = btnOffset.left - menuWidth - 8;
  if (left < 8) left = 8;
  if (top + menuHeight > winHeight) top = winHeight - menuHeight - 8;
  if (top < 8) top = 8;

  const menu = $(`
    <div id="${idMenu}" class="jiraya-menu-dropdown-custom" style="top:${top}px;left:${left}px;">
      ${itensMenu.join("")}
    </div>
  `);
  $("body").append(menu);

  // Fecha o menu ao clicar foraa
  $(document)
    .one("click", function () {
      $("#" + idMenu).remove();
    })
    .on("click", `#${idMenu} .jiraya-menu-dropdown-custom-item:not([data-jiraya-evento-mouse="false"])`, function () {
      $("#" + idMenu).remove();
    });
}
// Ação do menu: checar atualizações
$(document)
  .on("click", "#jiraya-menu-checar-atualizacao", function () {
    checarAtualizacaoExtensao(true, true);
  })
  .on("click", ".jiraya-email-contato", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    navigator.clipboard.writeText(window.JIRAYA.EMAIL_CONTATO);
    jirayaTools.mostrarSucesso("Contato copiado para a área de transferência!");
  })
  .on("click", ".jiraya-exportar-comentario", function () {
    exportarComentario($(this).attr("jiraya-data-comentario"));
  });

// Checa atualização apenas 1x ao dia automaticamente
checarAtualizacaoExtensao();
