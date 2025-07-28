const API_URL = 'https://app-70zj.onrender.com';
const cpfAdm = localStorage.getItem('cpfAdm')?.replace(/\D/g, "");

// Função principal para executar no carregamento da página
window.addEventListener("load", async () => {
  const cpf = localStorage.getItem("cpf")?.replace(/\D/g, "");

  if (cpf !== cpfAdm) {
    alert("Acesso negado.");
    window.location.href = "../view/index.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpfAdm}`);
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const dadosAdm = await res.json();
    const config = dadosAdm.configBoletos || null;
    console.log("Configuração atual de boletos:", config);

    // Agora chama as funções que devem rodar ao carregar
    await configurarBoletos();
    await gerarCobrancasPixAutomaticas();
    await carregarUsuarios();
    await iniciarTutorialAdm();

  } catch (err) {
    console.error("Erro ao buscar configurações do adm:", err);
    console.warn("Verifique se o servidor está rodando e a rota está correta.");
  }
});

async function carregarUsuarios() {
  const container = document.getElementById("usuarios-boletos");
  if (!container) return;

  container.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/usuarios`);
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const usuarios = await res.json();

    usuarios
      .filter(u => u.cpf && u.cpf !== cpfAdm)
      .forEach(usuario => {
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
            c.className = "boleto"; // estilo antigo dos boletos
            c.innerHTML = `
              <div class="boleto-info">
                <strong>${cobranca.descricao}</strong><br>
                Vencimento: ${cobranca.vencimento} | Valor: R$ ${cobranca.valor}
                <br>
                <span><strong>Pix:</strong> ${cobranca.chavePix}</span><br>
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

  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

async function adicionarCobrancaPix(cpf) {
  const descricao = prompt("Descrição da cobrança:");
  const vencimento = prompt("Vencimento (dd/mm/aaaa):");
  const valor = prompt("Valor:");
  const chavePix = "79683428215"; // fixa

  if (!descricao || !vencimento || !valor) return;

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}/cobrancas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, vencimento, valor, chavePix }),
    });

    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    await carregarUsuarios();
  } catch (err) {
    console.error("Erro ao adicionar cobrança Pix:", err);
  }
}

async function excluirCobranca(cpf, index) {
  if (!confirm("Excluir cobrança Pix?")) return;

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}/cobrancas/${index}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    await carregarUsuarios();
  } catch (err) {
    console.error("Erro ao excluir cobrança:", err);
  }
}

async function marcarCobrancaComoPaga(cpf, index) {
  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}/cobrancas/${index}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago: true }),
    });

    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    await carregarUsuarios();
  } catch (err) {
    console.error("Erro ao marcar cobrança como paga:", err);
  }
}

async function editarCobrancaPix(cpf, index) {
  const descricao = prompt("Nova descrição:");
  const vencimento = prompt("Novo vencimento (dd/mm/aaaa):");
  const valor = prompt("Novo valor:");
  if (!descricao || !vencimento || !valor) return;

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}/cobrancas/${index}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, vencimento, valor }),
    });

    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    await carregarUsuarios();
  } catch (err) {
    console.error("Erro ao editar cobrança Pix:", err);
  }
}

function copiarPix(chave) {
  navigator.clipboard.writeText(chave)
    .then(() => alert("Chave Pix copiada!"))
    .catch(() => alert("Erro ao copiar chave Pix."));
}

async function iniciarTutorialAdm() {
  // lógica do tutorial aqui
}

async function configurarBoletos() {
  // lógica para configurar boletos aqui
}

async function gerarCobrancasPixAutomaticas() {
  //lógica para gerar cobranças Pix automaticamente aqui
}


function logout() {
  localStorage.clear();
  window.location.href = "index.html";
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
  console.log("vai ate aqui")
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

