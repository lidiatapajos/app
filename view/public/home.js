const API_URL = 'https://primeiros-passos-digital.onrender.com';

document.addEventListener("DOMContentLoaded", async () => {
  const cpf = localStorage.getItem('cpf');
  const totalEl = document.getElementById("total"); // um só elemento pra total
  const totalContainer = document.querySelector(".total-container");

  if (!cpf) {
    totalContainer.innerHTML = `<p style="color: red;">CPF não encontrado. Faça login novamente.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/usuarios/${cpf}/boletos`);
    if (!response.ok) throw new Error('Erro ao buscar boletos');

    const boletos = await response.json();

    if (!boletos || boletos.length === 0) {
      totalContainer.innerHTML = `<p style="color: green; font-weight: bold;">Você não possui boletos a pagar no momento.</p>`;
      if(totalEl) totalEl.textContent = 'R$ 0,00';
      return;
    }

    const total = calcularTotalPagar(boletos);
    if (totalEl) {
      totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
  } catch (error) {
    console.error(error);
    totalContainer.innerHTML = `<p style="color: red;">Erro ao carregar boletos.</p>`;
  }
});

function calcularTotalPagar(boletos) {
  return boletos.reduce((acc, boleto) => {
    if (boleto.pago === false || boleto.pago === 'false' || boleto.pago === 0 || boleto.pago === '0') {
      return acc + (parseFloat(String(boleto.valor).replace(',', '.')) || 0);
    }
    return acc;
  }, 0);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('Service Worker registrado:', reg))
    .catch(err => console.error('Erro ao registrar o SW:', err));
}
