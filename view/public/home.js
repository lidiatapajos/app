 const API_URL = 'https://primeiros-passos-digital.onrender.com';
document.addEventListener("DOMContentLoaded", async () => {
  const cpf = localStorage.getItem('cpf');
  const totalSpan = document.getElementById("total");
  const totalContainer = document.querySelector(".total-container");

  if (!cpf) {
    totalContainer.innerHTML = `<p style="color: red;">CPF não encontrado. Faça login novamente.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/boletos/${cpf}`);
    if (!response.ok) throw new Error('Erro ao buscar boletos');

    const boletos = await response.json();

    if (!boletos || boletos.length === 0) {
      totalContainer.innerHTML = `<p style="color: green; font-weight: bold;">Você não possui boletos a pagar no momento.</p>`;
      return;
    }

    let total = boletos.reduce((sum, boleto) => {
      if (!boleto.pago) {
        const valor = parseFloat((boleto.valor || '0').replace(',', '.')) || 0;
        return sum + valor;
      }
      return sum;
    }, 0);

    totalSpan.textContent = total.toFixed(2).replace('.', ',');
  } catch (error) {
    console.error(error);
    totalContainer.innerHTML = `<p style="color: red;">Erro ao carregar boletos.</p>`;
  }
});

function copiarPix(chave) {
  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave Pix copiada!");
  }).catch(() => {
    alert("Erro ao copiar chave Pix.");
  });
}
