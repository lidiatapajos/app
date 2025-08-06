const API_URL = 'https://primeiros-passos-digital.onrender.com';


const cpfAdm = localStorage.getItem('cpfAdm');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('config-form');
  
  // Preencher o formulário com o que já estiver salvo (localStorage)
  const configSalva = JSON.parse(localStorage.getItem('configBoletos'));
  if (configSalva) {
    document.getElementById('diaLiberacao').value = configSalva.diaLiberacao || '';
    document.getElementById('diaVencimento').value = configSalva.diaVencimento || '';
    document.getElementById('valorPadrao').value = configSalva.valorPadrao || '';
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const config = {
      diaLiberacao: parseInt(document.getElementById('diaLiberacao').value),
      diaVencimento: parseInt(document.getElementById('diaVencimento').value),
      valorPadrao:parseInt(document.getElementById('valorPadrao').value),
    };
    
    // Validação simples
    if (
      !config.diaLiberacao || !config.diaVencimento ||
      !config.valorPadrao ) 
      {
        alert('Preencha todos os campos.');
        return;
      }
      
      // Salvar localmente
      localStorage.setItem('configBoletos', JSON.stringify(config));
      
      // Opcional: salvar no backend
      try {
        await fetch(`/configuracao-boletos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify( config)
        });
        
        alert('Configurações salvas com sucesso!');
        console.log("pipipip")
      window.location.href = 'adm.html'; // ou página principal do admin
    } catch (err) {
      console.error('Erro ao salvar no backend:', err);
      alert('Erro ao salvar no servidor.');
    }
  });
});
