class JirayaImagemUtil {
 static async getImagemSrc(caminho) {
    const chaveStorage = "jiraya_img_" + caminho;
    // Se já está em sessionStorage, retorna
    const base64Salvo = sessionStorage.getItem(chaveStorage);
    if (base64Salvo) {
      return base64Salvo;
    }
    // Tenta carregar via chrome.runtime.getURL
    try {
      const url = chrome.runtime.getURL(caminho);
      // Carrega como blob
      const resposta = await fetch(url);
      const blob = await resposta.blob();
      // Converte para base64
      const base64 = await JirayaImagemUtil.blobParaBase64(blob);
      // Salva na sessionStorage
      sessionStorage.setItem(chaveStorage, base64);
      return base64;
    } catch (erro) {
      // Se falhar, retorna o caminho original
      return chrome.runtime.getURL(caminho);
    }
  }

  static blobParaBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

const jirayaImagemUtil = new JirayaImagemUtil();
