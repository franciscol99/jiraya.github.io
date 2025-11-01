class JirayaBarraFerramentas {
  constructor() {
    this.inicializado = false;
  }

  inicializar() {
    if (this.inicializado) return;

    this.inicializado = true;
  }

  menuSuspenso(opt = {}) {
    if (!opt.elementoPai) {
      jirayalog("menuSuspenso - Elemento pai não informado");
      return;
    }

    const idRandom = opt.idRandom || Math.floor(Math.random() * 1000000);

    // Cria o botão do dropdown
    const botaoMenu = $("<button>")
      .addClass(`btn dropdown-toggle jiraya-menu-template ${opt.class || ''}`)
      .attr("id", `menu-templates-jiraya-${idRandom}`)
      .attr("data-bs-toggle", "dropdown")
      .attr("aria-expanded", "false")
      .html(opt.tituloBotaoMenu || "Menu");

    // Cria o container do menu
    const ul = $("<ul>")
      .addClass("dropdown-menu jiraya-dropdown-menu")
      .attr("aria-labelledby", `menu-templates-jiraya-${idRandom}`);

    // Adiciona os itens ao menu
    if (opt.itens) {
      Object.keys(opt.itens).forEach((key) => {
        const item = opt.itens[key];

        if (item.tipo === "menuSuspenso" && item.subItens) {
          // Submenu
          const liSub = $("<li>").addClass("dropdown-submenu jiraya-submenu");
          const aSub = $("<button>")
            .addClass("dropdown-item dropdown-toggle jiraya-categoria-menu")
            .attr("type", "button")
            .attr("data-bs-toggle", "dropdown")
            .html(item.nome);

          const subUl = $("<ul>").addClass("dropdown-menu jiraya-submenu-itens");
          Object.keys(item.subItens).forEach((subKey) => {
            const subItem = item.subItens[subKey];
            const subLi = $("<li>");
            const subA = $("<a>")
              .addClass("dropdown-item jiraya-submenu-item")
              .attr("href", "#")
              .html(subItem.nome)
              .on("click", (e) => {
                e.preventDefault();
                if (subItem.acao) subItem.acao();
              });
            subLi.append(subA);
            subUl.append(subLi);
          });

          liSub.append(aSub).append(subUl);
          ul.append(liSub);
        } else {
          // Item simples
          const li = $("<li>");
          const a = $("<button>")
            .addClass("dropdown-item jiraya-menu-item")
            .attr("type", "button")
            .html(item.nome)
            .on("click", (e) => {
              e.preventDefault();
              if (item.acao) item.acao();
            });
          li.append(a);
          ul.append(li);
        }
      });
    }

    // Adiciona o botão e o menu ao elemento pai
    const container = $("<div>").addClass("dropdown jiraya-menu-container");
    container.append(botaoMenu).append(ul);
    opt.elementoPai.append(container);
  }

  async garantirMotorCarregamentoInicializado() {
    if (!jirayaMotorModelos.inicializado) {
      try {
        jirayalog("Inicializando sistema de modelos...");
        await jirayaMotorModelos.inicializar();
        return true;
      } catch (erro) {
        jirayalog("Erro ao inicializar motor de templates:", erro);
        return false;
      }
    }
    return true;
  }

  /**
   * Função auxiliar para obter modelo com contexto personalizado
   */
  async obterModelo(chaveModelo, contextoPersonalizado = {}) {
    if (jirayaMotorModelos.inicializado) {
      return await jirayaMotorModelos.processarModelo(chaveModelo);
    } else {
      // Fallback para sistema legado
      return MODELOS[chaveModelo] ? await MODELOS[chaveModelo]() : "";
    }
  }

  /**
   * Função para criar menu de modelos por categorias
   * @param {string} idJiraya - ID único para identificar o menu
   * @param {string} [referencia] - Referência para filtrar áreas (opcional)
   */
  async criarMenuAreasDinamico(idJiraya, referencia = null) {
    // Garante que o motor está inicializado
    const motorInicializado = await this.garantirMotorCarregamentoInicializado();
    if (!motorInicializado) {
      return { botoesDiretos: {}, dropdowns: {} };
    }

    // Se há referência específica, filtra áreas por ela, senão pega todas
    const modelosPorArea = referencia
      ? jirayaMotorModelos.obterAreasPorReferencia(referencia)
      : jirayaMotorModelos.obterModelosPorArea();
    jirayalog(
      "Áreas encontradas" +
        (referencia ? ` para referência '${referencia}'` : "") +
        ":",
      Object.keys(modelosPorArea)
    );

    const botoesDiretos = {}; // Modelos que viram botões diretos
    const dropdowns = {}; // Áreas que viram dropdowns

    // Processa cada área
    Object.keys(modelosPorArea).forEach((areaId) => {
      const area = modelosPorArea[areaId];
      const infoArea = area.info;
      const temModelosDiretos =
        area.modelosDiretos && area.modelosDiretos.length > 0;
      const temCategorias = Object.keys(area.categorias).length > 0;

      // MODELOS DIRETOS - viram botões individuais
      if (temModelosDiretos) {
        area.modelosDiretos.forEach((modelo) => {
          // Integração especial para checklistValidacao
          if (modelo.tipoDinamico && modelo.arquivo) {
            botoesDiretos[`modelo_direto_${modelo.chave}`] = {
              nome: `${infoArea.icone || ""} ${infoArea.nome || nomePadrao}`,
              cor: infoArea.cor || "#666",
              descricao: infoArea.descricao || "",
              tipo: "botaoDireto",
              acao: async function () {
                jirayaModeloCustomizado.abrirModalTemplateCustomizada(
                  chrome.runtime.getURL("modelos/" + modelo.arquivo),
                  function (respostas, campos) {
                    const template =
                      jirayaModeloCustomizado.gerarTemplateCustomizada(
                        respostas,
                        campos
                      );
                    jirayaModeloUtil.inserirTemplate(template, idJiraya);
                  },
                  idJiraya
                );
              },
            };
          } else {
            botoesDiretos[`modelo_direto_${modelo.chave}`] = {
              nome: `${infoArea.icone || ""} ${infoArea.nome || nomePadrao}`,
              cor: infoArea.cor || "#666",
              descricao: infoArea.descricao || "",
              tipo: "botaoDireto",
              acao: async function () {
                const conteudo = await jirayaMotorModelos.processarModelo(
                  modelo.chave
                );
                jirayaModeloUtil.inserirTemplate(conteudo, idJiraya);
              },
            };
          }
        });
      }

      // const nomePadrao = "Modelos";
      const nomePadrao = "";
      // CATEGORIAS - viram dropdown da área
      if (temCategorias) {
        dropdowns[`area_${areaId}`] = {
          nome: `${infoArea.icone || "📁"} ${infoArea.nome || nomePadrao}`,
          tipo: "menuSuspenso",
          cor: infoArea.cor || "#666",
          descricao: infoArea.descricao || "",
          subItens: {},
        };

        // Para cada categoria na área
        Object.keys(area.categorias).forEach((categoriaId) => {
          const categoriaData = area.categorias[categoriaId];
          const categoria = categoriaData.info;
          const modelos = categoriaData.modelos;

          if (modelos.length > 0) {
            // Se há apenas 1 categoria na área, adiciona os modelos diretamente
            if (Object.keys(area.categorias).length === 1) {
              modelos.forEach((modelo) => {
                if (modelo.tipoDinamico && modelo.arquivo) {
                  dropdowns[`area_${areaId}`].subItens[modelo.chave] = {
                    nome: `${modelo.icone || ""} ${modelo.nome || nomePadrao}`,
                    descricao: modelo.descricao || "",
                    acao: async function () {
                      jirayaModeloCustomizado.abrirModalTemplateCustomizada(
                        chrome.runtime.getURL("modelos/" + modelo.arquivo),
                        function (respostas, campos) {
                          const template =
                            jirayaModeloCustomizado.gerarTemplateCustomizada(
                              respostas,
                              campos
                            );
                          jirayaModeloUtil.inserirTemplate(template, idJiraya);
                        },
                        idJiraya
                      );
                    },
                  };
                } else {
                  dropdowns[`area_${areaId}`].subItens[modelo.chave] = {
                    nome: `${modelo.icone || ""} ${modelo.nome || nomePadrao}`,
                    descricao: modelo.descricao || "",
                    separador: categoria.separador,
                    acao: async function () {
                      const conteudo = await jirayaMotorModelos.processarModelo(
                        modelo.chave
                      );
                      jirayaModeloUtil.inserirTemplate(conteudo, idJiraya);
                    },
                  };
                }
              });
            } else {
              // Se há múltiplas categorias, cria submenu para categoria
              dropdowns[`area_${areaId}`].subItens[`categoria_${categoriaId}`] =
                {
                  nome: `${categoria.icone || ""} ${
                    categoria.nome || nomePadrao
                  }`,
                  descricao: categoria.descricao || false,
                  separador: categoria.separador || false,
                  tipo: "menuSuspenso",
                  subItens: {},
                };

              modelos.forEach((modelo) => {
                // Integração especial para checklistValidacao
                if (modelo.tipoDinamico && modelo.arquivo) {
                  dropdowns[`area_${areaId}`].subItens[
                    `categoria_${categoriaId}`
                  ].subItens[modelo.chave] = {
                    nome: `${modelo.icone || ""} ${modelo.nome || nomePadrao}`,
                    descricao: modelo.descricao || "",
                    acao: async function () {
                      jirayaModeloCustomizado.abrirModalTemplateCustomizada(
                        chrome.runtime.getURL("modelos/" + modelo.arquivo),
                        function (respostas, campos) {
                          const template =
                            jirayaModeloCustomizado.gerarTemplateCustomizada(
                              respostas,
                              campos
                            );
                          jirayaModeloUtil.inserirTemplate(template, idJiraya);
                        },
                        idJiraya
                      );
                    },
                  };
                } else {
                  dropdowns[`area_${areaId}`].subItens[
                    `categoria_${categoriaId}`
                  ].subItens[modelo.chave] = {
                    nome: `${modelo.icone || ""} ${modelo.nome || nomePadrao}`,
                    descricao: modelo.descricao || "",
                    acao: async function () {
                      const conteudo = await jirayaMotorModelos.processarModelo(
                        modelo.chave
                      );
                      jirayaModeloUtil.inserirTemplate(conteudo, idJiraya);
                    },
                  };
                }
              });
            }
          }
        });
      }
    });

    // Se não há itens, cria menu de fallback para testar
    if (
      Object.keys(botoesDiretos).length === 0 &&
      Object.keys(dropdowns).length === 0
    ) {
      jirayalog("Nenhum item encontrado, criando fallback");
    }

    return { botoesDiretos, dropdowns };
  }

  /**
   * Cria um botão direto (sem dropdown) para execução imediata
   */
  criarBotaoDireto(opt = {}) {
    const { nome, cor, acao, elementoPai, idRandom, descricao } = opt;
    jirayalog("Criando botão direto:", nome);

    const botaoDireto = $("<a>")
      .attr("href", "#")
      .attr("title", descricao || "")
      .addClass("aui-button aui-button-subtle jiraya-botao-direto")
      .attr("data-jiraya-id", idRandom)
      .html(nome)
      // .css({
      //   "background-color": cor || "#666",
      //   "color": "white",
      //   "border-color": cor || "#666",
      //   "margin-right": "4px",
      //   "border-radius": "3px",
      //   "font-size": "12px",
      //   "font-weight": "500"
      // })
      .on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Verifica se o botão está desabilitado
        if (
          $(this).attr("aria-disabled") === "true" ||
          $(this).hasClass("aui-button-disabled")
        ) {
          jirayalog("Botão direto desabilitado - não executando ação:", nome);
          return;
        }

        jirayalog("Botão direto clicado:", nome);

        if (acao && typeof acao === "function") {
          try {
            acao();
            jirayalog("Ação do botão direto executada:", nome);
          } catch (erro) {
            jirayalog("Erro ao executar ação do botão direto:", erro);
          }
        }
      })
      .on("mouseenter", function () {})
      .on("mouseleave", function () {});

    elementoPai.append(botaoDireto);

    jirayalog("Botão direto criado e adicionado:", nome);
  }

  /**
   * Cria menu específico por referência para campos da modal
   */
  async criarMenuPorReferencia(referencia, textareaElemento, idJiraya) {
    try {
      jirayalog("Criando menu para referência:", referencia);

      await this.garantirMotorCarregamentoInicializado();

      const areasReferencia =
        jirayaMotorModelos.obterAreasPorReferencia(referencia);
      jirayalog(
        "Áreas encontradas para referência:",
        referencia,
        Object.keys(areasReferencia)
      );

      if (Object.keys(areasReferencia).length === 0) {
        jirayalog("Nenhuma área encontrada para referência:", referencia);
        return;
      }

      const elementoPai = $(
        `.barra-jiraya-editor-body[data-jiraya-id=${idJiraya}]`
      );

      // Processa cada área da referência (igual à lógica do criarMenuAreasDinamico)
      Object.keys(areasReferencia).forEach((areaId) => {
        const area = areasReferencia[areaId];
        const infoArea = area.info;
        const temModelosDiretos =
          area.modelosDiretos && area.modelosDiretos.length > 0;
        const temCategorias = Object.keys(area.categorias).length > 0;

        const nomePadrao = "";
        // MODELOS DIRETOS - cria botões individuais (não dropdown)
        if (temModelosDiretos) {
          area.modelosDiretos.forEach((modelo) => {
            this.criarBotaoDiretoTextarea({
              nome: `${infoArea.icone || ""} ${modelo.nome || nomePadrao}`,
              descricao: modelo.descricao || "",
              cor: infoArea.cor || "#666",
              acao: async function () {
                const conteudo = await jirayaMotorModelos.processarModelo(
                  modelo.chave
                );
                jirayaModeloUtil.inserirTemplateTextarea(
                  conteudo,
                  textareaElemento
                );
              },
              elementoPai: elementoPai,
              idRandom: `${idJiraya}_direto_${modelo.chave}`,
            });
          });
        }

        // CATEGORIAS - cria dropdown (só se NÃO tiver modelos diretos ou se tiver ambos)
        if (temCategorias && !temModelosDiretos) {
          const itens = {};

          Object.keys(area.categorias).forEach((categoriaId) => {
            const categoriaData = area.categorias[categoriaId];

            categoriaData.modelos.forEach((modelo) => {
              itens[modelo.chave] = {
                nome: `${modelo.icone || ""} ${modelo.nome || nomePadrao}`,
                descricao: modelo.descricao || "",
                acao: async function () {
                  const conteudo = await jirayaMotorModelos.processarModelo(
                    modelo.chave
                  );
                  jirayaModeloUtil.inserirTemplateTextarea(
                    conteudo,
                    textareaElemento
                  );
                },
              };
            });
          });

          this.menuSuspenso({
            descricao: infoArea.descricao || "",
            tituloBotaoMenu: `${infoArea.icone || ""} ${
              infoArea.nome || nomePadrao
            }`,
            idRandom: `${idJiraya}_${areaId}`,
            elementoPai: elementoPai,
            itens: itens,
            cor: infoArea.cor,
          });
        }
      });
    } catch (erro) {
      jirayalog("Erro ao criar menu por referência:", erro);
    }
  }

  criarBotaoDiretoTextarea(opt = {}) {
    const { nome, cor, acao, elementoPai, idRandom, descricao } = opt;

    jirayalog("Criando botão direto para textarea:", nome);

    const botaoDireto = $("<a>")
      .attr("href", "#")
      .attr("title", descricao || "")
      .addClass("aui-button aui-button-subtle jiraya-botao-direto-textarea")
      .attr("data-jiraya-id", idRandom)
      .html(nome)
      .on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (
          $(this).attr("aria-disabled") === "true" ||
          $(this).hasClass("aui-button-disabled")
        ) {
          return;
        }

        if (acao && typeof acao === "function") {
          try {
            acao();
          } catch (erro) {
            jirayalog("Erro ao executar ação do botão direto textarea:", erro);
          }
        }
      });

    elementoPai.append(botaoDireto);
  }
}

const jirayaBarraFerramentas = new JirayaBarraFerramentas();

// window.simularClickFora = (elemento) => {
//   if (!jirayaBarraFerramentas.inicializado) {
//     return null;
//   }
//   return jirayaBarraFerramentas.simularClickFora(elemento);
// };
