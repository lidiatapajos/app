 const API_URL = 'https://primeiros-passos-digital.onrender.com';
document.addEventListener("DOMContentLoaded", async () => {
  const cpf = localStorage.getItem('cpf');
  const totalSpan = document.getElementById("total");
  const totalContainer = document.querySelector(".total-container");
 const form = document.getElementById("form-contato");
  if (!form) {
    console.warn("form-contato não encontrado");
    return;
  }
  console.log("Form existe?", document.getElementById("form-contato"));

  const msg = document.getElementById("mensagem");  

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

   form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();

    try {
      const resposta = await fetch(`${API_URL}/usuarios/${cpf}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, telefone })
      });

      const data = await resposta.json();

      if (resposta.ok) {
        msg.textContent = "Informações salvas com sucesso!";
      } else {
        msg.textContent = "Erro ao salvar: " + (data.error || "Erro desconhecido");
      }
    } catch (err) {
      msg.textContent = "Erro de conexão com o servidor.";
      console.error(err);
    }})
})
   



function copiarPix(chave) {
  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave Pix copiada!");
  }).catch(() => {
    alert("Erro ao copiar chave Pix.");
  });
}

