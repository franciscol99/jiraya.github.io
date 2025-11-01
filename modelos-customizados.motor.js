class JirayaModeloCustomizado {
  constructor() {
    this.inicializado = false;
  }

  inicializar() {
    if (this.inicializado) return;
    this.inicializado = true;
    jirayalog("Módulo inicializado!");
  }

  abrirModalTemplateCustomizada(caminhoJson, aoFinalizar, idJiraya) {
    // Se o modal está minimizado, apenas maximiza e retorna
    if (
      document.querySelectorAll(
        ".jiraya-modal-btn-maximizar[data-jiraya-id='" + idJiraya + "']"
      ).length > 0
    ) {
      jirayaTools.maximizar(idJiraya);
      return;
    }
    // Se já existe overlay/modal visível, não abre outro
    if (
      document.querySelectorAll(
        ".jiraya-modal-overlay[data-jiraya-id='" + idJiraya + "']"
      ).length > 0
    ) {
      return;
    }
    $.getJSON(caminhoJson, async function (template) {
      var htmlHeaderLinks = "";
      var html = "";
      // Agrupar campos por categoria (ou sem categoria)
      const categorias = {};
      const SEM_CATEGORIA = "__SEM_CATEGORIA__";
      template.campos.forEach((campo) => {
        const cat = campo.categoria || SEM_CATEGORIA;
        if (!categorias[cat]) categorias[cat] = [];
        categorias[cat].push(campo);
      });

      // Montar HTML agrupando por categoria
      for (const catNome in categorias) {
        const campos = categorias[catNome];
        if (catNome !== SEM_CATEGORIA) {
          html += `<div class="jiraya-modal-categoria-campos"><div class="jiraya-modal-categoria-header">${catNome}</div>`;
          html += `<div class="jiraya-modal-categoria-container">`;
        }
        await Promise.all(
          campos.map(async (campo) => {
            html += `<div class="jiraya-modal-container-campos">`;
            html += `<label for="${campo.id}" class="jiraya-modal-label-campo"><b>${campo.nome}</b></label>`;
            html += `<div class='jiraya-textarea-exemplo'><em>${campo.descricao || ''}</em></div>`;
            if (campo.tipo === "radio") {
              html += `<div class="jiraya-modal-opcoes-row">`;
              campo.itens.forEach(function (opcao, idx) {
                html += `<label class="opcao-radio-checklist"><input type="radio" name="${campo.id}" value="${opcao}"> ${opcao}</label>`;
              });
              html += `</div>`;
            } else if (campo.tipo === "checkbox") {
              html += `<div class="jiraya-modal-opcoes-row">`;
              campo.itens.forEach(function (opcao, idx) {
                html += `<label class="opcao-checkbox-checklist"><input type="checkbox" name="${campo.id}" value="${opcao}"> ${opcao}</label>`;
              });
              html += `</div>`;
              if (campo.outroCampo) {
                html += `<input type="text" name="${campo.id}_outro" data-jiraya-input-id="${campo.id}" class="jiraya-modal-input" placeholder="Outra forma de pagamento"/>`;
              }
            } else if (campo.tipo === "textarea") {
              html += `<textarea name="${campo.id}" id="${campo.id}" class="jiraya-modal-textarea" jiraya-auto-resize="true" rows="2"></textarea>`;
            }
            html += `</div>`;
          })
        );
        if (catNome !== SEM_CATEGORIA) {
          html += `</div>`;
          html += `</div>`;
        }
      }

      // Links do header
      (template.linksHeader || []).forEach(function (link) {
        htmlHeaderLinks += `<a href="${link.url}" target="_blank" class="jiraya-link-documentacao">${link.texto}</a>`;
      });

      jirayaTools.modal({
        id: idJiraya,
        tamanho: "md",
        btnFechar: true,
        btnFullScreen: true,
        btnMinimizar: true,
        titulo: template.titulo || "Modelo Customizado",
        /* html */
        headerNavHtml: `${htmlHeaderLinks}
      <label class="opcao-checkbox-checklist"><input type="checkbox" checked="true" name="mostrar-campos-vazios" value="1">Inserir campos vazios</label>`,
        /* html */
        botoesBottomHtml: `<button type="button" id="btn-criar-checklist" class="jiraya-btn-primario">Criar modelo</button>`,
        /* html */
        bodyHtml: `<form id="form-modelos-customizados">${html}</form>`,
        callback: () => {
          setTimeout(() => {
            $(document).on(
              "input",
              ".jiraya-modal-input[name$='_outro']",
              function () {
                var campoID = $(this).data("jiraya-input-id");
                $(`input[name='${campoID}'][value='Outras']`).prop(
                  "checked",
                  true
                );
              }
            );

            $("textarea[jiraya-auto-resize]").each(function () {
              jirayaModeloUtil.configurarRedimensionamentoAutomatico(
                $(this),
                1
              );
            });

            $("#btn-criar-checklist").on("click", function (e) {
              jirayaTools.mostrarLoading("Criando modelo...");
              e.preventDefault();
              const respostas = {};

              template.campos.forEach(function (campo) {
                if (campo.tipo === "radio") {
                  var valor = $(`input[name='${campo.id}']:checked`).val();
                  if (valor !== undefined && valor !== null && valor !== "") {
                    if (valor.indexOf("✅") !== -1) {
                      valor = valor + "";
                    } else if (valor.indexOf("❌") !== -1) {
                      valor = valor + "";
                    } else {
                      valor = "✅  " + valor;
                    }
                  } else {
                    valor = "Não se aplica";
                  }
                  respostas[campo.id] = valor;
                } else if (campo.tipo === "checkbox") {
                  respostas[campo.id] = $(`input[name='${campo.id}']:checked`)
                    .map(function () {
                      var resp = "";
                      if (this.value.indexOf("✅") !== -1) {
                        resp = this.value + "";
                      } else if (this.value.indexOf("❌") !== -1) {
                        resp = this.value + "";
                      } else {
                        resp = "✅  " + this.value + "";
                      }
                      if (campo.outroCampo) {
                        const outro = $(
                          `input[name='${campo.id}_outro']`
                        ).val();
                        if (outro && outro.trim() !== "") {
                          resp += `: ${outro.trim()}`;
                        }
                        // if (outro) respostas[campo.id].push(outro);
                      }

                      return resp;
                    })
                    .get();
                } else if (campo.tipo === "textarea") {
                  respostas[campo.id] = $(`textarea[name='${campo.id}']`).val();
                }
              });

              if (typeof aoFinalizar === "function")
                aoFinalizar(respostas, template);

              setTimeout(() => {
                jirayaTools.fechar(idJiraya, function () {
                  jirayaTools.ocultarLoading();
                });
              }, 500);
            });
          }, 10);
        },
      });
    });
  }

  gerarTemplateCustomizada(respostas, template) {
    let templateHtml = "";
    let campos = template.campos;
    let tipo = template.tipo || "painel";
    const mostrarVazios = $("input[name='mostrar-campos-vazios']").is(":checked");
    // Agrupar campos por categoria
    const categorias = {};
    const SEM_CATEGORIA = "__SEM_CATEGORIA__";
    campos.forEach(function (campo) {
      const cat = campo.categoria || SEM_CATEGORIA;
      if (!categorias[cat]) categorias[cat] = [];
      categorias[cat].push(campo);
    });

    for (const catNome in categorias) {
      const camposCat = categorias[catNome];
      // Se tem categoria, abre painel da categoria
      let categoriaPanelOpen = catNome !== SEM_CATEGORIA && template.separarPorCategoria;
      let panelCampos = "";
      if (tipo === "tabela") {
        template.colunasTabela.split(",").forEach((coluna) => {
          panelCampos += `||${coluna}||`;
        });
         panelCampos += `\n`;
      }
      camposCat.forEach(function (campo) {
        let valor = respostas[campo.id];
        let conteudo = "";
        let stylePanel = "";
        if (campo.bgColor) {
          stylePanel += `|bgColor=${campo.bgColor}`;
        }
        if (campo.titleBGColor) {
          stylePanel += `|titleBGColor=${campo.titleBGColor}`;
        }
        if (Array.isArray(valor)) {
          conteudo = valor.length ? valor.join("\n") : "Não se aplica";
        } else {
          conteudo = valor && valor.trim() ? valor : "Não se aplica";
          if (conteudo.indexOf("http") !== -1) {
            conteudo = `[${conteudo}|${conteudo}]`
          }
        }
        if (!mostrarVazios && conteudo === "Não se aplica") {
          return; // Pula campos vazios se a opção não estiver marcada
        } else {
          if(tipo === "painel") {
             panelCampos += `{panel:title=${campo.nome}${stylePanel}}\n${conteudo}\n{panel}\n\n`;
          } else if(tipo === "tabela") {
             panelCampos += `||{quote}h3.${campo.nome}{quote}|${conteudo}|${campo.descricao}|\n`;
          }
        }
      });
      if (panelCampos) {
        if (categoriaPanelOpen) {
          // template += `{panel:title=${catNome}|bgColor=#ffffff|titleBGColor=red}\n${panelCampos}{panel}\n\n`;
          templateHtml += `{quote}h2.${catNome}{quote}\n${panelCampos}\n{quote}----{quote}\n\n`;
         } else {
          templateHtml += panelCampos;
        }
      }
    }
    return templateHtml;
  }
}

const jirayaModeloCustomizado = new JirayaModeloCustomizado();
