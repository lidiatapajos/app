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

 const codigoPix = document.getElementById("pix-code").value;

    new QRCode(document.getElementById("qrcode"), {
      text: codigoPix,
      width: 200,
      height: 200,
      colorDark: "#000",
      colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.H
    });

    function copiarCodigo() {
      const input = document.getElementById("pix-code");
      input.select();
      input.setSelectionRange(0, 99999); // pra mobile
      document.execCommand("copy");

      alert("Código Pix copiado!");
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
