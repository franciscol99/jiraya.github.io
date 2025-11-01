class JirayaModeloUtil {
  constructor() {
    this.inicializado = false;
  }

  inicializar() {
    if (this.inicializado) return;
    this.inicializado = true;
    jirayalog("Módulo inicializado!");
  }

  inserirTemplateTextarea(template, areaTexto) {
    if (areaTexto.length == 0) {
      jirayalog("inserirTemplate: areaTexto inválido", areaTexto);
      return;
    }

    const elementoAreaTexto = areaTexto[0];

    // Pega a posição atual do cursor
    const inicio = elementoAreaTexto.selectionStart || 0;
    const fim = elementoAreaTexto.selectionEnd || 0;

    // Inserir template na posição do cursor
    const valorAtual = elementoAreaTexto.value;
    const novoValor =
      valorAtual.substring(0, inicio) + template + valorAtual.substring(fim);
    elementoAreaTexto.value = novoValor;
    areaTexto.trigger("input");

    // Posicionar cursor após o template inserido
    const novaPosicaoCursor = inicio + template.length;
    elementoAreaTexto.setSelectionRange(novaPosicaoCursor, novaPosicaoCursor);
    elementoAreaTexto.focus();
    areaTexto.attr("rows", 20);
  }

  /**
   * Insere template em editor RTE (Rich Text Editor) do Jira
   * Alterna para modo TEXTO, insere o template, e volta para modo VISUAL
   * @param {string} template - Conteúdo do template a ser inserido
   * @param {string} idJiraya - ID único do editor
   */
  inserirTemplate(template, idJiraya) {
    const areaTexto = $(`.wiki-edit[data-jiraya-id='${idJiraya}']`).find(
      "textarea"
    );
    const containerRte = $(`.wiki-edit[data-jiraya-id='${idJiraya}']`).find(
      ".rte-container"
    );
    const caixaModos = $(`.wiki-edit[data-jiraya-id='${idJiraya}']`)
      .parent()
      .find(".aui-navgroup-inner");

    if (areaTexto.length == 0) {
      jirayalog("inserirTemplate: areaTexto inválido", areaTexto);
      return;
    }

    caixaModos.hide();
    areaTexto.css("visibility", "hidden");
    containerRte.css("visibility", "hidden");
    const modoTexto = caixaModos.find("li[data-mode='source'] button");
    if (modoTexto) modoTexto.trigger("click");

    setTimeout(() => {
      const elementoAreaTexto = areaTexto[0];

      // Pega a posição atual do cursor
      const inicio = elementoAreaTexto.selectionStart || 0;
      const fim = elementoAreaTexto.selectionEnd || 0;

      // Inserir template na posição do cursor
      const valorAtual = elementoAreaTexto.value;
      const novoValor =
        valorAtual.substring(0, inicio) + template + valorAtual.substring(fim);
      elementoAreaTexto.value = novoValor;
      areaTexto.trigger("input");

      // Posicionar cursor após o template inserido
      const novaPosicaoCursor = inicio + template.length;
      elementoAreaTexto.setSelectionRange(novaPosicaoCursor, novaPosicaoCursor);

      const modoVisual = caixaModos.find("li[data-mode='wysiwyg'] button");
      if (modoVisual) modoVisual.trigger("click");

      setTimeout(() => {
        if ($(JIRAYA_ELEMENTOS.modalEditarComentario).length == 0) {
          $(JIRAYA_ELEMENTOS.barraAcoesComentario)
            .find("input[value='Adicionar']")
            .removeAttr("disabled");
        }
        areaTexto.css("visibility", "visible");
        containerRte.css("visibility", "visible");
        caixaModos.show();
        // Não dar foco para evitar salvamento automático
        // elementoAreaTexto.focus();
      });
    });
  }

  /**
   * Insere template sem alternar para modo visual (permanece no modo TEXTO)
   * @param {string} template - Conteúdo do template a ser inserido
   * @param {string} idJiraya - ID único do editor
   */
  inserirTemplateSemModoVisual(template, idJiraya) {
    const areaTexto = $(`.wiki-edit[data-jiraya-id='${idJiraya}']`).find(
      "textarea"
    );
    const containerRte = $(`.wiki-edit[data-jiraya-id='${idJiraya}']`).find(
      ".rte-container"
    );
    const caixaModos = $(`.wiki-edit[data-jiraya-id='${idJiraya}']`)
      .parent()
      .find(".aui-navgroup-inner");

    if (areaTexto.length == 0) {
      jirayalog("inserirTemplate: areaTexto inválido", areaTexto);
      return;
    }

    caixaModos.hide();
    areaTexto.css("visibility", "hidden");
    containerRte.css("visibility", "hidden");
    const modoTexto = caixaModos.find("li[data-mode='source'] button");
    if (modoTexto) modoTexto.trigger("click");

    setTimeout(() => {
      const elementoAreaTexto = areaTexto[0];

      // Pega a posição atual do cursor
      const inicio = elementoAreaTexto.selectionStart || 0;
      const fim = elementoAreaTexto.selectionEnd || 0;

      // Inserir template na posição do cursor
      const valorAtual = elementoAreaTexto.value;
      const novoValor =
        valorAtual.substring(0, inicio) + template + valorAtual.substring(fim);
      elementoAreaTexto.value = novoValor;
      areaTexto.trigger("input");

      // Posicionar cursor após o template inserido
      const novaPosicaoCursor = inicio + template.length;
      elementoAreaTexto.setSelectionRange(novaPosicaoCursor, novaPosicaoCursor);

      // NÃO volta para modo visual - permanece no modo TEXTO
      areaTexto.css("visibility", "visible");
      containerRte.css("visibility", "visible");
      caixaModos.show();
      elementoAreaTexto.focus();
    });
  }

  /**
   * Insere template no final da textarea (comportamento legado)
   * @param {string} template - Conteúdo do template a ser inserido
   * @param {jQuery} areaTexto - Elemento jQuery da textarea
   */
  inserirTemplateNoFinal(template, areaTexto) {
    const elementoAreaTexto = areaTexto[0];
    const valorAtual = elementoAreaTexto.value;
    elementoAreaTexto.value = valorAtual + template;
    areaTexto.trigger("input");
    elementoAreaTexto.focus();
    areaTexto.attr("rows", 20);
  }

  /**
   * Utilitário para ajustar o número de linhas da textarea baseado no conteúdo
   * @param {jQuery} areaTexto - Elemento jQuery da textarea
   * @param {number} linhasMinimas - Número mínimo de linhas (padrão: 10)
   * @param {number} linhasMaximas - Número máximo de linhas (padrão: 30)
   */
  ajustarLinhasTextarea(areaTexto, linhasMinimas = 10, linhasMaximas = 30) {
    if (!areaTexto || !areaTexto.length) {
      jirayalog("ajustarLinhasTextarea: areaTexto inválida", areaTexto);
      return;
    }

    const elementoAreaTexto = areaTexto[0];
    if (!elementoAreaTexto || typeof elementoAreaTexto.value !== "string") {
      jirayalog("ajustarLinhasTextarea: elemento inválido", elementoAreaTexto);
      return;
    }

    let linhas = elementoAreaTexto.value.split("\n").length;
    if (linhas < linhasMinimas) linhas = linhasMinimas;
    areaTexto.attr(
      "rows",
      Math.max(linhasMinimas, Math.min(linhas, linhasMaximas))
    );
  }

  /**
   * Configura auto-resize da textarea conforme o conteúdo
   * @param {jQuery} areaTexto - Elemento jQuery da textarea
   * @param {number} linhasMinimas - Número mínimo de linhas (padrão: 10)
   * @param {number} linhasMaximas - Número máximo de linhas (padrão: 30)
   */
  configurarRedimensionamentoAutomatico(
    areaTexto,
    linhasMinimas = 10,
    linhasMaximas = 30
  ) {
    const autoreferencia = this;
    areaTexto.on("input", function () {
      autoreferencia.ajustarLinhasTextarea(
        $(this),
        linhasMinimas,
        linhasMaximas
      );
    });
    // Aplica o ajuste inicial
    autoreferencia.ajustarLinhasTextarea(
      areaTexto,
      linhasMinimas,
      linhasMaximas
    );
  }

  /**
   * Cria ação para inserção de template (usado em menus e botões)
   * @param {string} chaveModelo - Chave do modelo no motor de templates
   * @param {string} tipoInsercao - Tipo: 'textarea', 'rte', 'rte-sem-visual'
   * @param {string|jQuery} alvo - ID do Jiraya ou elemento jQuery da textarea
   * @returns {Function} Função de ação para ser usada em menus/botões
   */
  criarAcaoInsercao(chaveModelo, tipoInsercao, alvo) {
    const autoreferencia = this;
    return async function () {
      try {
        const conteudo = await jirayaMotorModelos.processarModelo(chaveModelo);

        switch (tipoInsercao) {
          case "textarea":
            autoreferencia.inserirTemplateTextarea(conteudo, alvo);
            break;
          case "rte":
            autoreferencia.inserirTemplate(conteudo, alvo);
            break;
          case "rte-sem-visual":
            autoreferencia.inserirTemplateSemModoVisual(conteudo, alvo);
            break;
          case "final":
            autoreferencia.inserirTemplateNoFinal(conteudo, alvo);
            break;
          default:
            // Padrão é RTE completo
            autoreferencia.inserirTemplate(conteudo, alvo);
        }
      } catch (erro) {
        jirayalog("Erro ao processar modelo:", erro);
      }
    };
  }

  /**
   * Métodos de conveniência para diferentes tipos de inserção
   */

  // Para usar em modais/textareas simples
  inserirNaAreaTexto(chaveModelo, areaTexto) {
    return this.criarAcaoInsercao(chaveModelo, "textarea", areaTexto)();
  }

  // Para usar em comentários/RTE com retorno ao visual
  inserirNoEditorRte(chaveModelo, idJiraya) {
    return this.criarAcaoInsercao(chaveModelo, "rte", idJiraya)();
  }

  // Para usar em RTE mas permanecendo no modo texto
  inserirNoEditorRteTexto(chaveModelo, idJiraya) {
    return this.criarAcaoInsercao(chaveModelo, "rte-sem-visual", idJiraya)();
  }
}

const jirayaModeloUtil = new JirayaModeloUtil();
