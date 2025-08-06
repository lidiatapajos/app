const API_URL = 'https://primeiros-passos-digital.onrender.com';

window.addEventListener("load", async () => {
  const cpf = localStorage.getItem('cpf')?.replace(/\D/g, "");
  const userType = localStorage.getItem('userType');

  if (userType !== 'admin') {
    alert('Acesso negado.');
    window.location.href = '/index.html';
    return;
  }

  if (!cpf) {
    alert('CPF não encontrado. Faça login novamente.');
    window.location.href = '/index.html';
  return;}

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}`);
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const { data } = await res.json();
    //const config = data?.configBoletos || null;
    //console.log("Configuração atual de boletos:", config);


   //  await iniciarTutorialAdm();
    await carregarUsuarios();
   
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
      .filter(u => u.cpf && u.cpf !== localStorage.getItem('cpf'))
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

        if (usuario.boletos?.length) {
          usuario.boletos.forEach((boleto) => {
            const c = document.createElement("div");
            c.className = "boleto";
            c.innerHTML = `
              <div class="boleto-info">
                <strong>${boleto.descricao}</strong><br>
                Vencimento: ${boleto.vencimento} | Valor: R$ ${boleto.valor}<br>
                <span><strong>Pix:</strong> ${boleto.chavePix}</span><br>
                <button onclick="copiarPix('${boleto.chavePix}')">Copiar chave Pix</button>
              </div>
              <div class="boleto-acoes">
                <button onclick="editarBoletoPrompt('${usuario.cpf}', '${boleto.id}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="marcarComoPago('${usuario.cpf}', '${boleto.id}')" title="Marcar como paga">
                  <i class="fas fa-check-circle"></i>
                </button>
                <button onclick="excluirBoleto('${usuario.cpf}', '${boleto.id}')" title="Excluir cobrança">
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
// não tá funcionando
async function adicionarCobrancaPix(cpf) {
  const descricao = prompt("Descrição da cobrança:");
  const vencimento = prompt("Vencimento (dd/mm/aaaa):");
  const valor = prompt("Valor:");
  const chavePix = "79683428215";
  if (!descricao || !vencimento || !valor) return;

  try {
    const res = await fetch(`${API_URL}/usuarios/boletos?cpf=${cpf}`, {
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
 
// funciona
async function excluirUsuario(cpf) {
  const confirmacao = confirm("Tem certeza que deseja excluir este usuário e todos os boletos?");
  if (!confirmacao) return;

  try {
    const resposta = await fetch(`${API_URL}/usuarios/${cpf}`, { method: "DELETE" });

    if (!resposta.ok) {
      const erro = await resposta.json();
      console.error("Erro ao excluir usuário:", erro.mensagem || resposta.statusText);
      alert("Erro ao excluir usuário. Tente novamente.");
      return;
    }

    alert("Usuário excluído com sucesso.");
    await carregarUsuarios();
  } catch (erro) {
    console.error("Erro na requisição:", erro);
    alert("Erro ao excluir usuário. Verifique sua conexão ou tente novamente mais tarde.");
  }
}


// funciona mas não tá enviando pro banco de dados
// async function salvarConfiguracaoNoBackend(config) {
//  const res = await fetch(`${API_URL}/configuracao-boletos `)

//     .from('configuracao_boletos')
//     .upsert({
//       id: 1, // fixa um ID só pra garantir que tem só UMA config (tipo singleton)
//       diaLiberacao: config.dia_liberacao,
//       diaVencimento: config.dia_vencimento,
//       valor: config.valor
//     }, { onConflict: 'id' })

//   if (error) {
//     console.error('Erro ao salvar config no Supabase:', error)
//     return false
//   }

//   return true
// }
 


function logout() {
  localStorage.clear();
  window.location.href = "/index.html";
}

function copiarPix(chave) {
  navigator.clipboard.writeText(chave)
    .then(() => alert("Chave Pix copiada!"))
    .catch(() => alert("Erro ao copiar chave Pix."));
}


async function marcarComoPago(cpf, id) {
  try {
    const res = await fetch(`${API_URL}/usuarios/boletos/${cpf}/${id}/pagar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const erroRes = await res.json();
      throw new Error(erroRes.erro || "Erro ao marcar como pago!");
    }

    const json = await res.json(); // <-- Faltava isso

    console.log("Boleto atualizado:", json.boleto);
    alert(json.mensagem);
    await carregarUsuarios();

  } catch (error) {
    console.error(error);
    alert("Não foi possível marcar como pago. Entre em contato com o técnico para mais informações!");
  }
}


async function excluirBoleto(cpf, id) {
  try {
    if (!confirm("Excluir boleto?")) return;

 const res = await fetch(`${API_URL}/usuarios/${cpf}/boletos/${id}`, {
  method: "DELETE"
});


    if (!res.ok) throw new Error("Erro ao excluir!");

    await carregarUsuarios();
  } catch (error) {
    console.error(error);
    alert("Não foi possível excluir esse boleto. Entre em contato com o técnico para mais informações!");
  }
}


// não funciona
async function editarBoletoPrompt(cpf, id) {
  const descricao = prompt("Nova descrição:");
  const vencimento = prompt("Novo vencimento (dd/mm/aaaa):");
  const valor = prompt("Novo valor:");

  if (!descricao || !vencimento || !valor) return;

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}/boletos/${id}/editar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, vencimento, valor })
    });

    if (!res.ok) throw new Error("Erro ao editar boleto.");

    await carregarUsuarios();
  } catch (error) {
    console.error("Erro ao editar boleto:", error);
    alert("Erro ao editar boleto. Verifique os dados ou tente novamente.");
  }
}

window.addEventListener('load', () => {
  console.log('Página carregada. Verificando query string...');
  if (window.location.search) {
    console.log('Query string detectada:', window.location.search);
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    console.log('Query string removida da URL.');
  }
  
  const form = document.getElementById('cadastroForm');
  if (form) {
    console.log('Form encontrado. Adicionando listener de submit.');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Submit interceptado, chamando cadastrarUsuario...');
      await cadastrarUsuario();
    });
  } else {
    console.error('Form não encontrado!');
  }

  
});



async function cadastrarUsuario() {
  console.log('cadastrarUsuario iniciado');

  const form = document.getElementById('cadastroForm');
  if (!form) {
    console.error(' Form não encontrado!');
    return;
  }

  const formData = new FormData(form);
  const dados = {
    nome: formData.get('nome'),
    cpf: formData.get('cpf')?.replace(/\D/g, ''),
    email: formData.get('email'),
    telefone: formData.get('telefone'),
  };

  console.log('Dados do formulário:', dados);

  // Validação rápida e direta
  if (!dados.nome || !dados.cpf || !dados.email) {
    alert('Preencha os campos obrigatórios: nome, cpf e email.');
    console.log('Campos obrigatórios faltando.');
    return;
  }

  try {
    console.log(`Enviando para API em ${API_URL}/usuarios`);
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const resultado = await response.json();
    console.log('📥 Resposta da API:', resultado);

    if (response.ok && !resultado.erro) {
      alert('✅ Usuário cadastrado com sucesso!');
      console.log('➡️ Redirecionando pra adm.html...');
      window.location.href = 'adm.html';
    } else {
      alert(`Erro ao cadastrar: ${resultado.erro || 'Erro desconhecido'}`);
      console.warn('Resposta de erro da API:', resultado);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    alert('Erro na conexão com o servidor.');
  }
}
