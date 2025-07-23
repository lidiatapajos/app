const API_URL = "http://localhost:3000";
const cpfAdm = "070.361.022-84".replace(/\D/g, "");

window.addEventListener("load", async () => {
  const cpf = localStorage.getItem("cpf")?.replace(/\D/g, "");

  if (cpf !== cpfAdm) {
    alert("Acesso negado.");
    window.location.href = "home.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/mock/usuarios/${cpfAdm}`);
    const dadosAdm = await res.json();
    const config = dadosAdm.configBoletos || null;
    console.log("Configuração atual de boletos:", config);
  } catch (err) {
    console.error("Erro ao buscar configurações do adm:", err);
    console.warn("Verifique se o servidor está rodando e a rota está correta.");
  }

  await configurarBoletos();
  await gerarCobrancasPixAutomaticas();
  await carregarUsuarios();
});

async function configurarBoletos() {
  const configurado = localStorage.getItem("configBoletos");

  if (!configurado) {
    const desejaConfigurar = confirm(
      "Deseja configurar manualmente as datas dos boletos?"
    );
    if (desejaConfigurar) {
      window.location.href = "configurar-boletos.html";
      return;
    } else {
      const configPadrao = {
        liberacaoDia: 4,
        vencimentoDia: 28,
        valordoBoleto: "200.00",
        descricaoBoleto: "Mensalidade",
      };
      localStorage.setItem("configBoletos", JSON.stringify(configPadrao));
    }
  }
}

async function gerarCobrancasPixAutomaticas() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const res = await fetch(`${API_URL}/mock/usuarios`);
  if (!res.ok) {
    console.error('Erro ao buscar usuários:', res.status);
    return;
  }

  const usuarios = await res.json();
  if (!Array.isArray(usuarios)) {
    console.error('Resposta inesperada. Esperado um array de usuários.');
    return;
  }

  for (const usuario of usuarios) {
    if (usuario.cpf === cpfAdm) continue;

    const jaTemCobrancaMesAtual = usuario.cobrancas?.some((c) => {
      const [dia, mes, ano] = c.vencimento.split("/").map(Number);
      return mes === mesAtual + 1 && ano === anoAtual;
    });

    if (jaTemCobrancaMesAtual) continue;

    const descricao = `Mensalidade ${hoje.toLocaleString("default", {
      month: "long",
    })}`;
    const vencimento = `28/${String(mesAtual + 1).padStart(2, "0")}/${anoAtual}`;
    const valor = "200.00";

    await fetch(`${API_URL}/usuarios/${usuario.cpf}/cobrancas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        vencimento,
        valor,
        chavePix: "79683428215",
      }),
    });
  }
}


async function carregarUsuarios() {
  const container = document.getElementById("usuarios-boletos");
  if (!container) return;

  container.innerHTML = "";

  const res = await fetch(`${API_URL}/usuarios`);
  const usuarios = await res.json();

  usuarios
    .filter((u) => u.cpf && u.cpf !== cpfAdm)
    .forEach((usuario) => {
      const div = document.createElement("div");
      div.className = "usuario";
      div.innerHTML = `
        <h3>CPF: ${usuario.cpf}</h3>
        <p>
          <button onclick="adicionarCobrancaPix('${usuario.cpf}')">
            <i class="fas fa-money-check-alt"></i> Cobr. Pix
          </button>
          <button onclick="excluirUsuario('${usuario.cpf}')">
            <i class="fas fa-user-slash"></i> Excluir Usuário
          </button>
        </p>
      `;

      if (usuario.cobrancas?.length) {
        usuario.cobrancas.forEach((cobranca, i) => {
          const c = document.createElement("div");
          c.className = "boleto"; // mesmo estilo dos antigos
          c.innerHTML = `
            <div class="boleto-info">
              <strong>${cobranca.descricao}</strong><br>
              Vencimento: ${cobranca.vencimento} | Valor: R$ ${cobranca.valor}
              <br>
              <span><strong>Pix:</strong> ${cobranca.chavePix}</span>
              <br>
              <button onclick="copiarPix('${cobranca.chavePix}')">Copiar chave Pix</button>
            </div>
            <div class="boleto-acoes">
              <button onclick="editarCobrancaPix('${usuario.cpf}', ${i})" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="marcarCobrancaComoPaga('${usuario.cpf}', ${i})" title="Marcar como paga">
                <i class="fas fa-check-circle"></i>
              </button>
              <button onclick="excluirCobranca('${usuario.cpf}', ${i})" title="Excluir cobrança">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          `;
          div.appendChild(c);
        });
      } else {
        div.innerHTML += `<p><em>Sem cobranças Pix.</em></p>`;
      }

      container.appendChild(div);
    });
}
async function adicionarCobrancaPix(cpf) {
  const descricao = prompt("Descrição da cobrança:");
  const vencimento = prompt("Vencimento (dd/mm/aaaa):");
  const valor = prompt("Valor:");
  const chavePix = "79683428215"; // fixa

  if (!descricao || !vencimento || !valor) return;

  await fetch(`${API_URL}/usuarios/${cpf}/cobrancas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ descricao, vencimento, valor, chavePix }),
  });

  await carregarUsuarios();
}

async function excluirCobranca(cpf, index) {
  if (!confirm("Excluir cobrança Pix?")) return;

  await fetch(`${API_URL}/usuarios/${cpf}/cobrancas/${index}`, {
    method: "DELETE",
  });

  await carregarUsuarios();
}

async function marcarCobrancaComoPaga(cpf, index) {
  await fetch(`${API_URL}/usuarios/${cpf}/cobrancas/${index}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pago: true }),
  });

  await carregarUsuarios();
}

async function editarCobrancaPix(cpf, index) {
  const descricao = prompt("Nova descrição:");
  const vencimento = prompt("Novo vencimento (dd/mm/aaaa):");
  const valor = prompt("Novo valor:");
  if (!descricao || !vencimento || !valor) return;

  await fetch(`${API_URL}/usuarios/${cpf}/cobrancas/${index}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ descricao, vencimento, valor }),
  });

  await carregarUsuarios();
}

function copiarPix(chave) {
  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave Pix copiada!");
  }).catch(() => {
    alert("Erro ao copiar chave Pix.");
  });
}


function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

async function marcarComoPago(cpf, index) {
  await fetch(`${API_URL}/usuarios/${cpf}/boletos/${index}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pago: true }),
  });
  await carregarUsuarios();
}

async function excluirBoleto(cpf, index) {
  if (!confirm("Excluir boleto?")) return;
  await fetch(`${API_URL}/usuarios/${cpf}/boletos/${index}`, {
    method: "DELETE",
  });
  await carregarUsuarios();
}

async function editarBoletoPrompt(cpf, index) {
  const descricao = prompt("Nova descrição:");
  const vencimento = prompt("Novo vencimento (dd/mm/aaaa):");
  const valor = prompt("Novo valor:");
  if (!descricao || !vencimento || !valor) return;

  await fetch(`${API_URL}/usuarios/${cpf}/boletos/${index}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ descricao, vencimento, valor }),
  });
  await carregarUsuarios();
}

async function adicionarBoleto(cpf) {
  const descricao = prompt("Descrição do boleto:");
  const vencimento = prompt("Vencimento (dd/mm/aaaa):");
  const valor = prompt("Valor:");
  if (!descricao || !vencimento || !valor) return;

  await fetch(`${API_URL}/usuarios/${cpf}/boletos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ descricao, vencimento, valor }),
  });
  await carregarUsuarios();
}

async function adicionarUsuario() {
  const cpf = prompt("CPF do novo usuário:");
  const nome = prompt("Nome do usuário:");
  if (!cpf || !nome) return;

  await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cpf, nome, boletos: [] }),
  });
  await carregarUsuarios();
}

async function excluirUsuario(cpf) {
  if (!confirm("Excluir este usuário e todos os boletos?")) return;

  await fetch(`${API_URL}/usuarios/${cpf}`, { method: "DELETE" });
  await carregarUsuarios();
}
