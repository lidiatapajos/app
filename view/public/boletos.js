const API_URL = 'https://primeiros-passos-digital.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
  const cpf = localStorage.getItem("cpf");

  if (!cpf) {
    alert("CPF não encontrado. Redirecionando para login.");
    window.location.href = "/index.html";
    return;
  }

  fetch(`${API_URL}/usuarios/${cpf}/boletos`)
    .then((res) => res.json())
    .then((boletos) => {
      const lista = document.getElementById("lista-boletos");
      const msg = document.getElementById("mensagem-boletos");

      lista.innerHTML = "";   // limpa lista ao iniciar
      msg.style.display = "none"; // esconde mensagem inicialmente

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
      console.error("Erro ao carregar cobranças:", err);
      const msg = document.getElementById("mensagem-boletos");
      msg.textContent = "Parece que você ainda não possui cobranças pendentes.";
      msg.style.display = "block";
    });
});


function abrirPagamento(index, boleto) {
  const box = document.getElementById(`pagamento-${index}`);

  if (box.innerHTML.trim() !== "") {
    if (box.classList.contains("active")) {
      box.classList.remove("active"); // fechar
    } else {
      box.classList.add("active"); // abrir
    }
    return;
  }

  const valor = boleto.valor.toString().replace(/[^\d,\.]/g, "").replace(",", ".");
  
  fetch(`${API_URL}/pix?valor=${valor}&nome=Cliente&cidade=Soure`)
    .then(res => res.json())
    .then(dados => {
      box.innerHTML = `
        <button class="btn-close" onclick="abrirPagamento(${index}, ${JSON.stringify(
          boleto
        ).replace(/"/g, "&quot;")})">✖</button>
        <p><strong>Instruções de Pagamento:</strong> Use uma das opções abaixo para quitar sua cobrança.</p>
        <div class="pix-section">
          <img src="${dados.qr}" alt="QR Code Pix">
          <p><strong>Copia e cola:</strong> ${dados.brcode}</p>
        </div>
      `;
      box.classList.add("active");
      box.scrollIntoView({ behavior: "smooth", block: "start" }); // rola para a caixa, útil em telas pequenas
    })
    .catch(err => {
      console.error("Erro ao gerar Pix:", err);
      alert("Erro ao gerar QR Code Pix");
    });
}
