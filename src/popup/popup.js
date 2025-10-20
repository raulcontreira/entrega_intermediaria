(() => {
    const titulo = document.getElementById('titulo');
    const botaoOi = document.getElementById('oi');
    const botaoReset = document.getElementById('reset');
    const statusEl = document.getElementById('status');

    const mensagemOriginal = titulo?.textContent || 'Olá, Mundo!';
    let alternado = false;

    function alternarMensagem() {
        if (!titulo) return;
        alternado = !alternado;
        titulo.textContent = alternado ? 'Olá, do botão!' : mensagemOriginal;
        
        // Enviar mensagem para o background script
        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
            if (response && statusEl) {
                statusEl.textContent = `Background está vivo: ${response.time}`;
            }
        });
    }

    function resetar() {
        if (!titulo) return;
        alternado = false;
        titulo.textContent = mensagemOriginal;
        
        // Limpar dados do storage
        chrome.storage.local.clear(() => {
            console.log('Dados limpos do storage');
            if (statusEl) {
                statusEl.textContent = 'Dados resetados!';
            }
        });
    }

    // Event listeners
    botaoOi?.addEventListener('click', alternarMensagem);
    botaoReset?.addEventListener('click', resetar);

    // Carregar dados salvos ao abrir o popup
    chrome.storage.local.get(['installs'], (result) => {
        if (result.installs && statusEl) {
            const installDate = new Date(result.installs);
            statusEl.textContent = `Instalado em: ${installDate.toLocaleDateString()}`;
        }
    });
})();