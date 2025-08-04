document.addEventListener("DOMContentLoaded", () => {
  const cpf = localStorage.getItem("cpf");

  if (!cpf) {
    alert("CPF não encontrado. Redirecionando para login.");
    window.location.href = "index.html";
    return;
  }

  fetch(`https://primeiros-passos-digital.onrender.com/usuarios/${cpf}/boletos`)
    .then((res) => res.json())
    .then((boletos) => {
      const lista = document.getElementById("lista-boletos");
      const msg = document.getElementById("mensagem-boletos");

      if (!Array.isArray(boletos) || boletos.length === 0) {
        msg.style.display = "block";
        return;
      }

      boletos.forEach((boleto, index) => {
        const li = document.createElement("li");
        li.classList.add("boleto");

        const info = document.createElement("div");
        info.classList.add("info");
        info.innerHTML = `
                <p><strong>${boleto.descricao}</strong></p>
                <p>Vencimento: ${boleto.vencimento}</p>
                <p>Valor: R$ ${boleto.valor}</p>
              `;

        const actions = document.createElement("div");
        actions.classList.add("actions");
        const btn = document.createElement("button");
        btn.classList.add("btn-pagar");
        btn.innerText = "Pagar";
        btn.onclick = () => abrirPagamento(index, boleto);

        const paymentBox = document.createElement("div");
        paymentBox.classList.add("payment-box");
        paymentBox.id = `pagamento-${index}`;

        actions.appendChild(btn);
        li.appendChild(info);
        li.appendChild(actions);
        li.appendChild(paymentBox);
        lista.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("Erro ao carregar cobranças:", err)
      document.getElementById("mensagem-boletos").textContent =
        "Parece que você ainda não possui cobranças pendentes.";
      document.getElementById("mensagem-boletos").style.display = "block";
    });
});

function abrirPagamento(index, boleto) {
  const box = document.getElementById(`pagamento-${index}`);
  if (box.innerHTML.trim() !== "") {
    box.classList.toggle("active");
    return;
  }

  const valor = boleto.valor.toString().replace(/[^\d,\.]/g, "").replace(",", ".");

  fetch(
    `https://primeiros-passos-digital.onrender.com/pix?chave=contato@boletos.com&valor=${valor}&nome=Cliente%20App&cidade=Sao%20Paulo`
  )
    .then((res) => res.json())
    .then((data) => {
      box.innerHTML = `
              <button class="btn-close" onclick="abrirPagamento(${index}, ${JSON.stringify(
        boleto
      ).replace(/"/g, "&quot;")})">✖</button>
              <p><strong>Instruções de Pagamento:</strong> Use uma das opções abaixo para quitar sua cobrança.</p>
              <div class="pix-section">
                <img src="${data.qr}" alt="QR Code PIX" />
                <p class="pix-key">Chave PIX: </p>
                <p class="pix-key"><strong>BR Code:</strong> <small>${data.brcode}</small></p>
              </div>
            `;
      box.classList.add("active");
    });
}