const API_URL = 'https://primeiros-passos-digital.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
  const cpf = localStorage.getItem("cpf");

  if (!cpf) {
    alert("CPF não encontrado. Redirecionando para login.");
    window.location.href = "/index.html";
    return;
  }

  carregarBoletos(cpf);
});


async function carregarBoletos(cpf) {
  try {
    const res = await fetch(`${API_URL}/usuarios/boletos/${cpf}`);
    const boletos = await res.json();

    const lista = document.getElementById("lista-boletos");
    const msg = document.getElementById("mensagem-boletos");

    lista.innerHTML = "";
    msg.style.display = "none";

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
        <p><strong>${escapeHtml(boleto.descricao)}</strong></p>
        <p>Vencimento: ${escapeHtml(boleto.vencimento)}</p>
        <p>Valor: R$ ${escapeHtml(boleto.valor)}</p>
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
  } catch (err) {
    console.error("Erro ao carregar cobranças:", err);
    const msg = document.getElementById("mensagem-boletos");
    msg.textContent = "Parece que você ainda não possui cobranças pendentes.";
    msg.style.display = "block";
  }
}
async function abrirPagamento(index, boleto) {
  const box = document.getElementById(`pagamento-${index}`);

  if (box.innerHTML.trim() !== "") {
    box.classList.toggle("active"); // abre ou fecha
    return;
  }

  // Aqui usa o valor fixo que tu passou, sem mexer no boleto
  const payloadPix = "00020126330014BR.GOV.BCB.PIX0111796834282155204000053039865802BR5924Reforco Primeiros Passos6005Soure62070503***6304BA3D";

  box.innerHTML = `
    <button class="btn-close" onclick="abrirPagamento(${index}, ${JSON.stringify(boleto).replace(/"/g, '&quot;')})">✖</button>
    <p><strong>Instruções de Pagamento:</strong> Use uma das opções abaixo para quitar sua cobrança.</p>
    <div class="pix-section">
      <img src="/img/qrcode-pix.png" alt="QR Code Pix" style="width: 300px; display: block;" />
      <p><strong>Copia e cola:</strong> <span id="pixcode-${index}">${payloadPix}</span></p>
      <button onclick="copiarPix(${index})">Copiar</button>
    </div>
  `;

  box.classList.add("active");
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}


function copiarPix(index) {
  const el = document.getElementById(`pixcode-${index}`);
  if (!el) return alert("Código não encontrado");

  const text = el.innerText;
  navigator.clipboard.writeText(text)
    .then(() => alert("Código Pix copiado!"))
    .catch(() => alert("Erro ao copiar código Pix"));
}
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}
