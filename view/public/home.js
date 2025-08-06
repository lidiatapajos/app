// const API_URL = 'https://primeiros-passos-digital.onrender.com';
const API_URL = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", async () => {
  const cpf = localStorage.getItem('cpf');
  const totalSpan = document.getElementById("total");
  const totalContainer = document.querySelector(".total-container");
  const form = document.getElementById("form-contato");
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const msg = document.getElementById("mensagem");

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
      return;
    }

    let total = boletos.reduce((sum, boleto) => {
      if (!boleto.pago) {
        const valor = parseFloat(String(boleto.valor).replace(',', '.')) || 0;
        return sum + valor;
      }
      return sum;
    }, 0);

    totalSpan.textContent = total.toFixed(2).replace('.', ',');
  } catch (error) {
    console.error(error);
    totalContainer.innerHTML = `<p style="color: red;">Erro ao carregar boletos.</p>`;
  }

  })

function copiarPix(chave) {
  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave Pix copiada!");
  }).catch(() => {
    alert("Erro ao copiar chave Pix.");
  });
}

