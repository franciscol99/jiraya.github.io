class JirayaMotorModelos {
  constructor() {
    this.modelos = {};
    this.inicializado = false;
  }

  async inicializar() {
    try {
      // Verifica se extensão está funcionando
      if (
        typeof chrome === "undefined" ||
        !chrome.runtime ||
        !chrome.runtime.getURL
      ) {
        throw new Error(
          "Chrome runtime não disponível - recarregue a página ou extensão"
        );
      }

      const endereco = chrome.runtime.getURL("modelos/modelos.json");
      jirayalog("[MotorModelos] Carregando configuração de:", endereco);

      const resposta = await fetch(endereco, { cache: "no-cache" });

      if (!resposta.ok) {
        throw new Error(
          "Erro HTTP: " + resposta.status + " - " + resposta.statusText
        );
      }

      const configuracao = await resposta.json();
      this.configuracao = configuracao;
      this.modelos = configuracao.modelos || {};

      this.inicializado = true;
      jirayalog(
        "[MotorModelos] Sistema inicializado com",
        Object.keys(this.modelos).length,
        "modelos"
      );
    } catch (erro) {
      console.error("[MotorModelos] Erro ao inicializar:", erro);
      throw erro;
    }
  }

  async processarModelo(nomeModelo) {
    try {
      if (!this.inicializado) {
        await this.inicializar();
      }

      const modelo = this.modelos[nomeModelo];
      if (!modelo) {
        throw new Error("Modelo " + nomeModelo + " nao encontrado");
      }

      let conteudo;
      if (modelo.arquivo) {
        conteudo = await this.carregarArquivoModelo(modelo.arquivo);
      } else {
        throw new Error(
          "Modelo " + nomeModelo + " nao possui arquivo definido"
        );
      }

      // Combina variáveis globais com as específicas do modelo
      const variaveisGlobais = this.obterVariaveisGlobais();
      const variaveisDoModelo = this.processarVariaveisModelo(
        modelo.variaveis || {}
      );
      const todasVariaveis = Object.assign(
        {},
        variaveisGlobais,
        variaveisDoModelo
      );

      jirayalog(
        "[MotorModelos] Variáveis do modelo " + nomeModelo + ":",
        todasVariaveis
      );

      var resultado = this.interpolarVariaveis(conteudo, todasVariaveis);

      jirayalog("[MotorModelos] Modelo " + nomeModelo + " processado");

      if (modelo.tipoModelo && modelo.tipoModelo === "text") {
        resultado = `${resultado}`;
      } else  {
        resultado = `\n${resultado}\n`;
      }
      return resultado;
    } catch (erro) {
      console.error(
        "[MotorModelos] Erro ao processar modelo " + nomeModelo + ":",
        erro
      );

      // Mensagem de erro mais específica baseada no tipo de problema
      if (erro.message.includes("Timeout")) {
        return `⏱️ Timeout ao carregar modelo: ${nomeModelo}\n\n🔄 Tente novamente ou recarregue a página (F5)`;
      } else if (
        erro.message.includes("invalidada") ||
        erro.message.includes("runtime")
      ) {
        return `🔌 Extensão desconectada\n\n🔄 Recarregue a página (F5) ou a extensão`;
      } else if (erro.message.includes("HTTP")) {
        return `📂 Arquivo não encontrado: ${nomeModelo}\n\n📝 Verifique se o arquivo .modelo existe`;
      } else {
        return `❌ Erro ao processar: ${nomeModelo}\n\n💡 Erro: ${erro.message}\n🔄 Tente recarregar a página (F5)`;
      }
    }
  }

  processarVariaveisModelo(variaveisDoModelo) {
    const variaveisProcessadas = {};

    jirayalog(
      "[MotorModelos] Processando variáveis do modelo:",
      variaveisDoModelo
    );

    Object.keys(variaveisDoModelo).forEach((chave) => {
      const valor = variaveisDoModelo[chave];
      jirayalog(
        "[MotorModelos] Processando variável",
        chave,
        "com valor:",
        valor
      );

      if (typeof valor === "string" && valor.includes(".")) {
        const valorResolvido = this.resolverReferenciaObjeto(valor);
        variaveisProcessadas[chave] = valorResolvido;
        jirayalog(
          "[MotorModelos] Variável",
          chave,
          "resolvida para:",
          valorResolvido
        );
      } else if (typeof valor === "string" && valor.startsWith("new Date()")) {
        try {
          const valorExecutado = eval(valor);
          variaveisProcessadas[chave] = valorExecutado;
          jirayalog(
            "[MotorModelos] Código de data executado para",
            chave + ":",
            valorExecutado
          );
        } catch (erro) {
          jirayalog("[MotorModelos] Erro ao executar código de data:", erro);
          variaveisProcessadas[chave] = valor;
        }
      } else {
        variaveisProcessadas[chave] = valor;
        jirayalog("[MotorModelos] Valor direto para", chave + ":", valor);
      }
    });

    jirayalog(
      "[MotorModelos] Variáveis processadas finais:",
      variaveisProcessadas
    );
    return variaveisProcessadas;
  }

  async carregarArquivoModelo(caminhoArquivo, tentativas = 3) {
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      try {
        jirayalog(
          `[MotorModelos] Carregando arquivo ${caminhoArquivo} (tentativa ${tentativa}/${tentativas})`
        );

        const caminhoCompleto = "modelos/" + caminhoArquivo;

        // Verifica se chrome.runtime ainda está disponível
        if (typeof chrome === "undefined" || !chrome.runtime) {
          throw new Error(
            "Chrome runtime não disponível - extensão pode estar invalidada"
          );
        }

        const url = chrome.runtime.getURL(caminhoCompleto);
        jirayalog("[MotorModelos] URL gerada:", url);

        // Fetch com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const resposta = await fetch(url, {
          signal: controller.signal,
          cache: "no-cache", // Evita cache antigo
        });

        clearTimeout(timeoutId);

        if (!resposta.ok) {
          throw new Error(
            `Erro HTTP ${resposta.status}: ${resposta.statusText}`
          );
        }

        const conteudo = await resposta.text();
        jirayalog(
          "[MotorModelos] Arquivo carregado com sucesso:",
          caminhoArquivo
        );
        return conteudo;
      } catch (erro) {
        jirayalog(
          `[MotorModelos] Erro na tentativa ${tentativa} para ${caminhoArquivo}:`,
          erro.message
        );

        if (tentativa === tentativas) {
          // Última tentativa - lança erro detalhado
          console.error(
            "[MotorModelos] ERRO FINAL ao carregar arquivo " +
              caminhoArquivo +
              ":",
            erro
          );

          if (erro.name === "AbortError") {
            throw new Error(
              `Timeout ao carregar ${caminhoArquivo} - tente recarregar a página`
            );
          } else if (erro.message.includes("runtime")) {
            throw new Error(
              `Extensão invalidada - recarregue a página (F5) ou a extensão`
            );
          } else {
            throw new Error(
              `Erro ao carregar ${caminhoArquivo}: ${erro.message}`
            );
          }
        } else {
          // Aguarda antes da próxima tentativa
          await new Promise((resolve) => setTimeout(resolve, 1000 * tentativa)); // 1s, 2s, 3s...
        }
      }
    }
  }

  interpolarVariaveis(modelo, variaveis) {
    return modelo.replace(
      /\{\{(\w+)\}\}/g,
      function (correspondencia, nomeVariavel) {
        let valor = variaveis[nomeVariavel];

        if (valor === undefined || valor === null) {
          return correspondencia;
        }

        if (typeof valor === "string" && valor.includes(".")) {
          valor = this.resolverReferenciaObjeto(valor);
        }

        return String(valor);
      }.bind(this)
    );
  }

  resolverReferenciaObjeto(referencia) {
    try {
      jirayalog("[MotorModelos] Resolvendo referência:", referencia);

      const partes = referencia.split(".");

      if (typeof JIRAYA_ELEMENTOS !== "undefined") {
        jirayalog(
          "[MotorModelos] JIRAYA_ELEMENTOS encontrado:",
          JIRAYA_ELEMENTOS
        );

        let valorJIRAYA_ELEMENTOS = JIRAYA_ELEMENTOS;
        let encontrou = true;

        for (const parte of partes) {
          jirayalog(
            "[MotorModelos] Tentando acessar propriedade:",
            parte,
            "em",
            valorJIRAYA_ELEMENTOS
          );

          if (
            valorJIRAYA_ELEMENTOS &&
            typeof valorJIRAYA_ELEMENTOS === "object" &&
            parte in valorJIRAYA_ELEMENTOS
          ) {
            valorJIRAYA_ELEMENTOS = valorJIRAYA_ELEMENTOS[parte];
            jirayalog(
              "[MotorModelos] Propriedade",
              parte,
              "encontrada:",
              valorJIRAYA_ELEMENTOS
            );
          } else {
            jirayalog(
              "[MotorModelos] Propriedade",
              parte,
              "não encontrada em",
              valorJIRAYA_ELEMENTOS
            );
            encontrou = false;
            break;
          }
        }

        if (encontrou) {
          jirayalog(
            "[MotorModelos] Referência resolvida em JIRAYA_ELEMENTOS:",
            valorJIRAYA_ELEMENTOS
          );
          return valorJIRAYA_ELEMENTOS;
        }
      } else {
        jirayalog("[MotorModelos] JIRAYA_ELEMENTOS não está disponível");
      }

      let objeto = window;
      for (const parte of partes) {
        if (objeto && typeof objeto === "object" && parte in objeto) {
          objeto = objeto[parte];
        } else {
          jirayalog(
            "[MotorModelos] Não foi possível resolver referência globalmente:",
            referencia
          );
          return referencia;
        }
      }

      jirayalog("[MotorModelos] Referência resolvida globalmente:", objeto);
      return objeto;
    } catch (erro) {
      jirayalog(
        "[MotorModelos] Erro ao resolver referência " + referencia + ":",
        erro
      );
      return referencia;
    }
  }

  obterVariaveisGlobais() {
    const variaveis = {};

    if (typeof JIRAYA !== "undefined" && JIRAYA) {
      Object.keys(JIRAYA).forEach((item) => {
        jirayalog("[MotorModelos] Adicionando variável global:", item);
        variaveis[item] = JIRAYA[item];
      });
    }

    const agora = new Date();
    variaveis.DATA_ATUAL = agora.toLocaleDateString("pt-BR");
    variaveis.HORA_ATUAL = agora.toLocaleTimeString("pt-BR");
    variaveis.DATETIME_ATUAL = agora.toLocaleString("pt-BR");

    // Calcula VERSAO_ATUAL no formato ANO.MES.00[semana do mes]
    // Exemplo: 25.10.001 para primeira semana de Outubro de 2025
    const ano2 = String(agora.getFullYear()).slice(-2); // dois últimos dígitos do ano
    const mes2 = String(agora.getMonth() + 1).padStart(2, "0"); // mês com 2 dígitos
    const diaMes = agora.getDate();
    const semanaMes = Math.floor((diaMes - 1) / 7) + 1; // semana do mês (1..5)
    variaveis.VERSAO_ATUAL = `${ano2}.${mes2}.00${semanaMes}`;

    jirayalog("[MotorModelos] Variáveis globais obtidas:", variaveis);
    return variaveis;
  }

  obterModelosPorCategoria() {
    const categoriasPorId = {};

    Object.keys(this.modelos).forEach((chaveModelo) => {
      const modelo = this.modelos[chaveModelo];
      const categoriaId = modelo.categoria || "outros";

      if (!categoriasPorId[categoriaId]) {
        categoriasPorId[categoriaId] = [];
      }

      categoriasPorId[categoriaId].push({
        tipoDinamico: modelo.tipoDinamico || false,
        arquivo: modelo.arquivo || false,
        chave: chaveModelo,
        nome: modelo.nome,
        descricao: modelo.descricao,
      });
    });

    return categoriasPorId;
  }

  obterCategoriasDisponiveis() {
    const configuracao = this.configuracao || {};
    return configuracao.categorias || {};
  }

  obterAreasDisponiveis() {
    const configuracao = this.configuracao || {};
    return configuracao.areas || {};
  }

  obterModelosPorArea() {
    const areasPorId = {};
    const categorias = this.obterCategoriasDisponiveis();
    const areas = this.obterAreasDisponiveis();

    const modelosPorCategoria = this.obterModelosPorCategoria();

    Object.keys(areas).forEach((areaId) => {
      const area = areas[areaId];

      areasPorId[areaId] = {
        info: area,
        categorias: {},
        modelosDiretos: [],
      };

      if (area.modelos && Array.isArray(area.modelos)) {
        area.modelos.forEach((modeloId) => {
          const modelo = this.modelos[modeloId];
          if (modelo) {
            areasPorId[areaId].modelosDiretos.push({
              tipoDinamico: modelo.tipoDinamico || false,
              arquivo: modelo.arquivo || false,
              chave: modeloId,
              icone: modelo.icone || false,
              nome: modelo.nome,
              descricao: modelo.descricao || "",
            });
          }
        });
      }

      if (area.categorias && Array.isArray(area.categorias)) {
        area.categorias.forEach((categoriaId) => {
          const categoria = categorias[categoriaId];
          if (
            categoria &&
            modelosPorCategoria[categoriaId] &&
            modelosPorCategoria[categoriaId].length > 0
          ) {
            areasPorId[areaId].categorias[categoriaId] = {
              info: categoria,
              modelos: modelosPorCategoria[categoriaId],
            };
          }
        });
      }
    });

    Object.keys(categorias).forEach((categoriaId) => {
      const categoria = categorias[categoriaId];
      const areaId = categoria.area || "outros";

      if (!areasPorId[areaId]) {
        areasPorId[areaId] = {
          info: areas[areaId] || { nome: areaId, icone: "📁", cor: "#666" },
          categorias: {},
          modelosDiretos: [],
        };
      }

      if (
        !areasPorId[areaId].categorias[categoriaId] &&
        modelosPorCategoria[categoriaId] &&
        modelosPorCategoria[categoriaId].length > 0
      ) {
        areasPorId[areaId].categorias[categoriaId] = {
          info: categoria,
          modelos: modelosPorCategoria[categoriaId],
        };
      }
    });

    jirayalog("[MotorModelos] Modelos agrupados por área:", areasPorId);
    return areasPorId;
  }

  /**
   * Obtém áreas filtradas por referência específica
   * @param {string} referencia - A referência para filtrar (ex: "comentario", "Causa Ocorrência")
   * @returns {Object} Áreas filtradas pela referência
   */
  obterAreasPorReferencia(referencia) {
    if (!this.inicializado) {
      jirayalog(
        "[MotorModelos] Sistema não inicializado para obterAreasPorReferencia"
      );
      return {};
    }

    const todasAreas = this.obterModelosPorArea();
    const areasFiltradasPorReferencia = {};

    Object.keys(todasAreas).forEach((areaId) => {
      const area = todasAreas[areaId];
      const infoArea = area.info;

      if (infoArea.referencia === referencia) {
        areasFiltradasPorReferencia[areaId] = area;
        jirayalog(
          `[MotorModelos] Área '${areaId}' encontrada para referência '${referencia}'`
        );
      }
    });

    jirayalog(
      `[MotorModelos] Total de áreas encontradas para referência '${referencia}':`,
      Object.keys(areasFiltradasPorReferencia).length
    );
    return areasFiltradasPorReferencia;
  }
}

const jirayaMotorModelos = new JirayaMotorModelos();
