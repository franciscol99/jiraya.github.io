class JirayaTools {
  constructor() {
    this.inicializado = false;
  }

  inicializar() {
    if (this.inicializado) return;

    this.inicializado = true;

    $(document)
      .on(
        "click",
        ".jiraya-modal-btn-acoes-fechar, .jiraya-modal-btn-fechar",
        function () {
          var idJiraya = $(this).data("jiraya-id");
          jirayaTools.fechar(idJiraya);
        }
      )
      .on("click", ".jiraya-modal-btn-acoes-minimizar", function () {
        var idJiraya = $(this).data("jiraya-id");
        jirayaTools.minimizar(idJiraya);
      })
      .on("click", ".jiraya-modal-btn-maximizar", function () {
        var idJiraya = $(this).data("jiraya-id");
        jirayaTools.maximizar(idJiraya);
      })
      .on("click", ".jiraya-modal-btn-acoes-fullscreen", function () {
        var idJiraya = $(this).data("jiraya-id");
        jirayaTools.fullscreen(idJiraya);
      });
  }

  jirayalog = function (msg, data) {
    if (!this.inicializado) return;

    console.log("[JIRAYA] - ", msg, data || "");
    // if (data === undefined) data = "";
    //   if (typeof msg === "object") {
    //     console.log("JIRAYA - ", msg, data);
    //   } else {
    //     console.log("JIRAYA - " + msg, data);
    //   }
  };

  injetarJQuery(callback) {
    this.inicializar();
    if (!this.inicializado) return;

    if (
      typeof window.$ === "undefined" &&
      typeof window.jQuery === "undefined"
    ) {
      const scriptElemento = document.createElement("script");
      scriptElemento.src = chrome.runtime.getURL("/js/jquery.js");
      scriptElemento.onload = function () {
        jirayalog("jQuery injetado!");
        setTimeout(() => {
          this.remove();
          if (callback) callback();
        });
      };
      (document.head || document.documentElement).appendChild(scriptElemento);
    } else {
      if (callback) callback();
    }
  }

  clickSimulado(element) {
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(clickEvent);
  }

  simularClickFora(elemento) {
    elemento.blur();

    const clickForaEvento = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: 0,
      clientY: 0,
    });
    document.body.dispatchEvent(clickForaEvento);

    const mouseUpEvento = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: 0,
      clientY: 0,
    });
    document.body.dispatchEvent(mouseUpEvento);
  }

  obterTextoSeguro(elemento, transformacao = null) {
    if (!elemento || elemento.length === 0) return "";
    const texto = elemento.text().trim();
    if (transformacao && typeof transformacao === "function") {
      try {
        return transformacao(texto);
      } catch (error) {
        jirayalog("Erro na transformação do texto:", error);
        return "";
      }
    }
    return texto;
  }

  splitSeguro(texto, separador, indice) {
    if (!texto) return "";
    const partes = texto.split(separador);
    return partes.length > indice ? partes[indice].trim() : "";
  }

  adicionarBotaoCopiar($painel) {
    const self = this;
    const $botaoCopiar = $("<button>")
      .addClass("jiraya-botao-copiar")
      .attr("type", "button")
      .attr("title", "Copiar conteúdo")
      .html(JIRAYA.textos.botaoCopiar)
      .on("mouseenter", function () {})
      .on("mouseleave", function () {})
      .on("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();

        await self.copiarConteudo($painel, $botaoCopiar);
      });

    if ($painel.css("position") === "static") {
      $painel.css("position", "relative");
    }

    $painel.attr("data-jiraya-processado", "true").append($botaoCopiar);
  }

  /**
   * Função genérica para copiar conteúdo de elementos
   * @param {jQuery|HTMLElement} elemento - Elemento do qual copiar o conteúdo
   * @param {jQuery} [$botaoFeedback] - Botão opcional para mostrar feedback visual
   * @param {Array} [classesExcluir] - Classes CSS dos elementos a excluir na cópia
   * @returns {Promise<boolean>} - True se copiou com sucesso, false caso contrário
   */
  async copiarConteudo(
    elemento,
    $botaoFeedback = null,
    classesExcluir = [".jiraya-botao-copiar"]
  ) {
    try {
      const $elemento = $(elemento);
      let texto = "";

      if ($elemento.is("textarea") || $elemento.is('input[type="text"]')) {
        texto = $elemento.val().trim();
      } else if ($elemento.is("[contenteditable]")) {
        const $copia = $elemento.clone();
        classesExcluir.forEach((classe) => $copia.find(classe).remove());
        texto = $copia.text().trim();
      } else {
        const $copia = $elemento.clone();
        classesExcluir.forEach((classe) => $copia.find(classe).remove());
        texto = $copia.text().trim();
      }

      if (!texto) {
        jirayalog("Nenhum texto encontrado para copiar");
        if ($botaoFeedback) this.mostrarFeedbackCopia($botaoFeedback, false);
        return false;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(texto);
          jirayalog(
            "Texto copiado com sucesso via Clipboard API:",
            texto.substring(0, 50) + "..."
          );
          if ($botaoFeedback) this.mostrarFeedbackCopia($botaoFeedback, true);
          return true;
        } catch (error) {
          jirayalog("Falha na Clipboard API, usando fallback:", error);
          return this.copiarTextoFallback(texto, $botaoFeedback);
        }
      } else {
        return this.copiarTextoFallback(texto, $botaoFeedback);
      }
    } catch (error) {
      jirayalog("Erro ao copiar conteúdo:", error);
      if ($botaoFeedback) this.mostrarFeedbackCopia($botaoFeedback, false);
      return false;
    }
  }

  copiarTextoFallback(texto, $botao) {
    try {
      const $temp = $("<textarea>")
        .val(texto)
        .css({
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          opacity: 0,
        })
        .appendTo("body");

      $temp[0].select();
      $temp[0].setSelectionRange(0, 99999);
      const sucesso = document.execCommand("copy");

      $temp.remove();

      if ($botao) this.mostrarFeedbackCopia($botao, sucesso);
      jirayalog("Fallback copy result:", sucesso ? "sucesso" : "falha");
      return sucesso;
    } catch (error) {
      jirayalog("Erro no fallback de cópia:", error);
      if ($botao) this.mostrarFeedbackCopia($botao, false);
      return false;
    }
  }

  /**
   * Função de conveniência para copiar texto de textareas
   * @param {jQuery|HTMLElement} textarea - Elemento textarea
   * @param {jQuery} [$botaoFeedback] - Botão opcional para feedback visual
   * @returns {Promise<boolean>}
   */
  async copiarTexto(textarea, $botaoFeedback = null) {
    const self = this;
    return await self.copiarConteudo(textarea, $botaoFeedback, []);
  }

  /**
   * Função de conveniência para copiar conteúdo HTML de elementos (excluindo botões)
   * @param {jQuery|HTMLElement} elemento - Elemento HTML
   * @param {jQuery} [$botaoFeedback] - Botão opcional para feedback visual
   * @param {Array} [classesExtrasExcluir] - Classes extras a excluir além dos botões padrão
   * @returns {Promise<boolean>}
   */
  async copiarElemento(
    elemento,
    $botaoFeedback = null,
    classesExtrasExcluir = []
  ) {
    const self = this;
    const classesExcluir = [".jiraya-botao-copiar", ...classesExtrasExcluir];
    return await self.copiarConteudo(elemento, $botaoFeedback, classesExcluir);
  }

  mostrarFeedbackCopia($botao, sucesso) {
    const textoOriginal = $botao.html();
    const corOriginal = $botao.css("backgroundColor");

    if (sucesso) {
      $botao.html(JIRAYA.textos.botaoCopiarSucesso);
    } else {
      $botao.html(JIRAYA.textos.botaoCopiarErro);
    }

    setTimeout(function () {
      $botao.html(textoOriginal);
    }, 2000);
  }

  fullscreen(idJiraya) {
    var modal = $(
      idJiraya
        ? `.jiraya-modal-customizado[data-jiraya-id='${idJiraya}']`
        : ".jiraya-modal-customizado"
    );
    var modalOverlay = $(
      idJiraya
        ? `.jiraya-modal-overlay[data-jiraya-id='${idJiraya}']`
        : ".jiraya-modal-overlay"
    );
    if (modal.length && modalOverlay.length) {
      modal.toggleClass("jiraya-modal-fullscreen");
    } else {
      modal = $("#edit-issue-dialog");
      modalOverlay = $(".aui-blanket");
      modal.toggleClass("jiraya-modal-fullscreen");
    }
  }
  btnFullscreen(idJiraya) {
    return /* html */ `<button type="button" class="jiraya-btn-outline-primario jiraya-modal-btn-acoes-fullscreen" data-jiraya-id="${idJiraya}" title="Tela Cheia" aria-label="Tela Cheia"></button>`;
  }

  fechar(idJiraya, callback) {
    $(
      idJiraya
        ? `.jiraya-modal-overlay[data-jiraya-id='${idJiraya}'], .jiraya-modal-overlay[id='${idJiraya}']`
        : ".jiraya-modal-overlay"
    ).remove();

    if (callback && typeof callback === "function") {
      setTimeout(() => {
        callback();
      }, 100);
    }
  }

  minimizar(idJiraya) {
    var modal = $(
      idJiraya
        ? `.jiraya-modal-customizado[data-jiraya-id='${idJiraya}']`
        : ".jiraya-modal-customizado"
    );
    var modalOverlay = $(
      idJiraya
        ? `.jiraya-modal-overlay[data-jiraya-id='${idJiraya}']`
        : ".jiraya-modal-overlay"
    );
    if (modal.length && modalOverlay.length) {
      modal.hide();
      modalOverlay.hide();
      if (
        !$(
          idJiraya
            ? `.jiraya-modal-btn-maximizar[data-jiraya-id='${idJiraya}']`
            : ".jiraya-modal-btn-maximizar"
        ).length
      ) {
        const titulo =
          modal.find(".jiraya-modal-titulo").first().text() || "Modal";
        const btn = $(
          `<button title="Maximizar" class="jiraya-modal-btn-maximizar" data-jiraya-id="${idJiraya}">
              <span class="jiraya-modal-titulo jiraya-modal-btn-maximizar-titulo">${titulo}</span>
            </button>`
        );
        $("body").append(btn);
      }
    }
  }

  maximizar(idJiraya) {
    var modal = $(
      idJiraya
        ? `.jiraya-modal-customizado[data-jiraya-id='${idJiraya}']`
        : ".jiraya-modal-customizado"
    );
    var modalOverlay = $(
      idJiraya
        ? `.jiraya-modal-overlay[data-jiraya-id='${idJiraya}']`
        : ".jiraya-modal-overlay"
    );
    if (idJiraya) {
      var areaTexto = $(`.wiki-edit[data-jiraya-id='${idJiraya}']`).find(
        "textarea"
      );
      if (areaTexto.length == 0) {
        alert("Área de texto não encontrada para maximizar o modal.");
        modal.remove();
        modalOverlay.remove();
        fechar(idJiraya);
        return;
      }
    }
    if (modal.length && modalOverlay.length) {
      modal.show();
      modalOverlay.show();
      $(
        idJiraya
          ? `.jiraya-modal-btn-maximizar[data-jiraya-id='${idJiraya}']`
          : ".jiraya-modal-btn-maximizar"
      ).remove();
    }
  }

  modal(opt) {
    var self = this;

    var defaults = {
      id: Math.floor(Math.random() * 1000000),
      titulo: "Modal Title",
      btnMinimizar: false,
      btnFullScreen: false,
      btnFechar: true,
      headerNavHtml: "",
      botoesBottomHtml: "",
      bodyHtml: "",
      styleModal: "",
      tamanho: "md", //sm, md, lg
      fecharClicandoFora: false,
    };
    var config = Object.assign({}, defaults, opt);

    if (config.height) {
      config.styleModal += `height: ${config.height} !important;min-height: ${config.height} !important;`;
    }
    if (config.width) {
      config.styleModal += `width: ${config.width} !important;min-width: ${config.width} !important;`;
    }
    var modalOverlay = $(
      `<div class="jiraya-modal-overlay" data-jiraya-id="${config.id}"></div>`
    );
    var btnFechar = /* html */ `
            <button type="button" class="jiraya-btn-outline-primario jiraya-modal-btn-acoes-fechar" data-jiraya-id="${config.id}" title="Fechar" aria-label="Fechar"></button>
      `;
    var btnFullScreen = /* html */ `
            
      `;
    var btnMinimizar = /* html */ `
            <button type="button" class="jiraya-btn-outline-primario jiraya-modal-btn-acoes-minimizar" data-jiraya-id="${config.id}" title="Minimizar" aria-label="Minimizar"></button>
    `;
    var modal = /* html */ `
      <div data-jiraya-id="${config.id}" style="${
      config.styleModal
    }" class="jiraya-modal-customizado jiraya-modal-base jiraya-modal-customizado-${
      config.tamanho
    }">
        <div class="jiraya-modal-header">
          <h2 class="jiraya-modal-titulo">${config.titulo}</h2>
          <div class="jiraya-modal-header-actions">
            ${config.btnMinimizar ? btnMinimizar : ""}
            ${config.btnFullScreen ? this.btnFullscreen(config.id) : ""}
            ${config.btnFechar ? btnFechar : ""}
          </div>
        </div>
        <div class="jiraya-modal-header-nav">
          ${config.headerNavHtml}
        </div>
        <div class="jiraya-modal-body">
          ${config.bodyHtml}
        </div>
        <div class="botoes-jiraya-modal">
          <button type="button" data-jiraya-id="${
            config.id
          }" class="jiraya-btn-outline-primario jiraya-modal-btn-fechar">Cancelar</button>
          ${config.botoesBottomHtml}
        </div>
      </div>
    `;

    modalOverlay.append(modal);
    $("body").append(modalOverlay);

    var self = this;
    modalOverlay.on("click", function (e) {
      if (e.target === this) {
        var idJiraya = $(this).data("jiraya-id");
        if (config.fecharClicandoFora) {
          jirayaTools.fechar(idJiraya);
        }
      }
    });

    if (config.callback && typeof config.callback === "function") {
      setTimeout(() => {
        config.callback();
      }, 100);
    }
  }

  baixarArquivo(conteudo, nomeArquivo, tipoMime) {
    let conteudoFinal = conteudo;
    if (tipoMime && tipoMime.startsWith("text/csv")) {
      conteudoFinal = "\uFEFF" + conteudo;
    }
    const blob = new Blob([conteudoFinal], {
      type: `${tipoMime};charset=utf-8;`,
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.ocultarLoading();
    jirayalog(`Arquivo baixado: ${nomeArquivo}`);
  }

  obterDataFormatada() {
    const agora = new Date();
    return agora.toISOString().split("T")[0].replace(/-/g, "");
  }

  ocultarLoading() {
    $(".jiraya-loading-modal, .jiraya-loading-overlay").remove();
  }

  mostrarLoading(mensagem = "Carregando...", options = {}) {
    // Remove loading anterior se existir
    this.ocultarLoading();

    if (options.tooltip === true) {
      // Tooltip loading no canto inferior direito, sem overlay
      const tooltipHtml = /* html */ `
        <div class="jiraya-loading-modal jiraya-loading-tooltip">
          <div style="margin: 10px;">
            <div style="
              border: 3px solid #f3f3f3;
              border-top: 3px solid #044355;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            "></div>
          </div>
          <div style="color: #044355; font-size: 15px; font-weight: bold;">${mensagem}</div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      $("body").append(tooltipHtml);
      return;
    }

    const loadingHtml = /* html */ `
      <div class="jiraya-loading-modal" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #044355;
        border-radius: 4px;
        padding: 30px;
        z-index: 10002;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 300px;
      ">
        <div style="margin-bottom: 20px;">
          <div style="
            border: 3px solid #f3f3f3;
            border-top: 3px solid #044355;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          "></div>
        </div>
        <div style="color: #044355; font-size: 16px; font-weight: bold;">${mensagem}</div>
      </div>
      <div class="jiraya-loading-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
      "></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    $("body").append(loadingHtml);
  }

  ehIssue() {
    try {
      var p = (window.location && window.location.pathname) || "";
      if (!p) return false;
      if (typeof p.startsWith === "function") return p.startsWith("/browse/");
      return p.indexOf("/browse/") === 0;
    } catch (e) {
      return false;
    }
  }

    mostrarSucesso(mensagem) {
    const sucessoHtml = /* html */ `
      <div class="jiraya-sucesso-toast" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10003;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="font-size: 18px;">✅</span>
        <span>${mensagem}</span>
      </div>
    `;

    $("body").append(sucessoHtml);

    // Auto remover após 3 segundos
    setTimeout(() => {
      $(".jiraya-sucesso-toast").fadeOut(300, function () {
        $(this).remove();
      });
    }, 3000);
  }
}

const jirayaTools = new JirayaTools();

window.jirayalog = (msg, data) => {
  if (!jirayaTools.inicializado) {
    console.log(
      "[JIRAYA] - JirayaTools não está inicializado",
      msg,
      data || ""
    );
    return null;
  }
  return jirayaTools.jirayalog(msg, data);
};

window.splitSeguro = (texto, separador, indice) => {
  if (!jirayaTools.inicializado) {
    return null;
  }
  return jirayaTools.splitSeguro(texto, separador, indice);
};

window.obterTextoSeguro = (elemento, transformacao = null) => {
  if (!jirayaTools.inicializado) {
    return null;
  }
  return jirayaTools.obterTextoSeguro(elemento, transformacao);
};

window.clickSimulado = (elemento) => {
  if (!jirayaTools.inicializado) {
    return null;
  }
  return jirayaTools.clickSimulado(elemento);
};

window.simularClickFora = (elemento) => {
  if (!jirayaTools.inicializado) {
    return null;
  }
  return jirayaTools.simularClickFora(elemento);
};
