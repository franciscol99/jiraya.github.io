class JirayaFolhaDeHoras {
  constructor() {
    this.inicializado = false;
    this.aplicacao = null;
    this.debounceTimeout = null; // Para otimização de performance dos observadores
    this.pinturaTimeout = null; // Para otimização da pintura das células
    this.pinturaContainerTimeout = null; // Para pintura específica por mudanças no tempo-report-container
    this.configuracoes = {
      horaMinimaDiaria: 5.5,
      horaMaximaDiaria: 8,
      horaMediaDiaria: 6.5,
      pintarTabelaPorMedia: true,
    };
  }

  inicializar() {
    if (this.inicializado) return;

    this.aplicacao = document.getElementById("tt-project-timesheet-app");
    if (!this.aplicacao) {
      jirayalog("Elemento #tt-project-timesheet-app não encontrado");
      return;
    }

    jirayalog("Inicializando módulo Jiraya FolhaDeHoras");

    this.carregarConfiguracoes();
    this.configurarObservadores();
    this.injetarFuncionalidades();
    this.inicializado = true;

    jirayalog("Módulo folhadehoras inicializado com sucesso");
  }

  /**
   * Configura observadores internos do folhadehoras de forma otimizada
   */
  ELEMENTOS_FOLHADEHORAS = {
    tabela: "table",
    linha: ".time-entry, .folhadehoras-row",
    formulario: "form, .time-form",
    celula: '[data-testid*="grid-cell"], .fixedDataTableCell_cellContent',
  };
  configurarObservadores() {
    // Observador principal para mudanças gerais no folhadehoras
    const observadorPrincipal = new MutationObserver((mutacoes) => {
      let temMudancasRelevantes = false;

      mutacoes.forEach((mutacao) => {
        if (mutacao.type === "childList" && mutacao.addedNodes.length > 0) {
          mutacao.addedNodes.forEach((no) => {
            if (no.nodeType === Node.ELEMENT_NODE) {
              const $no = $(no);

              Object.keys(this.ELEMENTOS_FOLHADEHORAS).forEach((key) => {
                if (
                  $no.is(this.ELEMENTOS_FOLHADEHORAS[key]) ||
                  $no.find(this.ELEMENTOS_FOLHADEHORAS[key]).length > 0 ||
                  $no.closest(this.ELEMENTOS_FOLHADEHORAS[key]).length > 0 ||
                  $no.parents(this.ELEMENTOS_FOLHADEHORAS[key]).length > 0
                ) {
                  temMudancasRelevantes = true;
                }
              });
            }
          });
        }
      });

      // Só processar se houver mudanças relevantes
      if (temMudancasRelevantes) {
        // Debounce para evitar execuções excessivas
        if (this.debounceTimeout) {
          clearTimeout(this.debounceTimeout);
        }

        this.debounceTimeout = setTimeout(() => {
          jirayalog("Processando mudanças relevantes no folhadehoras");

          mutacoes.forEach((mutacao) => {
            if (mutacao.type === "childList") {
              mutacao.addedNodes.forEach((no) => {
                if (no.nodeType === Node.ELEMENT_NODE) {
                  this.processarNovosElementos($(no));
                }
              });
            }
          });
        }, 500);
      }
    });

    observadorPrincipal.observe(this.aplicacao, {
      childList: true,
      subtree: true,
    });

    // Configurar observador específico para tempo-report-container
    this.configurarObservadorTempoReport();

    jirayalog(
      "Observadores do folhadehoras configurados (principal + tempo-report-container)"
    );
  }

  /**
   * Configura observador específico para mudanças no tempo-report-container
   */
  configurarObservadorTempoReport() {
    // Função para configurar observador no container quando ele aparecer
    const configurarObservadorContainer = () => {
      const $container = $(".tempo-report-container");

      if ($container.length > 0 && !$container.attr("data-jiraya-observando")) {
        jirayalog(
          `Configurando observador para tempo-report-container (${$container.length} encontrados)`
        );

        $container.each((index, containerElement) => {
          const $elem = $(containerElement);
          $elem.attr("data-jiraya-observando", "true");

          const observadorContainer = new MutationObserver((mutacoes) => {
            let devePintar = false;

            mutacoes.forEach((mutacao) => {
              // Verificar mudanças em filhos (novos dados de colaboradores)
              if (
                mutacao.type === "childList" &&
                (mutacao.addedNodes.length > 0 ||
                  mutacao.removedNodes.length > 0)
              ) {
                devePintar = true;
                jirayalog(
                  "Mudança de conteúdo detectada no tempo-report-container (childList)"
                );
              }

              // Verificar mudanças de texto/conteúdo
              if (mutacao.type === "characterData") {
                devePintar = true;
                jirayalog(
                  "Mudança de texto detectada no tempo-report-container (characterData)"
                );
              }

              // Verificar mudanças de atributos relevantes (como dados de colaboradores)
              if (
                mutacao.type === "attributes" &&
                (mutacao.attributeName === "data-user-id" ||
                  mutacao.attributeName === "data-hours" ||
                  mutacao.attributeName === "class" ||
                  mutacao.attributeName.startsWith("data-"))
              ) {
                devePintar = true;
                jirayalog(
                  `Mudança de atributo detectada no tempo-report-container: ${mutacao.attributeName}`
                );
              }
            });

            if (devePintar && this.configuracoes.pintarTabelaPorMedia) {
              // Debounce específico para pintura por mudanças no container
              if (this.pinturaContainerTimeout) {
                clearTimeout(this.pinturaContainerTimeout);
              }

              this.pinturaContainerTimeout = setTimeout(() => {
                jirayalog(
                  "🎨 EXECUTANDO PINTURA: Mudanças detectadas no tempo-report-container"
                );
                // jirayalog(
                //   `📊 Total de células a serem pintadas: ${
                //     $(this.aplicacao).find(
                //       ".public_fixedDataTableCell_cellContent"
                //     ).length
                //   }`
                // );

                const inicio = performance.now();
                this.pintarCelulasTabela();
                const fim = performance.now();

                jirayalog(
                  `⚡ Pintura concluída em ${(fim - inicio).toFixed(2)}ms`
                );
              }, 0); // Debounce mais rápido para mudanças no container de dados
            }
          });

          // Observar mudanças no container específico
          observadorContainer.observe(containerElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: [
              "data-user-id",
              "data-hours",
              "data-time",
              "class",
            ], // Atributos relevantes
          });

          jirayalog(
            `Observador ativo para tempo-report-container #${index + 1}`
          );
        });
      }
    };

    // Configurar imediatamente se já existe
    configurarObservadorContainer();

    // Observador para detectar quando tempo-report-container aparece
    const observadorDeteccao = new MutationObserver((mutacoes) => {
      mutacoes.forEach((mutacao) => {
        if (mutacao.type === "childList" && mutacao.addedNodes.length > 0) {
          mutacao.addedNodes.forEach((no) => {
            if (no.nodeType === Node.ELEMENT_NODE) {
              const $no = $(no);

              if (
                $no.hasClass("tempo-report-container") ||
                $no.find(".tempo-report-container").length > 0
              ) {
                jirayalog(
                  "Novo tempo-report-container detectado, configurando observador"
                );
                setTimeout(configurarObservadorContainer, 100); // Pequeno delay para garantir que o elemento esteja totalmente renderizado
              }
            }
          });
        }
      });
    });

    // Observar mudanças no documento para detectar novos containers
    observadorDeteccao.observe(document.body, {
      childList: true,
      subtree: true,
    });

    jirayalog("Sistema de observação do tempo-report-container configurado");
  }

  /**
   * Injeta funcionalidades específicas do folhadehoras
   */
  injetarFuncionalidades() {
    jirayalog("Injetando funcionalidades do folhadehoras");

    // Múltiplas estratégias para detectar a barra de ferramentas
    this.configurarObservadoresFolhaDeHoras();
    this.aplicarPinturaTabela();
  }

  /**
   * Configura múltiplos observadores para garantir que as ferramentas sejam injetadas
   */
  configurarObservadoresFolhaDeHoras() {
    // Estratégia 1: Observar seletor específico
    this.observarElementoFolhaDeHoras({
      seletor: ".sc-afnQL.lbYoTT",
      callback: (elemento) => {
        jirayalog("Estratégia 1: Elemento .sc-afnQL.lbYoTT detectado");
        this.adicionarFerramentasFolhaDeHoras();
      },
      nome: "Barra Ferramentas (seletor específico)",
      aguardarVisibilidade: false,
    });

    // Estratégia 2: Observar container do folhadehoras
    this.observarElementoFolhaDeHoras({
      seletor: "#tt-project-timesheet-app",
      callback: (elemento) => {
        jirayalog(
          "Estratégia 2: Container folhadehoras detectado, aguardando ferramentas..."
        );
        setTimeout(() => {
          if ($(".jiraya-folhadehoras-toolbar").length === 0) {
            jirayalog("Ferramentas não encontradas, adicionando...");
            this.adicionarFerramentasFolhaDeHoras();
          }
        }, 500);
      },
      nome: "Container FolhaDeHoras",
      aguardarVisibilidade: true,
    });

    // Estratégia 3: Observar qualquer mudança no DOM dentro do folhadehoras
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const $node = $(node);
              // Verifica se é um elemento relevante do folhadehoras
              if (
                $node.hasClass("sc-afnQL") ||
                $node.hasClass("lbYoTT") ||
                $node.find(".sc-afnQL.lbYoTT").length > 0 ||
                $node.closest("#tt-project-timesheet-app").length > 0
              ) {
                shouldCheck = true;
              }
            }
          });
        }
      });

      if (shouldCheck) {
        setTimeout(() => {
          if (
            $(".jiraya-folhadehoras-toolbar").length === 0 &&
            $(".sc-afnQL.lbYoTT").length > 0
          ) {
            jirayalog(
              "Estratégia 3: Mutation Observer detectou mudanças, adicionando ferramentas..."
            );
            this.adicionarFerramentasFolhaDeHoras();
          }
        }, 200);
      }
    });

    // Observa mudanças no container do folhadehoras
    const folhadehorasContainer = document.getElementById(
      "tt-project-timesheet-app"
    );
    if (folhadehorasContainer) {
      observer.observe(folhadehorasContainer, {
        childList: true,
        subtree: true,
      });
    }

    // Sistema baseado apenas em observadores - sem verificações periódicas
    jirayalog(
      "Configuração de observadores finalizada - sistema otimizado sem intervalos"
    );
  }

  /**
   * Processa novos elementos adicionados ao folhadehoras de forma otimizada
   */
  processarNovosElementos($elemento) {
    let processouAlgo = false;

    // Processa tabelas de tempo apenas se não foram processadas antes
    const $tabelasNaoProcessadas = $elemento
      .find("table, .time-entry, .folhadehoras-row")
      .not(".jiraya-melhorado");
    if ($tabelasNaoProcessadas.length > 0) {
      jirayalog(
        `Processando ${$tabelasNaoProcessadas.length} tabelas/entradas de tempo`
      );
      $tabelasNaoProcessadas.each((indice, el) => {
        this.melhorarEntradaTempo($(el));
      });
      processouAlgo = true;
    }

    // Processa formulários de entrada apenas se não foram processados antes
    const $formulariosNaoProcessados = $elemento
      .find("form, .time-form")
      .not(".jiraya-melhorado");
    if ($formulariosNaoProcessados.length > 0) {
      jirayalog(
        `Processando ${$formulariosNaoProcessados.length} formulários de tempo`
      );
      $formulariosNaoProcessados.each((indice, el) => {
        this.melhorarFormularioTempo($(el));
      });
      processouAlgo = true;
    }

    // Verificar se há elementos tempo-report-container que precisam ser processados
    const $containerRelatorio = $elemento.is(".tempo-report-container")
      ? $elemento
      : $elemento.find(".tempo-report-container");
    if (
      $containerRelatorio.length > 0 &&
      !$containerRelatorio.hasClass("jiraya-tempo-processado")
    ) {
      jirayalog("Processando tempo-report-container específico");
      $containerRelatorio.addClass("jiraya-tempo-processado");

      // Processar dados dos colaboradores se a função estiver disponível
      if (typeof this.processarDadosColaboradores === "function") {
        this.processarDadosColaboradores($containerRelatorio);
      }
      processouAlgo = true;
    }

    // A pintura da tabela agora é controlada especificamente pelo observador do tempo-report-container
    if (processouAlgo) {
      jirayalog(
        `Elementos processados no folhadehoras. Pintura será executada apenas por mudanças no tempo-report-container`
      );
    }
  }

  /**
   * Adiciona ferramentas específicas do folhadehoras
   */
  adicionarFerramentasFolhaDeHoras() {
    // Previne duplicação
    if ($(".jiraya-folhadehoras-toolbar").length > 0) {
      jirayalog("Ferramentas do folhadehoras já foram adicionadas, pulando...");
      return;
    }

    // Verifica se o elemento alvo existe
    const $elementoAlvo = $(".sc-afnQL.lbYoTT");
    if ($elementoAlvo.length === 0) {
      jirayalog("Elemento alvo não encontrado para adicionar ferramentas");
      return;
    }

    jirayalog(
      "Adicionando ferramentas do folhadehoras ao elemento:",
      $elementoAlvo
    );
    jirayalog("Estado atual do DOM:");
    jirayalog(
      "- Elementos .sc-afnQL.lbYoTT encontrados:",
      $(".sc-afnQL.lbYoTT").length
    );
    jirayalog(
      "- Container #tt-project-timesheet-app existe:",
      $("#tt-project-timesheet-app").length > 0
    );
    jirayalog("- Barras existentes:", $(".jiraya-folhadehoras-toolbar").length);

    // Exemplo: Adicionar botões de ação rápida
    const $barraFerramentas = $("<div>")
      .addClass("jiraya-folhadehoras-toolbar")
      .css({
        // position: 'fixed',
        // top: '10px',
        // right: '10px',
        // zIndex: '10000',
        // background: '#fff',
        // padding: '8px',
        // borderRadius: '4px',
        // boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        // border: '1px solid #ddd'
      });

    // Criar dropdown Jiraya Tools
    const opcoes = [
      "Exportar",
      "Validar entradas",
      "Visualizar dados",
      "Resumo do período",
      "Configurações",
    ];

    const $dropdownContainer = $("<div>").css({
      position: "relative",
      display: "inline-block",
    });

    const $botaoRapido = $("<a>")
      .addClass("aui-dropdown2-trigger cyAOiZ")
      .append(
        $("<span>")
          .addClass("sc-ksZaOG fdwzFg")
          .append($("<span>").addClass("sc-ksZaOG fdwzFg").html("Jiraya"))
      )
      // .css({
      //   paddingRight: '8px',
      //   cursor: 'pointer'
      // })
      .on("click", (e) => {
        e.stopPropagation();
        const $dropdown = $dropdownContainer.find(".jiraya-dropdown");
        if ($dropdown.is(":visible")) {
          $dropdown.hide();
        } else {
          $(".jiraya-dropdown").hide(); // Fechar outros dropdowns
          $dropdown.show();
        }
      });

    const $dropdown = $("<div>").addClass("jiraya-dropdown").css({
      position: "absolute",
      top: "100%",
      left: "0",
      backgroundColor: "white",
      border: "1px solid #ccc",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: "10002",
      minWidth: "200px",
      display: "none",
    });

    const iconesOpcoes = {
      Exportar: "📊",
      "Validar entradas": "✅",
      "Visualizar dados": "👁️",
      "Resumo do período": "📈",
      Configurações: "⚙️",
    };

    opcoes.forEach((opcao) => {
      const icone = iconesOpcoes[opcao] || "•";
      const $item = $("<div>")
        .html(`<span style="margin-right: 8px;">${icone}</span>${opcao}`)
        .css({
          padding: "12px 15px",
          cursor: "pointer",
          borderBottom: "1px solid #f0f0f0",
          fontSize: "14px",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
        })
        .hover(
          function () {
            $(this).css({
              backgroundColor: "#f5f5f5",
              // paddingLeft: "18px",
            });
          },
          function () {
            $(this).css({
              backgroundColor: "white",
              // paddingLeft: "15px",
            });
          }
        )
        .on("click", (e) => {
          e.stopPropagation();
          $dropdown.hide();
          this.manipularOpcaoMenu(opcao);
        });

      $dropdown.append($item);
    });

    // Remover última border
    $dropdown.find("div:last-child").css("border-bottom", "none");

    $dropdownContainer.append($botaoRapido, $dropdown);

    const $botaoPintura = $("<button>")
      .addClass("aui-button aui-button-subtle jiraya-botao-pintura")
      .html(this.configuracoes.pintarTabelaPorMedia ? "🎨" : "⬜")
      .attr("title", "Pintura da tabela")
      .attr("id", "jiraya-pintura-tabela")
      .on("click", () => {
        this.alternarPinturaTabela();
      });

    $barraFerramentas.append($dropdownContainer, $botaoPintura);

    // Anexa de forma mais robusta
    const $alvoAnexar = $(".sc-afnQL.lbYoTT").first();
    if ($alvoAnexar.length > 0) {
      $alvoAnexar.after($barraFerramentas);
      jirayalog("Barra de ferramentas anexada com sucesso após:", $alvoAnexar);
    } else {
      // Fallback: anexar ao container do folhadehoras
      const $container = $("#tt-project-timesheet-app");
      if ($container.length > 0) {
        $container.prepend($barraFerramentas);
        jirayalog("Barra de ferramentas anexada ao container como fallback");
      } else {
        jirayalog(
          "ERRO: Não foi possível anexar barra de ferramentas - nenhum container encontrado"
        );
        return;
      }
    }

    // Fechar dropdown ao clicar fora
    $(document).on("click.jirayaDropdown", (e) => {
      if (
        !$(e.target).closest(".jiraya-dropdown, .aui-button-primary").length
      ) {
        $(".jiraya-dropdown").hide();
      }
    });
  }

  /**
   * Melhora entradas de tempo individuais
   */
  melhorarEntradaTempo($entrada) {
    if ($entrada.hasClass("jiraya-melhorado")) return;

    $entrada.addClass("jiraya-melhorado jiraya-folhadehoras-melhorado");

    // Adicionar botão de copiar se for entrada de tempo
    if ($entrada.find('input[type="text"], textarea').length > 0) {
      const $botaoCopiar = $("<button>")
        .addClass("jiraya-copiar-tempo aui-button aui-button-subtle")
        .html("📋")
        .attr("title", "Copiar informações")
        .on("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const infoTempo = this.extrairInfoTempo($entrada);
          if (window.copiarConteudo) {
            // Usar a função de cópia do sistema principal se disponível
            const $temp = $("<div>").text(infoTempo);
            await window.copiarConteudo($temp, $(e.target));
          } else {
            // Fallback simples
            navigator.clipboard.writeText(infoTempo);
          }
        });

      $entrada.css("position", "relative").append($botaoCopiar);
    }
  }

  /**
   * Melhora formulários de tempo
   */
  melhorarFormularioTempo($formulario) {
    if ($formulario.hasClass("jiraya-melhorado")) return;

    $formulario.addClass("jiraya-melhorado");

    // Adicionar validações ou melhorias nos formulários
    jirayalog("Formulário de tempo melhorado:", $formulario);
  }

  /**
   * Extrai informações de uma entrada de tempo
   */
  extrairInfoTempo($entrada) {
    let informacoes = [];

    // Tentar extrair diferentes tipos de informação
    const valorTempo =
      $entrada.find('input[type="text"]').val() ||
      $entrada.find(".time-value").text();
    const descricao =
      $entrada.find("textarea").val() || $entrada.find(".description").text();
    const issue =
      $entrada.find(".issue-key").text() ||
      $entrada.find("[data-issue-key]").attr("data-issue-key");

    if (valorTempo) informacoes.push(`Tempo: ${valorTempo.trim()}`);
    if (issue) informacoes.push(`Issue: ${issue.trim()}`);
    if (descricao) informacoes.push(`Descrição: ${descricao.trim()}`);

    return informacoes.join("\n") || "Nenhuma informação encontrada";
  }

  /**
   * Mostra menu de opções do folhadehoras
   */
  mostrarMenuFolhaDeHoras() {
    // Implementar menu de opções
    jirayalog("Abrindo menu do folhadehoras");

    // Exemplo de menu simples
    const opcoes = [
      "Exportar",
      "Validar entradas",
      "Visualizar dados",
      "Resumo do período",
      "Configurações",
    ];

    // Função para padronizar texto: só a primeira letra maiúscula
    const padronizarTexto = (txt) =>
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();

    const opcoesHtml = opcoes
      .map(
        (opcao) =>
          `<li><a href="#" onclick="jirayaFolhaDeHoras.manipularOpcaoMenu('${padronizarTexto(
            opcao
          )}')">${padronizarTexto(opcao)}</a></li>`
      )
      .join("");

    const $menu = $(`
      <div class="jiraya-folhadehoras-menu" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #044355;
        border-radius: 8px;
        padding: 25px;
        z-index: 10001;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        min-width: 300px;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Fira Sans', 'Helvetica Neue', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
        font-size: 14px;
        line-height: 20px;
        color: rgb(0, 27, 60);
      ">
        <h3 style="color: #044355; margin-bottom: 20px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 22px; min-height: 22px; border-bottom: 2px solid #044355; padding-bottom: 10px;">Jiraya folhadehoras tools</h3>
        <ul style="list-style: none; padding: 0; margin: 15px 0;">
          ${opcoesHtml}
        </ul>
        <button onclick="jirayaFolhaDeHoras.fecharModal('.jiraya-folhadehoras-menu', '.jiraya-overlay')" 
                style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer; color: #666; padding: 5px; line-height: 1;">×</button>
      </div>
      <div class="jiraya-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
      "></div>
    `);

    $("body").append($menu);

    // Fechar ao clicar no overlay
    $(".jiraya-overlay").on("click", () => {
      this.fecharModal(".jiraya-folhadehoras-menu", ".jiraya-overlay");
    });
  }

  /**
   * Manipula opções do menu
   */
  manipularOpcaoMenu(opcao) {
    jirayalog("Opção selecionada:", opcao);
    switch (opcao) {
      case "Visualizar dados":
        this.visualizarDados();
        break;
      case "Exportar":
        this.exportarFolhaDeHoras();
        break;
      case "Validar entradas":
        this.validarEntradas();
        break;
      case "Resumo do período":
        this.mostrarResumoPeriodo();
        break;
      case "Configurações":
        this.mostrarConfiguracoes();
        break;
    }
  }

  /**
   * Visualiza dados extraídos em uma janela modal
   */
  visualizarDados() {
    const idJiraya = Math.floor(Math.random() * 1000000);

    const dados = this.extrairDadosFolhaDeHoras();
    if (!dados) {
      alert("Erro ao extrair dados do folhadehoras");
      return;
    }

    // Criar HTML para visualização
    let html = /* html */ `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 10px 0; color: #28a745;">📅 Informações gerais</h3>
            <p><strong>Período:</strong> ${dados.periodo}</p>
            <p><strong>Total colaboradores:</strong> ${
              dados.resumoGeral.totalColaboradores
            }</p>
            <p><strong>Total de horas:</strong> ${
              dados.resumoGeral.totalGeral
            }</p>
            <p><strong>Limite máximo diário:</strong> ${
              dados.resumoGeral.horaMaximaDiaria
            }h</p>
            <p><strong>Total de horas extras (acima do limite):</strong> ${
              dados.resumoGeral.totalHorasExtrasAcimaLimite || 0
            }h</p>
            <p><strong>Dias úteis:</strong> ${
              dados.resumoGeral.diasUteisDisponiveis
            }</p>
            ${
              dados.feriados.length > 0
                ? `<p><strong>Feriados:</strong> ${dados.feriados.join(
                    ", "
                  )}</p>`
                : ""
            }
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
            <h3 style="margin: 0 0 10px 0; color: #007bff;">📈 Estatísticas</h3>
            <p><strong>Horas úteis:</strong> ${
              dados.resumoGeral.totalHorasUteis
            }</p>
            <p><strong>Horas extraordinárias:</strong> ${
              dados.resumoGeral.totalHorasExtraordinarias
            }</p>
            <p><strong>Média/Dia:</strong> ${
              dados.resumoGeral.mediaHorasPorDia
            }h</p>
            <p><strong>Média/Colaborador:</strong> ${
              dados.resumoGeral.mediaHorasPorColaborador
            }h</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #0052CC; margin-bottom: 15px;">👥 Colaboradores</h3>
          <div style="max-height: 500px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead style="background: #f4f5f7; position: sticky; top: 0;">
                <tr>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Nome</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">ID</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Total horas</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Média diária</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Horas extras</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Dias trabalhados</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Dias ausentes</th>
                </tr>
              </thead>
              <tbody>`;

    Object.values(dados.colaboradores).forEach((colaborador, index) => {
      const corLinha = index % 2 === 0 ? "#ffffff" : "#f9f9f9";
      html += /* html */ `
        <tr style="background: ${corLinha};">
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${
            colaborador.nome
          }</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-family: monospace;">${
            colaborador.id
          }</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold; color: #007bff;">${
            colaborador.horasTotais
          }</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold; color: ${
            colaborador.resumoMensal.mediaHorasDiarias >=
            this.configuracoes.horaMediaDiaria
              ? "#28a745"
              : colaborador.resumoMensal.mediaHorasDiarias >=
                this.configuracoes.horaMinimaDiaria
              ? "#f57c00"
              : "#dc3545"
          }">${colaborador.resumoMensal.mediaHorasDiarias}h</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; color: #f57c00; font-weight: bold;">${
            colaborador.resumoMensal.horasExtrasAcimaLimite || 0
          }h</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; color: #28a745;">${
            colaborador.resumoMensal.diasTrabalhados
          }</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; color: ${
            colaborador.resumoMensal.diasAusentes > 0 ? "#dc3545" : "#6c757d"
          }">${colaborador.resumoMensal.diasAusentes}</td>
        </tr>`;
    });

    html += /* html */ `
              </tbody>
            </table>
          </div>
        </div>
    `;

    var botoes = /* html */ `
       <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportardados" data-jiraya-modo="json" data-jiraya-id="${idJiraya}" >
          💾 Baixar JSON
        </button>
        <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportardados" data-jiraya-modo="csv" data-jiraya-id="${idJiraya}" >
          📊 Baixar CSV
        </button>
        <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportardados" data-jiraya-modo="resumo" data-jiraya-id="${idJiraya}">
          📄 Baixar resumo
        </button>
        <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportardados" data-jiraya-modo="console" data-jiraya-id="${idJiraya}">
          🔍 Ver no console (dev)
        </button>
    `;

    jirayaTools.modal({
      id: idJiraya,
      btnFechar: true,
      btnFullScreen: true,
      titulo: "📊 Dados da folha de horas",
      bodyHtml: html,
      botoesBottomHtml: botoes,
      callback: () => {
        setTimeout(() => {
          $(document).on(
            "click",
            ".jiraya-folhadehoras-exportardados[data-jiraya-id='" +
              idJiraya +
              "']",
            function () {
              const modo = $(this).data("jiraya-modo");
              if (modo === "console") {
                console.log(
                  "Dados do FolhaDeHoras:",
                  jirayaFolhaDeHoras.extrairDadosFolhaDeHoras()
                );
                return;
              }
              jirayaFolhaDeHoras.exportarDadosFolhaDeHoras(modo);
            }
          );
        }, 10);
      },
    });
  }

  /**
   * Exporta dados do folhadehoras completo em formato Excel/CSV
   */
  exportarFolhaDeHoras() {
    const idJiraya = Math.floor(Math.random() * 1000000);
    jirayalog("Iniciando exportação completa do folhadehoras...");

    const dados = this.extrairDadosFolhaDeHoras();
    if (!dados) {
      this.mostrarModalErro(
        "Erro na Exportação",
        "Não foi possível extrair os dados do folhadehoras para exportação."
      );
      return;
    }

    // Criar modal de opções de exportação usando padrão do abrirModalTemplateCustomizada
    if (document.querySelectorAll(".jiraya-modal-btn-maximizar").length > 0) {
      jirayaTools.maximizar();
      return;
    }
    if (document.getElementById("overlay-exportar-folhadehoras")) {
      return;
    }
    let overlay = $(
      '<div class="jiraya-modal-overlay" id="overlay-exportar-folhadehoras"></div>'
    );

    let html = /* html */ `
    <form id="form-exportar-folhadehoras">
      <div class="jiraya-modal-grupo-campo jiraya-modal-grupo-campo-vertical">
        <label class="jiraya-modal-label-campo"><b>Escolha o formato de exportação:</b></label><br>
        <div class="jiraya-modal-opcoes-row">
          <button type="button" class="jiraya-btn-outline-primario" data-jiraya-id="${idJiraya}" id="btn-exportar-csv"><span class="jiraya-botao-icone">📊</span>Excel/CSV detalhado</button>
          <button type="button" class="jiraya-btn-outline-primario" data-jiraya-id="${idJiraya}" id="btn-exportar-resumo"><span class="jiraya-botao-icone">📄</span>Relatório executivo</button>
          <button type="button" class="jiraya-btn-outline-primario" data-jiraya-id="${idJiraya}" id="btn-exportar-json"><span class="jiraya-botao-icone">💾</span>Dados (JSON)</button>
        </div>
      </div>
    </form>
    <div style="text-align: center;">
      <small style="color: #666;">📅 Período: ${dados.periodo} | 👥 ${dados.resumoGeral.totalColaboradores} colaboradores | ⏱️ ${dados.resumoGeral.totalGeral}h totais</small>
    </div>`;

    jirayaTools.modal({
      id: idJiraya,
      btnFechar: true,
      width: "800px",
      height: "400px",
      titulo: "📤 Exportar folha de horas",
      bodyHtml: html,
    });

    $(document).on(
      "click",
      "#btn-exportar-csv[data-jiraya-id=" + idJiraya + "]",
      () => {
        jirayaTools.fechar(idJiraya);
        jirayaFolhaDeHoras.executarExportacao("csv");
      }
    );
    $(document)
      .on(
        "click",
        "#btn-exportar-resumo[data-jiraya-id=" + idJiraya + "]",
        () => {
          jirayaTools.fechar(idJiraya);
          jirayaFolhaDeHoras.executarExportacao("resumo");
        }
      )
      .on(
        "click",
        "#btn-exportar-json[data-jiraya-id=" + idJiraya + "]",
        () => {
          jirayaTools.fechar(idJiraya);
          jirayaFolhaDeHoras.executarExportacao("json");
        }
      );
  }

  /**
   * Executa a exportação no formato selecionado
   */
  executarExportacao(formato) {
    jirayalog(`Executando exportação em formato: ${formato}`);

    // Fechar modal de opções
    this.fecharModal(".jiraya-modal-exportar", ".jiraya-overlay-exportar");

    // Mostrar loading
    jirayaTools.mostrarLoading("Preparando exportação...");

    setTimeout(() => {
      try {
        const dados = this.extrairDadosFolhaDeHoras();

        switch (formato) {
          case "csv":
            this.exportarCsv(dados);
            break;
          case "resumo":
            this.exportarRelatorioExecutivo(dados);
            break;
          case "json":
            this.exportarJson(dados);
            break;
          default:
            throw new Error(`Formato de exportação desconhecido: ${formato}`);
        }

        jirayaTools.mostrarSucesso("Exportação concluída com sucesso!");
      } catch (erro) {
        jirayaTools.ocultarLoading();
        this.mostrarModalErro(
          "Erro na Exportação",
          `Erro ao exportar: ${erro.message}`
        );
        jirayalog("Erro na exportação:", erro);
      }
    }, 500);
  }

  /**
   * Exporta dados em formato Excel/CSV detalhado
   */
  exportarCsv(dados) {
    let csv = "# RELATÓRIO FOLHADEHORAS DETALHADO\n";
    csv += `# Período: ${dados.periodo}\n`;
    csv += `# Gerado em: ${new Date().toLocaleString()}\n\n`;

    // Cabeçalho principal
    csv +=
      "Colaborador,ID,Total Horas,Média Diária,Horas Extras Acima Limite,Dias Trabalhados,Dias Ausentes,Horas Úteis,Horas Extras";

    // Adicionar cabeçalhos dos dias
    dados.diasMes.forEach((dia) => {
      const status = dia.ehFeriado
        ? " (Feriado)"
        : dia.ehFimSemana
        ? " (FDS)"
        : "";
      csv += `,Dia ${dia.numero}${status}`;
    });
    csv += "\n";

    // Dados dos colaboradores
    Object.values(dados.colaboradores).forEach((colaborador) => {
      csv += `"${colaborador.nome}",${colaborador.id},${
        colaborador.horasTotais
      },${colaborador.resumoMensal.mediaHorasDiarias},${
        colaborador.resumoMensal.horasExtrasAcimaLimite || 0
      },${colaborador.resumoMensal.diasTrabalhados},${
        colaborador.resumoMensal.diasAusentes
      },${colaborador.resumoMensal.horasUteis},${
        colaborador.resumoMensal.horasExtraordinarias
      }`;

      dados.diasMes.forEach((dia) => {
        const horasDia = colaborador.horasPorDia[dia.numero];
        csv += `,${horasDia ? horasDia.horas : 0}`;
      });
      csv += "\n";
    });

    // Linha de totais
    csv += `\n"TOTAIS",,${dados.resumoGeral.totalGeral},${
      dados.resumoGeral.mediaHorasPorDia
    },${dados.resumoGeral.totalHorasExtrasAcimaLimite || 0},${
      dados.resumoGeral.diasUteisComTrabalho
    },,${dados.resumoGeral.totalHorasUteis},${
      dados.resumoGeral.totalHorasExtraordinarias
    }`;
    dados.diasMes.forEach((dia) => {
      const totalDia = dados.totaisDiarios[dia.numero];
      csv += `,${totalDia ? totalDia.totalHoras : 0}`;
    });

    // Estatísticas adicionais
    csv += "\n\n# ESTATÍSTICAS GERAIS\n";
    csv += `Total de colaboradores,${dados.resumoGeral.totalColaboradores}\n`;
    csv += `Dias úteis no Período,${dados.resumoGeral.diasUteisDisponiveis}\n`;
    csv += `Feriados Identificados,"${dados.feriados.join(", ")}"\n`;
    csv += `Média horas por colaborador,${dados.resumoGeral.mediaHorasPorColaborador}\n`;

    jirayaTools.baixarArquivo(
      csv,
      `folhadehoras_detalhado_${jirayaTools.ocultarLoading()}.csv`,
      "text/csv"
    );
  }

  /**
   * Exporta relatório executivo formatado
   */
  exportarRelatorioExecutivo(dados) {
    const stats = this.calcularEstatisticasResumo(dados);

    let relatorio = `RELATÓRIO EXECUTIVO - FOLHADEHORAS\n`;
    relatorio += `${"=".repeat(50)}\n\n`;

    relatorio += `PERÍODO: ${dados.periodo}\n`;
    relatorio += `DATA DO RELATÓRIO: ${new Date().toLocaleString()}\n\n`;

    relatorio += `RESUMO EXECUTIVO:\n`;
    relatorio += `${"-".repeat(20)}\n`;
    relatorio += `• Total de colaboradores: ${dados.resumoGeral.totalColaboradores}\n`;
    relatorio += `• Total de horas trabalhadas: ${dados.resumoGeral.totalGeral}h\n`;
    relatorio += `• Média por dia útil: ${dados.resumoGeral.mediaHorasPorDia}h\n`;
    relatorio += `• Dias úeis no período: ${dados.resumoGeral.diasUteisDisponiveis}\n`;
    relatorio += `• Produtividade geral: ${stats.produtividadePercent}%\n\n`;
    relatorio += `• Total horas úteis: ${dados.resumoGeral.totalHorasUteis}\n`;
    relatorio += `• Limite máximo diário: ${dados.resumoGeral.horaMaximaDiaria}h\n`;
    relatorio += `• Total horas extras acima do limite: ${
      dados.resumoGeral.totalHorasExtrasAcimaLimite || 0
    }h\n`;
    relatorio += `• Total horas extraordinárias: ${dados.resumoGeral.totalHorasExtraordinarias}\n`;
    relatorio += `• Média de horas por colaborador: ${dados.resumoGeral.mediaHorasPorColaborador}\n\n`;

    relatorio += `ANÁLISE DE PERFORMANCE:\n`;
    relatorio += `${"-".repeat(25)}\n`;
    relatorio += `• Colaboradores acima da média: ${
      stats.colaboradoresAcimaMedia
    } (${(
      (stats.colaboradoresAcimaMedia / dados.resumoGeral.totalColaboradores) *
      100
    ).toFixed(1)}%)\n`;
    relatorio += `• Colaboradores abaixo da média: ${
      stats.colaboradoresAbaixoMedia
    } (${(
      (stats.colaboradoresAbaixoMedia / dados.resumoGeral.totalColaboradores) *
      100
    ).toFixed(1)}%)\n`;
    relatorio += `• Colaboradores com baixa atividade: ${
      stats.colaboradoresBaixaAtividade
    } (${(
      (stats.colaboradoresBaixaAtividade /
        dados.resumoGeral.totalColaboradores) *
      100
    ).toFixed(1)}%)\n\n`;

    if (dados.feriados.length > 0) {
      relatorio += `FERIADOS NO PERÍODO:\n`;
      relatorio += `${"-".repeat(20)}\n`;
      relatorio += `• ${dados.feriados.join(", ")}\n\n`;
    }

    relatorio += `TOP 5 COLABORADORES:\n`;
    relatorio += `${"-".repeat(20)}\n`;
    const topColaboradores = Object.values(dados.colaboradores)
      .sort(
        (a, b) =>
          b.resumoMensal.mediaHorasDiarias - a.resumoMensal.mediaHorasDiarias
      )
      .slice(0, 5);

    topColaboradores.forEach((colaborador, index) => {
      const posicao = index + 1;
      relatorio += `${posicao}. ${colaborador.nome} - ${colaborador.resumoMensal.mediaHorasDiarias}h/dia (${colaborador.horasTotais}h total)\n`;
    });

    relatorio += `\nDETALHES POR COLABORADOR:\n`;
    relatorio += `${"-".repeat(20)}\n`;
    Object.values(dados.colaboradores).forEach((colaborador) => {
      relatorio += `\n${colaborador.nome} (${colaborador.id}):\n`;
      relatorio += `  • Total de horas: ${colaborador.horasTotais}\n`;
      relatorio += `  • Média diária: ${colaborador.resumoMensal.mediaHorasDiarias}h\n`;
      relatorio += `  • Dias trabalhados: ${colaborador.resumoMensal.diasTrabalhados}\n`;
      relatorio += `  • Horas úteis: ${colaborador.resumoMensal.horasUteis}\n`;
      relatorio += `  • Horas extras acima do limite: ${
        colaborador.resumoMensal.horasExtrasAcimaLimite || 0
      }h\n`;
      relatorio += `  • Horas extraordinárias: ${colaborador.resumoMensal.horasExtraordinarias}\n`;
      relatorio += `  • Dias ausentes: ${colaborador.resumoMensal.diasAusentes}\n`;
    });

    if (stats.alertas.length > 0) {
      relatorio += `\nALERTAS E OBSERVAÇÕES:\n`;
      relatorio += `${"-".repeat(25)}\n`;
      stats.alertas.forEach((alerta) => {
        relatorio += `⚠️ ${alerta}\n`;
      });
    }

    relatorio += `\n${"-".repeat(50)}\n`;
    relatorio += `Relatório gerado pelo plugin Jiraya\n`;

    jirayaTools.baixarArquivo(
      relatorio,
      `relatorio_executivo_${jirayaTools.ocultarLoading()}.txt`,
      "text/plain"
    );
  }

  /**
   * Utilitário para obter data formatada para nome de arquivo
   */

  /**
   * Valida entradas de tempo e mostra relatório de inconsistências
   */
  validarEntradas() {
    jirayalog("Iniciando validação de entradas...");

    jirayaTools.mostrarLoading("Validando entradas...");

    setTimeout(() => {
      try {
        const dados = this.extrairDadosFolhaDeHoras();
        if (!dados) {
          throw new Error("Não foi possível extrair dados para validação");
        }

        const resultadoValidacao = this.executarValidacao(dados);
        this.mostrarRelatorioValidacao(resultadoValidacao);
      } catch (erro) {
        jirayaTools.ocultarLoading();
        this.mostrarModalErro(
          "Erro na Validação",
          `Erro ao validar entradas: ${erro.message}`
        );
        jirayalog("Erro na validação:", erro);
      }
    }, 300);
  }

  /**
   * Executa a validação completa dos dados
   */
  executarValidacao(dados) {
    jirayalog("DEBUG: Iniciando validação detalhada...:", dados);

    const validacao = {
      periodo: dados.periodo,
      totalColaboradores: dados.resumoGeral.totalColaboradores,
      dataValidacao: new Date().toLocaleString(),
      erros: [],
      avisos: [],
      informacoes: [],
      estatisticas: {
        colaboradoresComProblemas: 0,
        diasComInconsistencias: 0,
        totalHorasValidadas: dados.resumoGeral.totalGeral,
        trabalhoFeriados: 0,
        trabalhoFinsSemana: 0,
        diasAnalisados: 0,
      },
      totalHorasExtrasAcimaLimite:
        Math.round(dados.resumoGeral.totalHorasExtrasAcimaLimite * 100) / 100 ||
        0,
    };

    // Validação 1: Colaboradores sem registro
    Object.values(dados.colaboradores).forEach((colaborador) => {
      jirayalog(
        `DEBUG: Validando colaborador ${colaborador.nome} - Total horas: ${colaborador.horasTotais}`
      );

      if (colaborador.horasTotais === 0) {
        validacao.erros.push(
          `${colaborador.nome} - Nenhuma hora registrada no período - - -`
        );
        validacao.estatisticas.colaboradoresComProblemas++;
      } else if (
        colaborador.resumoMensal.mediaHorasDiarias <
        this.configuracoes.horaMinimaDiaria
      ) {
        validacao.avisos.push(
          `${colaborador.nome} - Média diária abaixo do mínimo (${this.configuracoes.horaMinimaDiaria}h) - x - ${colaborador.resumoMensal.mediaHorasDiarias}`
        );
      }

      // Validar dias com horas excessivas (mais de 12h)
      Object.entries(colaborador.horasPorDia).forEach(([dia, dadosDia]) => {
        validacao.estatisticas.diasAnalisados++;

        if (dadosDia.horas > 12) {
          validacao.avisos.push(
            `${colaborador.nome} - Possível erro de digitação - ${dia} - ${dadosDia.horas}`
          );
        }

        if (dadosDia.horas > this.configuracoes.horaMaximaDiaria) {
          validacao.avisos.push(
            `${colaborador.nome} - Hora extra - ${dia} - ${dadosDia.horasExtras}`
          );
        }

        if (dadosDia.ehFeriado && dadosDia.horas > 0 && dadosDia.temRegistro) {
          validacao.informacoes.push(
            `${colaborador.nome} - Trabalho em feriado - ${dia} - ${dadosDia.horas}`
          );
          validacao.estatisticas.trabalhoFeriados++;
        }

        if (
          dadosDia.ehFimSemana &&
          dadosDia.horas > 0 &&
          dadosDia.temRegistro &&
          !dadosDia.ehFeriado
        ) {
          validacao.informacoes.push(
            `${colaborador.nome} - Trabalho em fim de semana - ${dia} - ${dadosDia.horas}`
          );
          validacao.estatisticas.trabalhoFinsSemana++;
        }
      });
    });

    // Validação 2: Inconsistências nos totais diários
    Object.entries(dados.totaisDiarios).forEach(([dia, dadosDia]) => {
      const somaColaboradores = Object.values(dados.colaboradores).reduce(
        (soma, colaborador) => {
          const horasDia = colaborador.horasPorDia[dia];
          return soma + (horasDia ? horasDia.horas : 0);
        },
        0
      );

      const diferencaTotal = Math.abs(somaColaboradores - dadosDia.totalHoras);
      if (diferencaTotal > 0.1) {
        // Tolerância de 0.1h para arredondamentos
        validacao.erros.push(
          `❌ Dia ${dia}: Soma individual (${somaColaboradores.toFixed(
            2
          )}h) ≠ Total do footer (${dadosDia.totalHoras}h)`
        );
        validacao.estatisticas.diasComInconsistencias++;
      }
    });

    // Validação 3: Padrões suspeitos
    const colaboradoresComMesmoTempo = {};
    Object.values(dados.colaboradores).forEach((colaborador) => {
      const horasString = colaborador.horasTotais.toString();
      if (!colaboradoresComMesmoTempo[horasString]) {
        colaboradoresComMesmoTempo[horasString] = [];
      }
      colaboradoresComMesmoTempo[horasString].push(colaborador.nome);
    });

    Object.entries(colaboradoresComMesmoTempo).forEach(([horas, nomes]) => {
      if (nomes.length > 3 && parseFloat(horas) > 0) {
        // Mais de 3 pessoas com exatamente as mesmas horas
        validacao.avisos.push(
          `⚠️ ${
            nomes.length
          } colaboradores com exatamente ${horas}h: ${nomes.join(", ")}`
        );
      }
    });

    // Validação 4: Verificar se há dias úteis sem nenhum registro
    const diasSemRegistro = [];
    dados.diasMes.forEach((dia) => {
      if (dia.ehDiaUtil && dia.numero < new Date().getDate()) {
        const totalDia = dados.totaisDiarios[dia.numero];
        if (!totalDia || totalDia.totalHoras === 0) {
          diasSemRegistro.push(dia.numero);
        }
      }
    });

    if (diasSemRegistro.length > 0) {
      validacao.avisos.push(
        `⚠️ - Dias úteis sem nenhum registro - ${diasSemRegistro.join(
          ", "
        )} - 0`
      );
    }

    // Calcular score de qualidade
    const totalProblemas = validacao.erros.length + validacao.avisos.length;
    const scoreQualidade = Math.max(0, 100 - totalProblemas * 5);
    validacao.scoreQualidade = Math.round(scoreQualidade);

    jirayalog("Validação concluída:", validacao);
    return validacao;
  }

  /**
   * Mostra o relatório de validação em um modal
   */
  mostrarRelatorioValidacao(validacao) {
    const idJiraya = Math.floor(Math.random() * 1000000);

    let corScore, textoScore;
    if (validacao.scoreQualidade >= 90) {
      corScore = "#28a745";
      textoScore = "Excelente";
    } else if (validacao.scoreQualidade >= 70) {
      corScore = "#17a2b8";
      textoScore = "Boa";
    } else if (validacao.scoreQualidade >= 50) {
      corScore = "#ffc107";
      textoScore = "Regular";
    } else {
      corScore = "#dc3545";
      textoScore = "Precisa de atenção";
    }

    // Puxar total de horas extras acima do limite diretamente do resultado da validação
    const totalHorasExtras = validacao.totalHorasExtrasAcimaLimite || 0;

    var html = /* html */ `
        ${
          totalHorasExtras > 0
            ? /* html */ `<div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin-bottom: 20px; color: #856404;">
                <strong>Aviso:</strong> Foram registradas <b>${totalHorasExtras}h</b> de horas extras acima do limite diário configurado.<br>
                Recomenda-se analisar se essas horas são justificadas e estão de acordo com a política da empresa.
              </div>`
            : ""
        }
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
          <div style="background: linear-gradient(135deg, ${corScore}, ${corScore}dd); color: white; padding: 20px; border-radius: 4px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; padding: 8px 8px 20px 8px;">${
              validacao.scoreQualidade
            }%</div>
            <div style="font-size: 14px; opacity: 0.9;">Qualidade dos dados</div>
            <div style="font-size: 12px; opacity: 0.8;">${textoScore}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 4px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #dc3545; padding: 8px 8px 20px 8px;">${
              validacao.erros.length
            }</div>
            <div style="font-size: 14px; color: #666;">Erros encontrados</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 4px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ffc107; padding: 8px 8px 20px 8px;">${
              validacao.avisos.length
            }</div>
            <div style="font-size: 14px; color: #666;">Avisos</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>Período:</strong> ${validacao.periodo}</p>
          <p><strong>Colaboradores:</strong> ${validacao.totalColaboradores}</p>
          <p><strong>Validação realizada em:</strong> ${
            validacao.dataValidacao
          }</p>
        </div>

        <!-- Estatísticas Detalhadas de Debug -->
        <div style="background: #e9ecef; border: 1px solid #ced4da; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #495057;">📊 Estatísticas da Validação</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 13px;">
            <div>
              <strong>Trabalho em feriados:</strong><br>
              <span style="color: #6c757d;">${
                validacao.estatisticas.trabalhoFeriados
              } ocorrências</span>
            </div>
            <div>
              <strong>Trabalho em fins de semana:</strong><br>
              <span style="color: #6c757d;">${
                validacao.estatisticas.trabalhoFinsSemana
              } ocorrências</span>
            </div>
            <div>
              <strong>Dias analisados:</strong><br>
              <span style="color: #6c757d;">${
                validacao.estatisticas.diasAnalisados
              } registros</span>
            </div>
             <div>
              <strong>Horas extras:</strong><br>
              <span style="color: #6c757d;">${
                validacao.totalHorasExtrasAcimaLimite
              }h</span>
            </div>
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: #6c757d;">
            💡 Apenas registros reais (com conteúdo) são contabilizados nas estatísticas de trabalho especial.
          </div>
        </div>

        ${
          validacao.erros.length > 0
            ? /* html */ `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #dc3545; margin-bottom: 10px;">❌ Erros que Precisam ser Corrigidos</h3>
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; max-height: 200px; overflow-y: auto;">
          ${validacao.erros
            .map((erro) => {
              const partesErro = erro.split(" - ");
              return `<tr>
                    <td style='padding: 6px; border-bottom: 1px solid #f5c6cb;'>${
                      partesErro[0] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #f5c6cb;'>${
                      partesErro[1] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #f5c6cb;'>${
                      partesErro[2] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #f5c6cb;'>${
                      partesErro[3] || ""
                    }h</td>
                  </tr>`;
            })
            .join("")}
          </div>
        </div>
        `
            : ""
        }

        ${
          validacao.avisos.length > 0
            ? /* html */ `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #856404; margin-bottom: 10px;">⚠️ Avisos para atenção</h3>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; max-height: 200px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; background: #fffbe6;">
              <thead>
                <tr>
                  <th style="padding: 8px; border-bottom: 1px solid #ffeaa7; text-align: left; color: #856404;">Colaborador</th>
                  <th style="padding: 8px; border-bottom: 1px solid #ffeaa7; text-align: left; color: #856404;">Descrição</th>
                  <th style="padding: 8px; border-bottom: 1px solid #ffeaa7; text-align: left; color: #856404;">Dia</th>
                  <th style="padding: 8px; border-bottom: 1px solid #ffeaa7; text-align: left; color: #856404;">Horas</th>
                </tr>
              </thead>
              <tbody>
               ${validacao.avisos
                 .map((aviso) => {
                   const partesAviso = aviso.split(" - ");
                   return `<tr>
                    <td style='padding: 6px; border-bottom: 1px solid #ffeaa7;'>${
                      partesAviso[0] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #ffeaa7;'>${
                      partesAviso[1] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #ffeaa7;'>${
                      partesAviso[2] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #ffeaa7;'>${
                      partesAviso[3] || ""
                    }h</td>
                  </tr>`;
                 })
                 .join("")}
              </tbody>
            </table>
          </div>
        </div>
        `
            : ""
        }

        ${
          validacao.informacoes.length > 0
            ? /* html */ `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #0c5460; margin-bottom: 10px;">ℹ️ Informações adicionais</h3>
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; padding: 15px; max-height: 200px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; background: #eaf6fb;">
              <thead>
                <tr>
                  <th style="padding: 8px; border-bottom: 1px solid #bee5eb; text-align: left; color: #0c5460;">Colaborador</th>
                  <th style="padding: 8px; border-bottom: 1px solid #bee5eb; text-align: left; color: #0c5460;">Descrição</th>
                  <th style="padding: 8px; border-bottom: 1px solid #bee5eb; text-align: left; color: #0c5460;">Dia</th>
                  <th style="padding: 8px; border-bottom: 1px solid #bee5eb; text-align: left; color: #0c5460;">Horas</th>
                </tr>
              </thead>
              <tbody>
                ${validacao.informacoes
                  .map((info) => {
                    const partesInfo = info.split(" - ");
                    return `<tr>
                    <td style='padding: 6px; border-bottom: 1px solid #bee5eb;'>${
                      partesInfo[0] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #bee5eb;'>${
                      partesInfo[1] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #bee5eb;'>${
                      partesInfo[2] || ""
                    }</td>
                    <td style='padding: 6px; border-bottom: 1px solid #bee5eb;'>${
                      partesInfo[3] || ""
                    }h</td>
                  </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
        `
            : ""
        }
    `;

    var botoes = /* html */ `
      <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-config" data-jiraya-id="${idJiraya}">
        ⚙️ Configurações
      </button>
      <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportar" data-jiraya-id="${idJiraya}">
          📄 Exportar relatório
      </button>
    `;

    jirayaTools.modal({
      id: idJiraya,
      btnFechar: true,
      btnFullScreen: true,
      titulo: "🔍 Relatório de validação",
      bodyHtml: html,
      botoesBottomHtml: botoes,
      callback: () => {
        setTimeout(() => {
          $(document)
            .on(
              "click",
              ".jiraya-folhadehoras-config[data-jiraya-id='" + idJiraya + "']",
              function () {
                jirayaFolhaDeHoras.mostrarConfiguracoes();
              }
            )
            .on(
              "click",
              ".jiraya-folhadehoras-exportar[data-jiraya-id='" +
                idJiraya +
                "']",
              function () {
                jirayaFolhaDeHoras.exportarRelatorioValidacao(validacao);
              }
            );
        }, 10);
      },
    });

    jirayaTools.ocultarLoading();
  }

  /**
   * Exporta relatório de validação
   */
  exportarRelatorioValidacao(validacao) {
    let relatorio = `RELATÓRIO DE VALIDAÇÃO - FOLHADEHORAS\n`;
    relatorio += `${"=".repeat(50)}\n\n`;

    relatorio += `Período: ${validacao.periodo}\n`;
    relatorio += `Data da Validação: ${validacao.dataValidacao}\n`;
    relatorio += `Total de Colaboradores: ${validacao.totalColaboradores}\n`;
    relatorio += `Score de Qualidade: ${validacao.scoreQualidade}%\n\n`;

    relatorio += `RESUMO:\n`;
    relatorio += `- Erros encontrados: ${validacao.erros.length}\n`;
    relatorio += `- Avisos: ${validacao.avisos.length}\n`;
    relatorio += `- Informações: ${validacao.informacoes.length}\n\n`;

    if (validacao.erros.length > 0) {
      relatorio += `ERROS CRÍTICOS:\n${"-".repeat(20)}\n`;
      validacao.erros.forEach((erro, index) => {
        const partesErro = erro.split(" - ");
        relatorio += `${index + 1}. ${partesErro[0] || ""} - ${
          partesErro[1] || ""
        } - Dia ${partesErro[2] || ""} - ${partesErro[3] || ""}h\n`;
      });
      relatorio += `\n`;
    }

    if (validacao.avisos.length > 0) {
      relatorio += `AVISOS:\n${"-".repeat(10)}\n`;
      validacao.avisos.forEach((aviso, index) => {
        const partesAviso = aviso.split(" - ");
        relatorio += `${index + 1}. ${partesAviso[0] || ""} - ${
          partesAviso[1] || ""
        } - Dia ${partesAviso[2] || ""} - ${partesAviso[3] || ""}h\n`;
      });
      relatorio += `\n`;
    }

    if (validacao.informacoes.length > 0) {
      relatorio += `INFORMAÇÕES:\n${"-".repeat(15)}\n`;
      validacao.informacoes.forEach((info, index) => {
        const partesInfo = info.split(" - ");
        relatorio += `${index + 1}. ${partesInfo[0] || ""} - ${
          partesInfo[1] || ""
        } - Dia ${partesInfo[2] || ""} - ${partesInfo[3] || ""}h\n`;
      });
    }

    jirayaTools.baixarArquivo(
      relatorio,
      `validacao_folhadehoras_${jirayaTools.ocultarLoading()}.txt`,
      "text/plain"
    );

    // Fechar modal após exportar
    this.fecharModal(".jiraya-modal-validacao", ".jiraya-overlay-validacao");
  }

  /**
   * Mostra resumo do período
   */
  mostrarResumoPeriodo() {
    const idJiraya = Math.floor(Math.random() * 1000000);
    jirayalog("Mostrando resumo do período...");

    const dados = this.extrairDadosFolhaDeHoras();
    if (!dados) {
      alert("Erro ao extrair dados para o resumo");
      return;
    }

    // Calcular estatísticas adicionais para o resumo
    const stats = this.calcularEstatisticasResumo(dados);

    var html = /* html */ `
        <!-- Informações Básicas -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 20px;">📅 Informações do período</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
              <div style="font-size: 14px; opacity: 0.9;">Período</div>
              <div style="font-size: 18px; font-weight: bold;">${
                dados.periodo
              }</div>
            </div>
            <div>
              <div style="font-size: 14px; opacity: 0.9;">Total de colaboradores</div>
              <div style="font-size: 18px; font-weight: bold;">${
                dados.resumoGeral.totalColaboradores
              }</div>
            </div>
            <div>
              <div style="font-size: 14px; opacity: 0.9;">Dias úteis no período</div>
              <div style="font-size: 18px; font-weight: bold;">${
                dados.resumoGeral.diasUteisDisponiveis
              }</div>
            </div>
            <div>
              <div style="font-size: 14px; opacity: 0.9;">Feriados identificados em dias úteis</div>
              <div style="font-size: 18px; font-weight: bold;">${
                dados.feriados.length
              }</div>
            </div>
          </div>
        </div>

        <!-- Métricas Principais -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 25px;">
          <div style="background: linear-gradient(135deg, #11998e, #38ef7d); color: white; padding: 20px; border-radius: 4px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Total de horas</h3>
            <div style="font-size: 32px; font-weight: bold;padding: 8px 8px 20px 8px;">${
              dados.resumoGeral.totalGeral
            }</div>
            <div style="font-size: 14px; opacity: 0.8;">horas trabalhadas</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 4px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Média por colaborador</h3>
            <div style="font-size: 32px; font-weight: bold;padding: 8px 8px 20px 8px;">${
              dados.resumoGeral.mediaHorasPorColaborador
            }</div>
            <div style="font-size: 14px; opacity: 0.8;">horas/colaborador</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 20px; border-radius: 4px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Média por dia útil</h3>
            <div style="font-size: 32px; font-weight: bold;padding: 8px 8px 20px 8px;">${
              dados.resumoGeral.mediaHorasPorDia
            }</div>
            <div style="font-size: 14px; opacity: 0.8;">horas/dia</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #ffecd2, #fcb69f); color: #333; padding: 20px; border-radius: 4px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.8;">Produtividade</h3>
            <div style="font-size: 32px; font-weight: bold;padding: 8px 8px 20px 8px;">${
              stats.produtividadePercent
            }%</div>
            <div style="font-size: 14px; opacity: 0.7;">vs meta de ${
              this.configuracoes.horaMediaDiaria
            }h/dia</div>
          </div>
        </div>

        <!-- Análise por Status -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">📊 Análise por Performance</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            
            <div style="text-align: center; padding: 15px;">
              <div style="width: 60px; height: 60px; background: rgba(40, 167, 69, 0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px;">🟢</div>
              <div style="font-size: 24px; font-weight: bold; color: #28a745;padding: 4px 4px 10px 4px;">${
                stats.colaboradoresAcimaMedia
              }</div>
              <div style="font-size: 14px; color: #666;">Acima da média</div>
              <div style="font-size: 12px; color: #999;">(≥ ${
                this.configuracoes.horaMediaDiaria
              }h/dia)</div>
            </div>
            
            <div style="text-align: center; padding: 15px;">
              <div style="width: 60px; height: 60px; background: rgba(255, 193, 7, 0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px;">🟠</div>
              <div style="font-size: 24px; font-weight: bold; color: #f57c00;padding: 4px 4px 10px 4px;">${
                stats.colaboradoresAbaixoMedia
              }</div>
              <div style="font-size: 14px; color: #666;">Abaixo da média</div>
              <div style="font-size: 12px; color: #999;">(< ${
                this.configuracoes.horaMediaDiaria
              }h/dia)</div>
            </div>
            
            <div style="text-align: center; padding: 15px;">
              <div style="width: 60px; height: 60px; background: rgba(220, 53, 69, 0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px;">🔴</div>
              <div style="font-size: 24px; font-weight: bold; color: #dc3545;padding: 4px 4px 10px 4px;">${
                stats.colaboradoresBaixaAtividade
              }</div>
              <div style="font-size: 14px; color: #666;">Baixa atividade</div>
              <div style="font-size: 12px; color: #999;">(< ${
                this.configuracoes.horaMinimaDiaria
              }h/dia)</div>
            </div>

          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">🏆 Produtividade</h2>
          <div style="background: white; border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
            ${this.gerarTabelaTopPerformers(dados)}
          </div>
        </div>

        <!-- Distribuição de Horas por Dia -->
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">📈 Distribuição de horas por dia</h2>
          <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 15px;">
            ${this.gerarGraficoDistribuicao(dados)}
          </div>
        </div>

        ${
          stats.alertas.length > 0
            ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 20px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #856404; font-size: 18px;">⚠️ Alertas e observações</h2>
          <ul style="margin: 0; padding-left: 20px; color: #856404;">
            ${stats.alertas
              .map((alerta) => `<li style="margin-bottom: 8px;">${alerta}</li>`)
              .join("")}
          </ul>
        </div>
        `
            : ""
        }
    `;

    var botoes = /* html */ `
      <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportardados" data-jiraya-modo="json" data-jiraya-id="${idJiraya}" >
          💾 Baixar JSON
        </button>
        <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportardados" data-jiraya-modo="csv" data-jiraya-id="${idJiraya}" >
          📊 Baixar CSV
        </button>
        <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-exportardados" data-jiraya-modo="resumo" data-jiraya-id="${idJiraya}">
          📄 Baixar resumo
        </button>
          <button class="jiraya-btn-outline-secundario jiraya-folhadehoras-visualizar-dados" data-jiraya-id="${idJiraya}">
            🔍 Ver dados completos
          </button>
    `;

    jirayaTools.modal({
      id: idJiraya,
      btnFechar: true,
      btnFullScreen: true,
      titulo: "📈 Resumo do período",
      bodyHtml: html,
      botoesBottomHtml: botoes,
      callback: () => {
        setTimeout(() => {
          $(document)
            .on(
              "click",
              ".jiraya-folhadehoras-exportardados[data-jiraya-id='" +
                idJiraya +
                "']",
              function () {
                const modo = $(this).data("jiraya-modo");
                jirayaFolhaDeHoras.exportarDadosFolhaDeHoras(modo);
              }
            )
            .on(
              "click",
              ".jiraya-folhadehoras-visualizar-dados[data-jiraya-id='" +
                idJiraya +
                "']",
              function () {
                jirayaFolhaDeHoras.visualizarDados();
              }
            );
        }, 10);
      },
    });
  }

  /**
   * Aplica pintura na tabela baseada nas médias de horas
   */
  aplicarPinturaTabela() {
    if (!this.configuracoes.pintarTabelaPorMedia) {
      jirayalog("Pintura da tabela desabilitada");
      return;
    }

    jirayalog("Aplicando pintura na tabela baseada nas médias de horas");

    // Aguardar um pouco para garantir que a tabela esteja carregada
    setTimeout(() => {
      this.pintarCelulasTabela();
    }, 1000);
  }

  /**
   * Pinta as células da tabela baseado nas horas vs médias
   */
  pintarCelulasTabela() {
    this.alterarBotaoPintarTabela();
    // Gerenciar o aviso sobre limitações da pintura
    this.gerenciarAvisoPintura();
    // Buscar todas as células de dados, incluindo as não visíveis no scroll
    const $todasCelulas = $(this.aplicacao)
      .find(".public_fixedDataTableCell_cellContent")
      .filter(function () {
        // Filtrar apenas células que têm um atributo name com formato de data
        const $celula = $(this).closest('[data-testid="grid-cell"]');
        const nomeAttr = $celula.attr("name") || "";
        return nomeAttr.match(/cell_.*_(\d{4}-\d{2}-\d{2})/);
      });

    jirayalog(
      `Encontradas ${$todasCelulas.length} células de dados para pintura`
    );

    $todasCelulas.each((indice, conteudoCelula) => {
      const $conteudoCelula = $(conteudoCelula);
      const $celula = $conteudoCelula.closest('[data-testid="grid-cell"]');
      const conteudoHoras = $conteudoCelula.text().trim();
      const horas = conteudoHoras ? parseFloat(conteudoHoras) : 0;

      // Verificar se é dia útil (similar à lógica de extrairDadosFolhaDeHoras)
      const $wrapper = $celula.closest(".fixedDataTableCellLayout_wrap1");

      // Verificar se é feriado
      const ehFeriado = $wrapper.hasClass("holiday_and_non_working_day");

      // Verificar se é ESPECIFICAMENTE sábado ou domingo pelo cabeçalho da coluna
      let ehFimSemana = false;
      let nomeDiaAbrev = "";
      const nomeAttr = $celula.attr("name") || "";
      const matchData = nomeAttr.match(/cell_.*_(\d{4}-\d{2}-\d{2})/);

      try {
        if (matchData) {
          const dataCompleta = matchData[1];

          // Verificar se a data da célula é até amanhã (não pintar células muito futuras)
          // Corrigido: usar split para evitar problemas de fuso horário
          const [ano, mes, diaStr] = dataCompleta.split("-");
          const dataCelula = new Date(
            parseInt(ano),
            parseInt(mes) - 1,
            parseInt(diaStr)
          );
          const amanha = new Date();
          amanha.setDate(amanha.getDate() - 1); // Adiciona 1 dia
          amanha.setHours(23, 59, 59, 999); // Considera até o final do dia de amanhã

          if (dataCelula > amanha) {
            return; // Continua para a próxima iteração
          }

          // Buscar o cabeçalho que contém essa data específica
          const $cabecalhos = $(this.aplicacao).find(
            'div[role="columnheader"]'
          );
          let cabecalhoEncontrado = null;

          $cabecalhos.each((idx, cabecalho) => {
            const $cab = $(cabecalho);
            const textoCab = $cab.text().trim();

            // Extrair o número do dia do texto do cabeçalho (ex: "01", "02", etc)
            const matchDiaCabecalho = textoCab.match(/(\d{1,2})/);
            if (matchDiaCabecalho) {
              const diaCabecalho = matchDiaCabecalho[1].padStart(2, "0");
              const diaData = dataCompleta.split("-")[2]; // Pega o dia da data (YYYY-MM-DD)

              if (diaCabecalho === diaData) {
                cabecalhoEncontrado = $cab;
                return false; // Para o loop
              }
            }
          });

          if (cabecalhoEncontrado) {
            const textoCabecalho = cabecalhoEncontrado.text().trim();
            nomeDiaAbrev = textoCabecalho;

            // Verificar se contém Sa ou Su (formato: "05Su", "11Sa", etc)
            ehFimSemana =
              textoCabecalho.indexOf("Sa") !== -1 ||
              textoCabecalho.indexOf("Su") !== -1;

            // jirayalog(
            //   `Data ${dataCompleta}: Cabeçalho "${textoCabecalho}" -> éSábadoOuDomingo=${ehFimSemana}`
            // );
          } else {
            jirayalog(`Cabeçalho não encontrado para data ${dataCompleta}`);
          }
        }
      } catch (e) {
        jirayalog(`Erro ao verificar cabeçalho: ${e.message}`);
      }

      const ehDiaUtil = !ehFeriado && !ehFimSemana;

      // Debug: log da análise da célula
      const dataDebug = matchData ? matchData[1] : "sem data";
      // jirayalog(
      //   `Célula ${indice} (${dataDebug}) [${nomeDiaAbrev}]: feriado=${ehFeriado}, fimSemana=${ehFimSemana}, diaUtil=${ehDiaUtil}, horas=${horas}`
      // );

      if (ehFeriado) {
      }

      // Pintar células com horas registradas
      if (conteudoHoras !== "" && horas > 0) {
        let classeStatus = "";
        let status = "";

        if (ehFimSemana && !ehFeriado) {
          // Fim de semana com horas - azul claro
          classeStatus = "jiraya-cell-fim-semana-trabalhado";
          status = "Trabalho em fim de semana";
        } else if (ehDiaUtil) {
          // Dia útil com horas
          if (
            horas < this.configuracoes.horaMediaDiaria &&
            horas >= this.configuracoes.horaMinimaDiaria
          ) {
            // Abaixo da média - laranja
            classeStatus = "jiraya-cell-abaixo-media";
            status = "Abaixo da média";
          } else if (horas < this.configuracoes.horaMinimaDiaria) {
            // Abaixo da mínima - vermelho
            classeStatus = "jiraya-cell-abaixo-minima";
            status = "Abaixo da mínima";
          } else if (horas <= this.configuracoes.horaMaximaDiaria) {
            // Acima da média - verde
            classeStatus = "jiraya-cell-acima-media";
            status = "Acima da média";
          } else if (horas > this.configuracoes.horaMaximaDiaria) {
            // Acima do máximo - verde escuro (muito raro)
            classeStatus = "jiraya-cell-acima-maximo";
            status = "Acima do máximo esperado (horas extras)";
          }
        } else if (ehFeriado) {
          // Feriado com horas - azul escuro
          // classeStatus = "jiraya-cell-feriado";
          // status = "Trabalho em feriado";
        }

        // Padronizar status para só a primeira letra maiúscula
        if (status && typeof status === "string") {
          status =
            status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        }

        // Remover classes antigas e adicionar novas
        $celula
          .removeClass(
            "jiraya-cell-sem-registro jiraya-cell-abaixo-media jiraya-cell-abaixo-minima jiraya-cell-acima-maximo jiraya-cell-acima-media jiraya-cell-fim-semana jiraya-cell-feriado"
          )
          .addClass(`${classeStatus} jiraya-cell-pintada`);

        // Adicionar tooltip com informações detalhadas
        $celula.attr(
          "title",
          `Horas: ${conteudoHoras || "0"}\n` +
            `Status: ${status}\n` +
            `Média esperada: ${this.configuracoes.horaMediaDiaria}h\n` +
            `Mínimo: ${this.configuracoes.horaMinimaDiaria}h\n` +
            `Máximo: ${this.configuracoes.horaMaximaDiaria}h\n` +
            `Clique para mais detalhes`
        );
      } else {
        $celula
          .removeClass(
            "jiraya-cell-sem-registro jiraya-cell-abaixo-media jiraya-cell-abaixo-minima jiraya-cell-acima-maximo jiraya-cell-acima-media jiraya-cell-fim-semana jiraya-cell-feriado jiraya-cell-pintada"
          )
          .removeAttr("title");

        if (ehDiaUtil) {
          $celula
            .addClass("jiraya-cell-sem-registro jiraya-cell-pintada")
            .attr("title", "Sem registro");
        }
        if (ehFimSemana) {
          $celula;
          // .addClass("jiraya-cell-fim-semana jiraya-cell-pintada")
          // .attr("title", "Fim de semana");
        }
        if (ehFeriado) {
          $celula
            .addClass("jiraya-cell-feriado jiraya-cell-pintada")
            .attr("title", "Feriado");
        }
      }
    });

    setTimeout(() => {
      this.configurarObservadorTempoReport();
      if (this.pinturaContainerTimeout) {
        clearTimeout(this.pinturaContainerTimeout);
      }
    }, 100);

    jirayalog("Pintura da tabela aplicada com sucesso");
  }

  /**
   * Remove a pintura da tabela
   */
  removerPinturaTabela() {
    const $celulasDias = $(this.aplicacao).find('[data-testid="grid-cell"]');

    $celulasDias.each((indice, celula) => {
      const $celula = $(celula);
      $celula
        .removeClass(
          "jiraya-cell-sem-registro jiraya-cell-abaixo-media jiraya-cell-abaixo-minima jiraya-cell-acima-maximo jiraya-cell-acima-media jiraya-cell-fim-semana jiraya-cell-feriado jiraya-cell-pintada"
        )
        .removeAttr("title");
    });
    $("#jiraya-aviso-pintura").remove();
    this.alterarBotaoPintarTabela();
    jirayalog("Pintura da tabela removida");
  }

  /**
   * Mostra configurações
   */
  mostrarConfiguracoes() {
    jirayalog("Abrindo configurações...");
    const idJiraya = Math.floor(Math.random() * 1000000);
    var html = /* html */ `
        <div style="display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 10px;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
            🕐 Hora mínima diária (horas):
          </label>
          <input type="number" id="horaMinimaDiaria" value="${
            this.configuracoes.horaMinimaDiaria
          }" 
                 step="0.1" min="0" max="24"
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
          <small style="color: #666; font-size: 12px;">Valor mínimo esperado de horas por dia</small>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
            📊 Hora média diária (horas):
          </label>
          <input type="number" id="horaMediaDiaria" value="${
            this.configuracoes.horaMediaDiaria
          }" 
                 step="0.1" min="0" max="24"
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
          <small style="color: #666; font-size: 12px;">Valor de referência para pintar a tabela</small>
        </div>

         <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
            ⏰ Hora máxima diária (horas):
          </label>
          <input type="number" id="horaMaximaDiaria" value="${
            this.configuracoes.horaMaximaDiaria
          }" 
                 step="0.1" min="0" max="24"
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
          <small style="color: #666; font-size: 12px;">Valor de referência para pintar a tabela</small>
        </div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="pintarTabelaPorMedia" ${
              this.configuracoes.pintarTabelaPorMedia ? "checked" : ""
            }
                   style="margin-right: 10px;">
            <span style="font-weight: bold; color: #333;">🎨 Pintar tabela por média</span>
          </label>
          <small style="color: #666; font-size: 12px; margin-left: 25px;">
            Ativa a colorização automática das células baseada nas horas trabalhadas
          </small>
           <div class="jiraya-aviso-tabela-horarios">
          <span style="font-size: 16px;">ℹ️</span>
          <span>
           A pintura e os cálculos consideram apenas as células <strong>visíveis na tela</strong>.
Para uma análise completa, reduza o zoom até que todos os dias sejam exibidos e gere o relatório novamente.
          </span>
          </div>
            ${this.legendasPinturaTabela()}
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
         
        </div>

    `;

    var botoes = /* html */ `
      <button class="jiraya-btn-outline-primario jiraya-folhadehoras-resetar-config" data-jiraya-id="${idJiraya}">
        Resetar
      </button>
      <button class="jiraya-btn-primario jiraya-folhadehoras-salvar-config" data-jiraya-id="${idJiraya}">
        Salvar
      </button>
          
        `;

    jirayaTools.modal({
      id: idJiraya,
      btnFechar: true,
      width: "650px",
      height: "620px",
      titulo: "⚙️ Configurações da folha de horas",
      bodyHtml: html,
      botoesBottomHtml: botoes,
      callback: () => {
        setTimeout(() => {
          $(document)
            .on(
              "click",
              ".jiraya-folhadehoras-salvar-config[data-jiraya-id='" +
                idJiraya +
                "']",
              function () {
                var idJiraya = $(this).data("jiraya-id");
                jirayaFolhaDeHoras.salvarConfiguracoes(idJiraya);
              }
            )
            .on(
              "click",
              ".jiraya-folhadehoras-resetar-config[data-jiraya-id='" +
                idJiraya +
                "']",
              function () {
                jirayaFolhaDeHoras.resetarConfiguracoes();
              }
            );
        }, 10);
      },
    });
  }

  legendasPinturaTabela() {
    const legendas = {
      "jiraya-legenda-folhadehoras jiraya-cell-sem-registro":
        "Sem registro de horas;",
      "jiraya-legenda-folhadehoras jiraya-cell-abaixo-minima": `Abaixo da mínima <strong>(< ${this.configuracoes.horaMinimaDiaria}h)</strong>;10`,
      "jiraya-legenda-folhadehoras jiraya-cell-abaixo-media": `Abaixo da média <strong>(< ${this.configuracoes.horaMediaDiaria}h)</strong>;10`,
      "jiraya-legenda-folhadehoras jiraya-cell-acima-media": `Acima da média <strong>(≥ ${this.configuracoes.horaMediaDiaria}h)</strong>;10`,
      "jiraya-legenda-folhadehoras jiraya-cell-acima-maximo": `Acima da máxima <strong>(≥ ${this.configuracoes.horaMaximaDiaria}h)</strong>;10`,
      "jiraya-legenda-folhadehoras jiraya-cell-fim-semana-trabalhado":
        "Fim de semana trabalhado;10",
    };

    var legendaHtml = '<div class="jiraya-legendas">';
    Object.entries(legendas).forEach(([classe, texto]) => {
      legendaHtml += `<div class="${
        classe.split(" ")[0]
      }"><span class="jiraya-legenda-valor ${classe.split(" ")[1]}">${
        texto.split(";")[1]
      }</span><span class="jiraya-legenda-texto">${
        texto.split(";")[0]
      }</span></div>`;
    });
    legendaHtml += "</div>";

    return legendaHtml;
  }

  /**
   * Salva as configurações
   */
  salvarConfiguracoes(idJiraya) {
    const horaMinima =
      parseFloat(document.getElementById("horaMinimaDiaria").value) || 5.5;
    const horaMaxima =
      parseFloat(document.getElementById("horaMaximaDiaria").value) || 8;
    const horaMedia =
      parseFloat(document.getElementById("horaMediaDiaria").value) || 6.5;
    const pintarTabela = document.getElementById(
      "pintarTabelaPorMedia"
    ).checked;

    // Validações
    if (horaMinima < 0 || horaMinima > 24) {
      alert("Hora mínima deve estar entre 0 e 24 horas");
      return;
    }

    if (horaMedia < 0 || horaMedia > 24) {
      alert("Hora média deve estar entre 0 e 24 horas");
      return;
    }

    if (horaMaxima < 0 || horaMaxima > 24) {
      alert("Hora máxima deve estar entre 0 e 24 horas");
      return;
    }

    if (horaMedia < horaMinima) {
      alert("Hora média deve ser maior ou igual à hora mínima");
      return;
    }

    // Atualizar configurações
    this.configuracoes.horaMinimaDiaria = horaMinima;
    this.configuracoes.horaMaximaDiaria = horaMaxima;
    this.configuracoes.horaMediaDiaria = horaMedia;
    this.configuracoes.pintarTabelaPorMedia = pintarTabela;

    // Salvar no localStorage
    localStorage.setItem(
      "jirayaFolhaDeHorasConfig",
      JSON.stringify(this.configuracoes)
    );

    // Aplicar mudanças visuais
    if (pintarTabela) {
      this.pintarCelulasTabela();
    } else {
      this.removerPinturaTabela();
    }

    jirayaTools.fechar(idJiraya);

    jirayalog("Configurações salvas:", this.configuracoes);
    alert("Configurações salvas com sucesso!");
  }

  /**
   * Reseta as configurações para os valores padrão
   */
  resetarConfiguracoes() {
    if (confirm("Tem certeza que deseja resetar todas as configurações?")) {
      this.configuracoes = {
        horaMinimaDiaria: 5.5,
        horaMaximaDiaria: 8,
        horaMediaDiaria: 6.5,
        pintarTabelaPorMedia: true,
      };

      localStorage.removeItem("jirayaFolhaDeHorasConfig");

      // Atualizar campos do formulário
      document.getElementById("horaMinimaDiaria").value =
        this.configuracoes.horaMinimaDiaria;
      document.getElementById("horaMaximaDiaria").value =
        this.configuracoes.horaMaximaDiaria;
      document.getElementById("horaMediaDiaria").value =
        this.configuracoes.horaMediaDiaria;
      document.getElementById("pintarTabelaPorMedia").checked =
        this.configuracoes.pintarTabelaPorMedia;

      jirayalog("Configurações resetadas");
      alert("Configurações resetadas para os valores padrão!");
    }
  }

  /**
   * Carrega configurações do localStorage
   */
  carregarConfiguracoes() {
    try {
      const configSalvas = localStorage.getItem("jirayaFolhaDeHorasConfig");
      if (configSalvas) {
        const config = JSON.parse(configSalvas);
        this.configuracoes = { ...this.configuracoes, ...config };
        jirayalog("Configurações carregadas:", this.configuracoes);
      }
    } catch (erro) {
      jirayalog("Erro ao carregar configurações:", erro);
    }
  }

  /**
   * Alterna a pintura da tabela
   */
  alternarPinturaTabela() {
    this.configuracoes.pintarTabelaPorMedia =
      !this.configuracoes.pintarTabelaPorMedia;

    // Salvar no localStorage
    localStorage.setItem(
      "jirayaFolhaDeHorasConfig",
      JSON.stringify(this.configuracoes)
    );

    // Aplicar ou remover pintura
    if (this.configuracoes.pintarTabelaPorMedia) {
      this.pintarCelulasTabela();
      // Reconfigurar observador do tempo-report-container para garantir que esteja ativo
    } else {
      this.removerPinturaTabela();
      jirayalog("Pintura da tabela desativada");
    }
  }

  alterarBotaoPintarTabela() {
      $("#jiraya-pintura-tabela").html(
      this.configuracoes.pintarTabelaPorMedia ? "🎨" : "⬜"
    );
  }

  /**
   * Gerencia o aviso sobre a limitação da pintura de células
   */
  gerenciarAvisoPintura() {
    const $container = $(this.aplicacao);
    const avisoId = "jiraya-aviso-pintura";

    if ($(`#${avisoId}`).length > 0) {
      return; // Aviso já existe
    }

    if (this.configuracoes.pintarTabelaPorMedia && $container.length > 0) {
      const avisoHtml = /* html */ `
        <div id="${avisoId}">
        <div class="jiraya-aviso-tabela-horarios">
          <span style="font-size: 16px;">ℹ️</span>
          <span>
           A pintura e os cálculos consideram apenas as células <strong>visíveis na tela</strong>.
Para uma análise completa, reduza o zoom até que todos os dias sejam exibidos e gere o relatório novamente.
          </span>
          </div>
        ${this.legendasPinturaTabela()}
        </div>
      `;
      $container.after(avisoHtml);
      jirayalog("Aviso de limitação da pintura adicionado");
    }
  }

  /**
   * Função utilitária para fechar modais do Jiraya de forma segura
   */
  fecharModal(seletorModal, seletorOverlay = null) {
    try {
      // Verificar se os elementos existem antes de remover
      const $modal = $(seletorModal);

      if ($modal.length > 0) {
        $modal.remove();
        jirayalog(`Modal removido: ${seletorModal}`);
      }

      // Se foi especificado um overlay específico, remove apenas ele
      if (seletorOverlay) {
        const $overlay = $(seletorOverlay);
        if ($overlay.length > 0) {
          $overlay.remove();
          jirayalog(`Overlay específico removido: ${seletorOverlay}`);
        }
      }
    } catch (erro) {
      jirayalog("Erro ao fechar modal:", erro);
      // Fallback para remover qualquer modal do Jiraya que possa estar aberto
      $(
        ".jiraya-dados-folhadehoras, .jiraya-resumo-periodo, .jiraya-config-folhadehoras, .jiraya-folhadehoras-menu, .jiraya-overlay, .jiraya-overlay-dados, .jiraya-overlay-resumo, .jiraya-overlay-config"
      ).remove();
    }
  }

  /**
   * Calcula estatísticas adicionais para o resumo
   */
  calcularEstatisticasResumo(dados) {
    let colaboradoresAcimaMedia = 0;
    let colaboradoresAbaixoMedia = 0;
    let colaboradoresBaixaAtividade = 0;
    let alertas = [];

    Object.values(dados.colaboradores).forEach((colaborador) => {
      const media = colaborador.resumoMensal.mediaHorasDiarias;

      if (media >= this.configuracoes.horaMediaDiaria) {
        colaboradoresAcimaMedia++;
      } else if (media >= this.configuracoes.horaMinimaDiaria) {
        colaboradoresAbaixoMedia++;
      } else {
        colaboradoresBaixaAtividade++;
        if (media > 0) {
          alertas.push(`${colaborador.nome} tem média de apenas ${media}h/dia`);
        }
      }

      if (colaborador.resumoMensal.diasAusentes > 5) {
        alertas.push(
          `${colaborador.nome} tem ${colaborador.resumoMensal.diasAusentes} dias ausentes`
        );
      }
    });

    // Calcular produtividade geral vs meta
    const metaTotal =
      dados.resumoGeral.diasUteisDisponiveis *
      this.configuracoes.horaMediaDiaria *
      dados.resumoGeral.totalColaboradores;
    const produtividadePercent =
      metaTotal > 0
        ? Math.round((dados.resumoGeral.totalGeral / metaTotal) * 100)
        : 0;

    if (produtividadePercent < 80) {
      alertas.push(
        `Produtividade geral está em ${produtividadePercent}%, abaixo dos 80% esperados`
      );
    }

    if (
      dados.feriados.length === 0 &&
      dados.resumoGeral.diasUteisDisponiveis > 15
    ) {
      alertas.push(
        "Nenhum feriado identificado no período - verificar se há feriados não marcados"
      );
    }

    return {
      colaboradoresAcimaMedia,
      colaboradoresAbaixoMedia,
      colaboradoresBaixaAtividade,
      produtividadePercent,
      alertas,
    };
  }

  /**
   * Gera tabela dos top performers
   */
  gerarTabelaTopPerformers(dados) {
    const colaboradoresOrdenados = Object.values(dados.colaboradores)
      .sort(
        (a, b) =>
          b.resumoMensal.mediaHorasDiarias - a.resumoMensal.mediaHorasDiarias
      )
      .slice(0, 5);

    let html = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead style="background: #f8f9fa;">
          <tr>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Posição</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Colaborador</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Média diária</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Total de horas</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Status</th>
          </tr>
        </thead>
        <tbody>`;

    colaboradoresOrdenados.forEach((colaborador, index) => {
      const posicao = index + 1;
      let medal = "";
      let statusCor = "";
      let statusTexto = "";

      if (posicao === 1) medal = "🥇";
      else if (posicao === 2) medal = "🥈";
      else if (posicao === 3) medal = "🥉";
      else medal = `${posicao}°`;

      if (
        colaborador.resumoMensal.mediaHorasDiarias >=
        this.configuracoes.horaMediaDiaria
      ) {
        statusCor = "#28a745";
        statusTexto = "✅ Excelente";
      } else if (
        colaborador.resumoMensal.mediaHorasDiarias <
          this.configuracoes.horaMediaDiaria &&
        colaborador.resumoMensal.mediaHorasDiarias >=
          this.configuracoes.horaMinimaDiaria
      ) {
        statusCor = "#f57c00";
        statusTexto = "⚠️ Regular";
      } else {
        statusCor = "#dc3545";
        statusTexto = "❌ Baixo";
      }

      const corLinha = index % 2 === 0 ? "#ffffff" : "#f8f9fa";

      html += `
        <tr style="background: ${corLinha};">
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; font-size: 16px;">${medal}</td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${colaborador.nome}</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6; font-weight: bold; color: ${statusCor};">${colaborador.resumoMensal.mediaHorasDiarias}h</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${colaborador.horasTotais}h</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6; color: ${statusCor}; font-weight: bold;">${statusTexto}</td>
        </tr>`;
    });

    html += `
        </tbody>
      </table>`;

    return html;
  }

  /**
   * Gera gráfico de distribuição de horas por dia
   */
  gerarGraficoDistribuicao(dados) {
    let html =
      '<div style="display: flex; flex-direction: column; gap: 10px;">';

    // Ordenar dias por data
    const diasOrdenados = Object.entries(dados.totaisDiarios).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    // .slice(0, 10); // Mostrar apenas os primeiros 10 dias

    const maxHoras = Math.max(
      ...diasOrdenados.map(([_, dia]) => dia.totalHoras)
    );

    diasOrdenados.forEach(([numeroDia, dia]) => {
      const percentual = maxHoras > 0 ? (dia.totalHoras / maxHoras) * 100 : 0;
      const diaInfo = dados.diasMes.find((d) => d.numero === numeroDia);
      const cor = diaInfo?.ehFeriado
        ? "#dc3545"
        : diaInfo?.ehFimSemana
        ? "#6c757d"
        : "#007bff";

      html += `
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="min-width: 80px; font-weight: bold;">Dia ${numeroDia}</div>
          <div style="flex: 1; background: #f8f9fa; border-radius: 4px; height: 25px; position: relative; overflow: hidden;">
            <div style="background: ${cor}; height: 100%; width: ${percentual}%; transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-size: 12px; font-weight: bold;">
              ${dia.totalHoras > 0 ? `${dia.totalHoras}h` : ""}
            </div>
          </div>
          <div style="min-width: 60px; text-align: right; font-size: 14px; color: #666;">
            ${dia.totalHoras}h
          </div>
        </div>`;
    });

    html += "</div>";

    // Legenda
    html += `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; font-size: 12px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 12px; height: 12px; background: #007bff; border-radius: 4px;"></div>
            <span>Dias úteis</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 12px; height: 12px; background: #6c757d; border-radius: 4px;"></div>
            <span>Fins de semana</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 12px; height: 12px; background: #dc3545; border-radius: 4px;"></div>
            <span>Feriados</span>
          </div>
        </div>
      </div>`;

    return html;
  }

  /**
   * Extrai todos os dados da tabela de folhadehoras
   */
  extrairDadosFolhaDeHoras() {
    jirayalog("Extraindo dados do folhadehoras com nova lógica...");

    const dadosFolhaDeHoras = {
      periodo: this.obterPeriodoAtivo(),
      tipoVisualizacao: null, // Será detectado em extrairCabecalhoDias
      colaboradores: {},
      diasMes: [],
      totaisDiarios: {},
      feriados: [],
      resumoGeral: {
        totalGeral: 0,
        totalColaboradores: 0,
      },
    };

    try {
      // Extrair cabeçalho dos dias
      this.extrairCabecalhoDias(dadosFolhaDeHoras);

      // Extrair dados dos colaboradores
      this.extrairDadosColaboradores(dadosFolhaDeHoras);

      // Extrair totais diários (footer)
      this.extrairTotaisDiarios(dadosFolhaDeHoras);

      // Calcular resumos
      this.calcularResumos(dadosFolhaDeHoras);

      jirayalog("Dados extraídos com sucesso:");
      jirayalog(
        `- Tipo de visualização: ${dadosFolhaDeHoras.tipoVisualizacao}`
      );
      jirayalog(`- Período: ${dadosFolhaDeHoras.periodo}`);
      jirayalog(
        `- Colaboradores: ${
          Object.keys(dadosFolhaDeHoras.colaboradores).length
        }`
      );
      jirayalog(`- Dias no cabeçalho: ${dadosFolhaDeHoras.diasMes.length}`);
      jirayalog("Dados completos:", dadosFolhaDeHoras);
      return dadosFolhaDeHoras;
    } catch (erro) {
      jirayalog("Erro ao extrair dados do folhadehoras:", erro);
      return null;
    }
  }

  /**
   * Obtém o período ativo do folhadehoras
   */
  obterPeriodoAtivo() {
    // Procurar pelo elemento que contém o período
    const $elemento = $(this.aplicacao)
      .find(".sc-bjUoiL.BPZju.sc-kjMGqw.kakwXv")
      .find(".sc-crXcEl.fYWNHZ");

    if ($elemento.length > 0) {
      // Pegar o texto completo do elemento
      const textoCompleto = $elemento.get(0).textContent || $elemento.text();

      // Remover o texto dos spans internos para ficar apenas com o período
      const $spans = $elemento.find("span");
      let textoSpans = "";
      $spans.each(function () {
        textoSpans += $(this).text();
      });

      // O período é o texto que sobra após remover o texto dos spans
      const periodo = textoCompleto.replace(textoSpans, "").trim();

      jirayalog(`Texto completo: "${textoCompleto}"`);
      jirayalog(`Texto dos spans: "${textoSpans}"`);
      jirayalog(`Período extraído: "${periodo}"`);

      // Validar se parece um período válido
      if (
        periodo &&
        (periodo.includes("/") || periodo.includes("-")) &&
        periodo.length > 5
      ) {
        return periodo;
      }
    }

    jirayalog("Período não encontrado no elemento .sc-crXcEl.fYWNHZ");
    return "Período não identificado";
  }

  /**
   * Extrai cabeçalho com os dias do mês
   */
  extrairCabecalhoDias(dadosFolhaDeHoras) {
    const $cabecalhoDias = $(this.aplicacao).find(
      '[data-testid="dateContainer"]'
    );

    // Primeiro detectar o tipo de visualização analisando o cabeçalho
    dadosFolhaDeHoras.tipoVisualizacao = this.detectarTipoVisualizacao();
    jirayalog(
      "Tipo de visualização detectado:",
      dadosFolhaDeHoras.tipoVisualizacao
    );

    $cabecalhoDias.each((indice, elemento) => {
      const $elemento = $(elemento);
      const numeroDia = $elemento.find("div").first().text().trim();
      const nomeDiaAbrev = $elemento
        .find(".tempo-day-header-name")
        .text()
        .trim();

      // Nova lógica: verificar SA/SU no texto do cabeçalho em vez de classes
      let ehFimSemana = false;
      let ehFeriado = false;

      // Verificar se é sábado ou domingo pelo texto
      if (
        nomeDiaAbrev.toUpperCase() === "SA" ||
        nomeDiaAbrev.toUpperCase() === "SU"
      ) {
        ehFimSemana = true;
      }

      // Verificar se é feriado usando múltiplas estratégias
      const $celulaPai = $elemento.closest(".fixedDataTableCellLayout_wrap1");
      const $celulaCabecalho = $elemento.closest('[role="columnheader"]');

      jirayalog(
        `DEBUG Feriado - Dia ${numeroDia}: Elemento classes: ${$elemento.attr(
          "class"
        )}`
      );
      jirayalog(
        `DEBUG Feriado - Dia ${numeroDia}: Pai classes: ${$celulaPai.attr(
          "class"
        )}`
      );
      jirayalog(
        `DEBUG Feriado - Dia ${numeroDia}: Cabeçalho classes: ${$celulaCabecalho.attr(
          "class"
        )}`
      );

      // Múltiplas classes que podem indicar feriado
      const classesFeriado = [
        "holiday_and_non_working_day",
        "public_fixedDataTable_hasHoliday",
        "folhadehoras-holiday",
        "holiday",
        "non_working_day",
      ];

      // Verificar feriado no elemento pai
      for (const classe of classesFeriado) {
        const temClassePai = $celulaPai.hasClass(classe);
        const temClasseElemento = $elemento.hasClass(classe);
        const temClasseCabecalho = $celulaCabecalho.hasClass(classe);

        if (temClassePai || temClasseElemento || temClasseCabecalho) {
          jirayalog(
            `DEBUG Feriado - Dia ${numeroDia}: Encontrada classe "${classe}" - Pai:${temClassePai}, Elemento:${temClasseElemento}, Cabeçalho:${temClasseCabecalho}`
          );
          ehFeriado = true;
          break;
        }
      }

      // Também verificar por atributos data ou títulos que indiquem feriado
      const textoElemento = $elemento.text().toLowerCase();
      const titleElemento = ($elemento.attr("title") || "").toLowerCase();
      const dataAttr =
        $elemento.attr("data-holiday") || $elemento.attr("data-type");

      jirayalog(
        `DEBUG Feriado - Dia ${numeroDia}: Texto: "${textoElemento}", Title: "${titleElemento}", DataAttr: "${dataAttr}"`
      );

      if (
        dataAttr === "holiday" ||
        textoElemento.includes("feriado") ||
        titleElemento.includes("feriado") ||
        titleElemento.includes("holiday")
      ) {
        jirayalog(
          `DEBUG Feriado - Dia ${numeroDia}: Encontrado por texto/atributo`
        );
        ehFeriado = true;
      }

      const infoDia = {
        numero: numeroDia,
        nomeAbrev: nomeDiaAbrev,
        ehFeriado: ehFeriado,
        ehFimSemana: ehFimSemana,
        ehDiaUtil: !ehFeriado && !ehFimSemana,
        periodo: this.extrairPeriodoDia($elemento), // Novo: extrair período se for visualização por semana
      };

      dadosFolhaDeHoras.diasMes.push(infoDia);

      // Log para debug da detecção de feriados
      jirayalog(
        `DEBUG FINAL - Dia ${numeroDia} (${nomeDiaAbrev}): feriado=${ehFeriado}, fimSemana=${ehFimSemana}, diaUtil=${
          !ehFeriado && !ehFimSemana
        }`
      );

      if (ehFeriado) {
        jirayalog(
          `✅ FERIADO DETECTADO no dia ${numeroDia} (${nomeDiaAbrev}) - Adicionando ao array`
        );
        dadosFolhaDeHoras.feriados.push(numeroDia);
      }
    });

    jirayalog(
      `🗓️ RESUMO DETECÇÃO DE FERIADOS: Total encontrados = ${dadosFolhaDeHoras.feriados.length}`
    );
    jirayalog(
      `📋 Feriados detectados: [${dadosFolhaDeHoras.feriados.join(", ")}]`
    );
  }

  /**
   * Detecta o tipo de visualização do folhadehoras baseado no cabeçalho
   */
  detectarTipoVisualizacao() {
    // Usar a mesma lógica da função obterPeriodoAtivo()
    const textoPeriodo = this.obterPeriodoAtivo();

    jirayalog("Detectando tipo de visualização...");
    jirayalog("Texto do período encontrado:", `"${textoPeriodo}"`);

    // Verifica se contém intervalo de datas (ex: "Janeiro 1-7, 2025" ou "1-7 Janeiro 2025")
    if (textoPeriodo.match(/\d+-\d+/)) {
      jirayalog("Tipo detectado: SEMANAL (contém intervalo de datas)");
      return "semanal";
    }

    // Verifica se é apenas mês e ano (ex: "Janeiro 2025" ou "2025 Janeiro")
    if (
      textoPeriodo.match(/^[A-Za-z]+ \d{4}$/) ||
      textoPeriodo.match(/^\d{4} [A-Za-z]+$/)
    ) {
      jirayalog("Tipo detectado: MENSAL (apenas mês e ano)");
      return "mensal";
    }

    // Verifica se é um único dia (ex: "1 de Janeiro, 2025" ou "Janeiro 1, 2025")
    if (
      textoPeriodo.match(/^\d+/) &&
      (textoPeriodo.match(/de|,/) || textoPeriodo.match(/\d{4}/))
    ) {
      jirayalog("Tipo detectado: DIÁRIO (dia específico)");
      return "diario";
    }

    // Default para mensal se não conseguir detectar
    jirayalog(
      "Tipo detectado: MENSAL (fallback - não conseguiu detectar padrão específico)"
    );
    return "mensal";
  }

  /**
   * Extrai período específico do dia (para visualização semanal)
   */
  extrairPeriodoDia($elementoDia) {
    // Para visualização semanal, pode ter informação adicional no cabeçalho
    // Por exemplo: "1-7" indicando que aquele dia representa um período
    const textoCompleto = $elementoDia.text();
    const match = textoCompleto.match(/(\d+)-(\d+)/);

    if (match) {
      return {
        diaInicio: parseInt(match[1]),
        diaFim: parseInt(match[2]),
      };
    }

    return null;
  }

  /**
   * Extrai dados de todos os colaboradores
   */
  extrairDadosColaboradores(dadosFolhaDeHoras) {
    const $linhasColaborador = $(this.aplicacao)
      .find('[data-testid*="-link"]')
      .closest(".fixedDataTableRowLayout_main");

    $linhasColaborador.each((indiceColaborador, linhaColaborador) => {
      const $linha = $(linhaColaborador);

      // Extrair informações básicas do colaborador
      const $linkColaborador = $linha.find('[data-testid*="-link"]').first();
      const nomeCompleto = $linkColaborador.attr("title") || "";
      const idColaborador = $linkColaborador
        .attr("data-testid")
        .replace("-link", "");
      const horasTotais = $linha
        .find(
          ".fixedDataTableCellLayout_alignRight .public_fixedDataTableCell_cellContent"
        )
        .text()
        .trim();

      // Inicializar dados do colaborador
      dadosFolhaDeHoras.colaboradores[idColaborador] = {
        id: idColaborador,
        nome: nomeCompleto,
        horasTotais: parseFloat(horasTotais) || 0,
        horasPorDia: {},
        resumoMensal: {
          diasTrabalhados: 0,
          horasUteis: 0,
          horasExtraordinarias: 0,
          diasAusentes: 0,
          mediaHorasDiarias: 0,
        },
      };

      // Extrair horas de cada dia
      this.extrairHorasDiasColaborador(
        $linha,
        dadosFolhaDeHoras.colaboradores[idColaborador],
        dadosFolhaDeHoras.diasMes,
        dadosFolhaDeHoras.tipoVisualizacao
      );
    });

    dadosFolhaDeHoras.resumoGeral.totalColaboradores = Object.keys(
      dadosFolhaDeHoras.colaboradores
    ).length;
  }

  /**
   * Extrai as horas trabalhadas por dia de um colaborador específico
   * Agora considera o tipo de visualização (diário/semanal/mensal)
   */
  extrairHorasDiasColaborador(
    $linhaColaborador,
    dadosColaborador,
    diasMes,
    tipoVisualizacao
  ) {
    // Buscar TODAS as células de dados do colaborador, incluindo as não visíveis no scroll
    const idColaborador = dadosColaborador.id;
    const $celulasDias = $(this.aplicacao).find(
      `[data-testid="grid-cell"][name*="_${idColaborador}_"]`
    );

    jirayalog(
      `Colaborador ${dadosColaborador.nome}: encontradas ${$celulasDias.length} células de dados`
    );

    $celulasDias.each((indiceDia, celulaDia) => {
      const $celula = $(celulaDia);
      const nomeAttr = $celula.attr("name") || "";
      const conteudoHoras = $celula
        .find(".public_fixedDataTableCell_cellContent")
        .text()
        .trim();

      // Extrair data da célula
      const matchData = nomeAttr.match(/cell_.*_(\d{4}-\d{2}-\d{2})/);
      if (matchData) {
        const dataCompleta = matchData[1];
        const dia = dataCompleta.split("-")[2]; // YYYY-MM-DD -> pegar DD

        const infoDiaCabecalho = diasMes[indiceDia] || {};

        // Detectar feriado diretamente na célula também
        const $wrapper = $celula.closest(".fixedDataTableCellLayout_wrap1");
        const ehFeriadoCelula =
          $wrapper.hasClass("holiday_and_non_working_day") ||
          $wrapper.hasClass("public_fixedDataTable_hasHoliday") ||
          $celula.hasClass("holiday_and_non_working_day") ||
          $celula.hasClass("public_fixedDataTable_hasHoliday");

        // Detectar fim de semana pelo cabeçalho da coluna
        let ehFimSemanaCelula = false;
        const $cabecalhos = $(this.aplicacao).find('div[role="columnheader"]');

        $cabecalhos.each((idx, cabecalho) => {
          const $cab = $(cabecalho);
          const textoCab = $cab.text().trim();
          const matchDiaCabecalho = textoCab.match(/(\d{1,2})/);
          if (matchDiaCabecalho) {
            const diaCabecalho = matchDiaCabecalho[1].padStart(2, "0");
            if (diaCabecalho === dia) {
              ehFimSemanaCelula =
                textoCab.indexOf("Sa") !== -1 || textoCab.indexOf("Su") !== -1;
              return false;
            }
          }
        });

        const ehFeriado = infoDiaCabecalho.ehFeriado || ehFeriadoCelula;
        const ehFimSemana = infoDiaCabecalho.ehFimSemana || ehFimSemanaCelula;
        const ehDiaUtil = !ehFeriado && !ehFimSemana;

        let horasNumerico = conteudoHoras ? parseFloat(conteudoHoras) : 0;
        const horaMaximaDiaria = this.configuracoes.horaMaximaDiaria;
        let horasExtras = 0;
        let horasNormais = horasNumerico;
        if (ehDiaUtil && horasNumerico > horaMaximaDiaria) {
          horasExtras = parseFloat(
            (horasNumerico - horaMaximaDiaria).toFixed(2)
          );
          horasNormais = horaMaximaDiaria;
        }

        // Armazenar dados brutos - cálculo da média será feito em calcularResumos()
        dadosColaborador.horasPorDia[dia] = {
          data: dataCompleta,
          horas: horasNumerico,
          horasNormais: horasNormais,
          horasExtras: horasExtras,
          horaMaximaDiaria: horaMaximaDiaria,
          horasTexto: conteudoHoras || "0",
          ehFeriado: ehFeriado,
          ehFimSemana: ehFimSemana,
          ehDiaUtil: ehDiaUtil,
          temRegistro: conteudoHoras !== "",
          tipoVisualizacao: tipoVisualizacao,
          infoCabecalho: infoDiaCabecalho,
        };

        // Atualizar resumo mensal (adaptado para diferentes visualizações)
        if (horasNumerico > 0) {
          dadosColaborador.resumoMensal.diasTrabalhados++;
          if (ehDiaUtil) {
            dadosColaborador.resumoMensal.horasUteis += horasNormais;
            dadosColaborador.resumoMensal.horasExtrasAcimaLimite =
              (dadosColaborador.resumoMensal.horasExtrasAcimaLimite || 0) +
              horasExtras;
          } else {
            dadosColaborador.resumoMensal.horasExtraordinarias += horasNumerico;
          }
        } else if (ehDiaUtil) {
          dadosColaborador.resumoMensal.diasAusentes++;
        }
      }
    });
  }

  /**
   * Extrai totais diários do footer da tabela
   */
  extrairTotaisDiarios(dadosFolhaDeHoras) {
    const $footerCells = $(this.aplicacao).find('[name^="footerCell_"]');

    $footerCells.each((indice, celula) => {
      const $celula = $(celula);
      const nomeAttr = $celula.attr("name") || "";
      const valorTotal = $celula.text().trim();

      const matchData = nomeAttr.match(/footerCell_(\d{4}-\d{2}-\d{2})/);
      if (matchData) {
        const dataCompleta = matchData[1];
        // Corrigido: extrair dia diretamente da string para evitar problemas de fuso horário
        const dia = dataCompleta.split("-")[2]; // YYYY-MM-DD -> pegar DD

        dadosFolhaDeHoras.totaisDiarios[dia] = {
          data: dataCompleta,
          totalHoras: parseFloat(valorTotal) || 0,
          totalTexto: valorTotal || "0",
        };
      }
    });

    // Extrair total geral
    const $totalGeral = $(this.aplicacao).find(".sc-ihNHHr.eygbys").last();
    dadosFolhaDeHoras.resumoGeral.totalGeral =
      parseFloat($totalGeral.text().trim()) || 0;
  }

  /**
   * Calcula resumos e estatísticas adicionais
   */
  calcularResumos(dadosFolhaDeHoras) {
    jirayalog(
      `Calculando resumos para visualização: ${dadosFolhaDeHoras.tipoVisualizacao}`
    );

    let totalHorasUteis = 0;
    let totalHorasExtraordinarias = 0;
    let totalHorasExtrasAcimaLimite = 0;
    let diasUteisComTrabalho = 0;
    let diasUteisDisponiveis = 0;

    // Detectar se estamos visualizando um período passado, presente ou futuro
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth() + 1; // getMonth() retorna 0-11
    const anoHoje = hoje.getFullYear();

    // Extrair mês/ano do período visualizado através dos dados dos dias
    let mesPeriodo = mesHoje;
    let anoPeriodo = anoHoje;

    // Tentar extrair mês/ano do período (formato "1/Oct/25 - 31/Oct/25")
    const periodo = dadosFolhaDeHoras.periodo || "";
    const matchPeriodo = periodo.match(/(\w+)\/(\d+)/);
    if (matchPeriodo) {
      const mesNome = matchPeriodo[1];
      anoPeriodo = 2000 + parseInt(matchPeriodo[2]); // "25" -> 2025

      // Mapear nome do mês para número
      const meses = {
        Jan: 1,
        Feb: 2,
        Mar: 3,
        Apr: 4,
        May: 5,
        Jun: 6,
        Jul: 7,
        Aug: 8,
        Sep: 9,
        Oct: 10,
        Nov: 11,
        Dec: 12,
      };
      mesPeriodo = meses[mesNome] || mesHoje;
    }

    const ehPeriodoPassado =
      anoPeriodo < anoHoje || (anoPeriodo === anoHoje && mesPeriodo < mesHoje);
    const ehPeriodoAtual = anoPeriodo === anoHoje && mesPeriodo === mesHoje;

    jirayalog(`Data de hoje: ${diaHoje}/${mesHoje}/${anoHoje}`);
    jirayalog(`Período visualizado: ${mesPeriodo}/${anoPeriodo}`);
    jirayalog(
      `É período passado: ${ehPeriodoPassado}, atual: ${ehPeriodoAtual}`
    );

    dadosFolhaDeHoras.diasMes.forEach((dia, indice) => {
      if (dia.ehDiaUtil) {
        const numeroDia = parseInt(dia.numero);

        // Determinar se o dia deve ser contado baseado no período
        let diaJaPassou = false;

        if (ehPeriodoPassado) {
          // Se é um período passado, contar todos os dias úteis
          diaJaPassou = true;
          diasUteisDisponiveis++;
        } else if (ehPeriodoAtual) {
          // Se é o período atual, contar apenas dias que já passaram
          if (dadosFolhaDeHoras.tipoVisualizacao === "semanal" && dia.periodo) {
            // Para visualização semanal, verificar se algum dia do período já passou
            const diaFim = dia.periodo.diaFim;
            if (diaFim < diaHoje) {
              diaJaPassou = true;
              // Contar apenas os dias do período que já passaram
              const diasJaPassados =
                Math.min(diaFim, diaHoje - 1) - dia.periodo.diaInicio + 1;
              diasUteisDisponiveis += Math.max(0, diasJaPassados);
            } else if (dia.periodo.diaInicio < diaHoje) {
              // Período parcial - alguns dias já passaram
              const diasJaPassados = diaHoje - 1 - dia.periodo.diaInicio + 1;
              diasUteisDisponiveis += Math.max(0, diasJaPassados);
              diaJaPassou = true;
            }
          } else {
            // Para visualização diária ou mensal
            if (numeroDia < diaHoje) {
              diasUteisDisponiveis++;
              diaJaPassou = true;
            }
          }
        }
        // Se é período futuro, não contar nenhum dia (diaJaPassou = false)

        jirayalog(
          `Dia ${dia.numero} (${dia.nomeAbrev}): ${
            diaJaPassou ? "já passou" : "futuro"
          } - ${dia.ehDiaUtil ? "útil" : "não útil"}`
        );
      }
    });

    jirayalog(`Total de dias úteis até hoje: ${diasUteisDisponiveis}`);

    // Calcular estatísticas por colaborador
    Object.values(dadosFolhaDeHoras.colaboradores).forEach((colaborador) => {
      totalHorasUteis += colaborador.resumoMensal.horasUteis;
      totalHorasExtraordinarias +=
        colaborador.resumoMensal.horasExtraordinarias;
      totalHorasExtrasAcimaLimite +=
        colaborador.resumoMensal.horasExtrasAcimaLimite || 0;
      if (colaborador.resumoMensal.diasTrabalhados > 0) {
        diasUteisComTrabalho++;
      }

      // Calcular média de horas diárias de forma simplificada
      let mediaHorasDiarias = 0;

      if (dadosFolhaDeHoras.tipoVisualizacao === "mensal") {
        if (diasUteisDisponiveis > 0) {
          mediaHorasDiarias = colaborador.horasTotais / diasUteisDisponiveis;
          jirayalog(
            `${colaborador.nome} - Mensal: ${
              colaborador.horasTotais
            }h / ${diasUteisDisponiveis} dias úteis = ${mediaHorasDiarias.toFixed(
              2
            )}h/dia`
          );
        }
      } else if (dadosFolhaDeHoras.tipoVisualizacao === "semanal") {
        if (diasUteisDisponiveis > 0) {
          mediaHorasDiarias = colaborador.horasTotais / diasUteisDisponiveis;
          jirayalog(
            `${colaborador.nome} - Semanal: ${
              colaborador.horasTotais
            }h / ${diasUteisDisponiveis} dias úteis que já passaram = ${mediaHorasDiarias.toFixed(
              2
            )}h/dia`
          );
        }
      } else {
        if (colaborador.resumoMensal.diasTrabalhados > 0) {
          mediaHorasDiarias =
            colaborador.horasTotais / colaborador.resumoMensal.diasTrabalhados;
          jirayalog(
            `${colaborador.nome} - Diário: ${colaborador.horasTotais}h / ${
              colaborador.resumoMensal.diasTrabalhados
            } dias trabalhados = ${mediaHorasDiarias.toFixed(2)}h/dia`
          );
        }
      }

      colaborador.resumoMensal.mediaHorasDiarias = parseFloat(
        mediaHorasDiarias.toFixed(2)
      );

      // Log de verificação
      jirayalog(
        `RESULTADO FINAL - ${colaborador.nome}: ${colaborador.resumoMensal.mediaHorasDiarias}h/dia (${dadosFolhaDeHoras.tipoVisualizacao})`
      );
    });

    // Adicionar estatísticas gerais
    dadosFolhaDeHoras.resumoGeral.totalHorasUteis = totalHorasUteis;
    dadosFolhaDeHoras.resumoGeral.totalHorasExtraordinarias =
      totalHorasExtraordinarias;
    dadosFolhaDeHoras.resumoGeral.totalHorasExtrasAcimaLimite =
      totalHorasExtrasAcimaLimite;
    dadosFolhaDeHoras.resumoGeral.horaMaximaDiaria =
      this.configuracoes.horaMaximaDiaria;
    dadosFolhaDeHoras.resumoGeral.diasUteisDisponiveis = diasUteisDisponiveis;
    dadosFolhaDeHoras.resumoGeral.diasUteisComTrabalho = diasUteisComTrabalho;
    dadosFolhaDeHoras.resumoGeral.mediaHorasPorDia =
      diasUteisDisponiveis > 0
        ? (totalHorasUteis / diasUteisDisponiveis).toFixed(2)
        : 0;
    dadosFolhaDeHoras.resumoGeral.mediaHorasPorColaborador =
      dadosFolhaDeHoras.resumoGeral.totalColaboradores > 0
        ? (
            dadosFolhaDeHoras.resumoGeral.totalGeral /
            dadosFolhaDeHoras.resumoGeral.totalColaboradores
          ).toFixed(2)
        : 0;
  }

  /**
   * Exporta dados do folhadehoras em diferentes formatos
   */
  exportarDadosFolhaDeHoras(formato = "json") {
    this.executarExportacao(formato);
  }

  /**
   * Exporta dados em formato JSON
   */
  exportarJson(dados) {
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `folhadehoras_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    jirayaTools.ocultarLoading();
    return json;
  }

  /**
   * Exporta resumo em formato texto
   */
  exportarResumo(dados) {
    let resumo = `RESUMO DO FOLHADEHORAS\n`;
    resumo += `Período: ${dados.periodo}\n`;
    resumo += `Data da extração: ${new Date().toLocaleString()}\n\n`;

    resumo += `RESUMO GERAL:\n`;
    resumo += `- Total de colaboradores: ${dados.resumoGeral.totalColaboradores}\n`;
    resumo += `- Total geral de horas: ${dados.resumoGeral.totalGeral}\n`;
    resumo += `- Limite máximo diário: ${dados.resumoGeral.horaMaximaDiaria}h\n`;
    resumo += `- Total horas extras acima do limite: ${
      dados.resumoGeral.totalHorasExtrasAcimaLimite || 0
    }h\n`;
    resumo += `- Total horas úteis: ${dados.resumoGeral.totalHorasUteis}\n`;
    resumo += `- Total horas extraordinárias: ${dados.resumoGeral.totalHorasExtraordinarias}\n`;
    resumo += `- Dias úteis disponíveis: ${dados.resumoGeral.diasUteisDisponiveis}\n`;
    resumo += `- Média de horas por dia: ${dados.resumoGeral.mediaHorasPorDia}\n`;
    resumo += `- Média de horas por colaborador: ${dados.resumoGeral.mediaHorasPorColaborador}\n\n`;

    resumo += `FERIADOS IDENTIFICADOS:\n`;
    if (dados.feriados.length > 0) {
      resumo += `- Dias: ${dados.feriados.join(", ")}\n\n`;
    } else {
      resumo += `- Nenhum feriado identificado no período\n\n`;
    }

    resumo += `DETALHES POR COLABORADOR:\n`;
    Object.values(dados.colaboradores).forEach((colaborador) => {
      resumo += `\n${colaborador.nome} (${colaborador.id}):\n`;
      resumo += `  - Total de horas: ${colaborador.horasTotais}\n`;
      resumo += `  - Média diária: ${colaborador.resumoMensal.mediaHorasDiarias}h\n`;
      resumo += `  - Dias trabalhados: ${colaborador.resumoMensal.diasTrabalhados}\n`;
      resumo += `  - Horas úteis: ${colaborador.resumoMensal.horasUteis}\n`;
      resumo += `  - Horas extras acima do limite: ${
        colaborador.resumoMensal.horasExtrasAcimaLimite || 0
      }h\n`;
      resumo += `  - Horas extraordinárias: ${colaborador.resumoMensal.horasExtraordinarias}\n`;
      resumo += `  - Dias ausentes: ${colaborador.resumoMensal.diasAusentes}\n`;
    });

    const blob = new Blob([resumo], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `resumo_folhadehoras_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return resumo;
  }

  /**
   * Observa elementos visíveis - versão para folhadehoras que funciona de forma independente
   */
  observarElementoFolhaDeHoras(opcoes) {
    const {
      seletor,
      callback,
      nome = seletor,
      aguardarVisibilidade = false,
      maxTentativas = 20,
      intervalo = 100,
      condicao = null,
    } = opcoes;

    // Tenta usar a função global se disponível, senão usa implementação própria
    if (typeof window.observarElementoVisivel === "function") {
      return window.observarElementoVisivel(opcoes);
    }

    // Implementação própria se a função global não estiver disponível
    $(seletor)
      .not("[data-jiraya-folhadehoras-injetado='true']")
      .not("[data-jiraya-folhadehoras-processado='true']")
      .each(function () {
        const elemento = $(this);
        elemento.attr("data-jiraya-folhadehoras-injetado", "true");
        jirayalog(`${nome} detectado (folhadehoras)`);

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
            elemento.attr("data-jiraya-folhadehoras-processado", "true");
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
                elemento.removeAttr("data-jiraya-folhadehoras-injetado");
                elemento.removeAttr("data-jiraya-folhadehoras-processado");
              }
            }
          }, intervalo);
        }
      });
  }

  /**
   * Mostra um modal de loading
   */

  /**
   * Oculta o modal de loading
   */

  /**
   * Mostra uma mensagem de sucesso
   */


  /**
   * Mostra um modal de erro
   */
  mostrarModalErro(titulo, mensagem) {
    const erroHtml = /* html */ `
      <div class="jiraya-erro-modal" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #dc3545;
        border-radius: 8px;
        padding: 25px;
        z-index: 10002;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 500px;
        color: rgb(0, 27, 60);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
          <h3 style="margin: 0; color: #dc3545; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">❌</span>
            ${titulo.charAt(0).toUpperCase() + titulo.slice(1).toLowerCase()}
          </h3>
          <button onclick="$('.jiraya-erro-modal, .jiraya-erro-overlay').remove()" 
                  style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">✖</button>
        </div>
        <div style="margin-bottom: 20px; line-height: 1.5;">
          ${mensagem}
        </div>
        <div style="text-align: center;">
          <button onclick="$('.jiraya-erro-modal, .jiraya-erro-overlay').remove()" 
                  style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 10px 20px; cursor: pointer; font-weight: bold;">
            Ok
          </button>
        </div>
      </div>
      <div class="jiraya-erro-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
      "></div>
    `;

    $("body").append(erroHtml);

    // Fechar ao clicar no overlay
    $(".jiraya-erro-overlay").on("click", () => {
      $(".jiraya-erro-modal, .jiraya-erro-overlay").remove();
    });
  }

  /**
   * Limpeza quando o módulo for descarregado
   */
  limparModulo() {
    // Limpar elementos DOM
    $(".jiraya-folhadehoras-toolbar").remove();
    $(".jiraya-dropdown").remove();
    $(document).off("click.jirayaDropdown");

    // Remover marcadores de observação
    $(".tempo-report-container[data-jiraya-observando]").removeAttr(
      "data-jiraya-observando"
    );

    // Limpar timeouts para evitar vazamentos de memória
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this.pinturaTimeout) {
      clearTimeout(this.pinturaTimeout);
      this.pinturaTimeout = null;
    }

    if (this.pinturaContainerTimeout) {
      clearTimeout(this.pinturaContainerTimeout);
      this.pinturaContainerTimeout = null;
    }

    // Limpar timeouts da função processarDadosColaboradores
    if (
      typeof this.processarDadosColaboradores !== "undefined" &&
      this.processarDadosColaboradores.timeout
    ) {
      clearTimeout(this.processarDadosColaboradores.timeout);
    }

    this.inicializado = false;
    jirayalog("Limpeza completa do módulo folhadehoras executada");
  }

  /**
   * Botao de Copiar os dados dos colaboradores na folha de horas
   */
  processarDadosColaboradores($container) {
    return;
    // Debounce para evitar múltiplas execuções muito próximas
    if (this.processarDadosColaboradores.timeout) {
      clearTimeout(this.processarDadosColaboradores.timeout);
    }

    this.processarDadosColaboradores.timeout = setTimeout(() => {
      jirayalog(
        "Processando dados dos colaboradores no tempo-report-container"
      );

      // Verificar se o container ainda existe e tem conteúdo
      if ($container.length === 0 || !$container.is(":visible")) {
        jirayalog(
          "Container não está visível ou não existe, ignorando processamento"
        );
        return;
      }

      try {
        // Aqui você pode adicionar a lógica específica para extrair dados dos colaboradores
        // Por exemplo, se precisar processar horas, nomes, etc.

        const colaboradores = $container.find(".sc-hbyLVd[data-testid]");
        jirayalog(
          `Encontrados ${colaboradores.length} elementos de colaboradores`
        );

        colaboradores.each(function (index, elemento) {
          const $colaborador = $(elemento);

          // Verificar se já foi processado para evitar reprocessamento
          if (!$colaborador.hasClass("jiraya-processado")) {
            $colaborador.addClass("jiraya-processado");

            // Extrair dados do colaborador (adapte conforme necessário)
            const nome = $colaborador.attr("title").trim();
            const linkHoras = $colaborador.attr("href");
            const horas =
              $colaborador.find(".hours, .time-logged").text().trim() || 0;
            const userId = $colaborador.data("testid").split("-link")[0];

            if (nome || horas) {
              jirayalog(
                `Colaborador processado: ${nome} - ${horas}h (ID: ${userId})`
              );

              // Aqui você pode adicionar funcionalidades específicas como:
              // - Adicionar botões de cópia
              // - Calcular estatísticas
              // - Aplicar formatação
              // - etc.

              // Exemplo: adicionar botão de copiar se não existir
              if ($colaborador.find(".jiraya-btn-copiar").length === 0) {
                const $btnCopiar = $("<button>")
                  .addClass("jiraya-btn-copiar aui-button aui-button-subtle")
                  .text("📋")
                  .attr("style", "padding: 0!important;")
                  .attr("title", "Copiar informações do colaborador")
                  .on("click", function (e) {
                    e.preventDefault();
                    // const dadosColaborador = `Nome: ${nome}\nHoras: ${horas}\nID: ${userId}\nLink horas: ${linkHoras}`;
                    const dadosColaborador = nome;

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(dadosColaborador);
                      jirayalog(`Dados copiados: ${dadosColaborador}`);
                    }
                  });

                $colaborador.append($btnCopiar);
              }
            }
          }
        });
      } catch (erro) {
        jirayalog("Erro ao processar dados dos colaboradores:", erro);
      }
    }, 300); // Aguarda 300ms para evitar múltiplas execuções
  }
}

const jirayaFolhaDeHoras = new JirayaFolhaDeHoras();

window.extrairDadosFolhaDeHoras = () => {
  if (!jirayaFolhaDeHoras.inicializado) {
    jirayalog("FolhaDeHoras não está inicializado");
    return null;
  }
  return jirayaFolhaDeHoras.extrairDadosFolhaDeHoras();
};

window.exportarFolhaDeHorasJson = () => {
  if (!jirayaFolhaDeHoras.inicializado) {
    jirayalog("FolhaDeHoras não está inicializado");
    return null;
  }
  return jirayaFolhaDeHoras.exportarDadosFolhaDeHoras("json");
};

window.exportarFolhaDeHorasCsv = () => {
  if (!jirayaFolhaDeHoras.inicializado) {
    jirayalog("FolhaDeHoras não está inicializado");
    return null;
  }
  return jirayaFolhaDeHoras.exportarDadosFolhaDeHoras("csv");
};
