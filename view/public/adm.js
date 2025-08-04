const API_URL = 'https://primeiros-passos-digital.onrender.com';

window.addEventListener("load", async () => {
  const cpf = localStorage.getItem('cpf')?.replace(/\D/g, "");
  const userType = localStorage.getItem('userType');

  if (userType !== 'admin') {
    alert('Acesso negado.');
    window.location.href = '/index.html';
    return;
  }

  const jaConfigurou = await verificarSeConfigExisteNoBackend();
  if (!jaConfigurou) {
    const desejaConfigurar = confirm("Deseja configurar manualmente os boletos?");
    if (desejaConfigurar) {
      window.location.href = '/configurar-boletos.html';
    } else {
      const configPadrao = {
        dia_liberacao: 3,
        dia_vencimento: 28,
        valor: 100
      };
      const sucesso = await salvarConfiguracaoNoBackend(configPadrao);
      if (!sucesso) {
        alert("Erro ao salvar configuração padrão. Contate o suporte.");
      } else {
        alert("Configuração padrão aplicada com sucesso!");
        // RELOAD pra atualizar o estado e evitar loop
        window.location.reload();
      }
    }
  }

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}`);
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const { data } = await res.json();
    const config = data?.configBoletos || null;
    console.log("Configuração atual de boletos:", config);

    await configurarBoletos();
    await carregarUsuarios();

  } catch (err) {
    console.error("Erro ao buscar configurações do adm:", err);
    console.warn("Verifique se o servidor está rodando e a rota está correta.");
  }
});

//configuração dos boletos
async function verificarSeConfigExisteNoBackend() {
  try {
    const res = await fetch(`${API_URL}/configuracao-boletos`, {
      method: 'GET'
    });
    const json = await res.json();
    console.log(json,'----------------- json')
    return json?.configExists || false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function salvarConfiguracaoNoBackend(config) {
  try {
    const res = await fetch(`${API_URL}/configuracao-boletos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function configurarBoletos() {
  const config = localStorage.getItem('configBoletos');
  console.log(config,'valor')
  console.log(!config,'valor booleano')

  if (!config) {
    const desejaConfigurar = confirm("Deseja configurar manualmente os boletos?");
    if (desejaConfigurar) {
      window.location.href = 'configurar-boletos.html';
    } else {
      const padrao = { diaLiberacao: 4, diaVencimento: 28 };
      localStorage.setItem('configBoletos', JSON.stringify(padrao));
    }
  }
}


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
async function salvarConfiguracaoNoBackend(config) {
  const { data, error } = await supabase
    .from('configuracao_boletos')
    .upsert({
      id: 1, // fixa um ID só pra garantir que tem só UMA config (tipo singleton)
      dia_liberacao: config.dia_liberacao,
      dia_vencimento: config.dia_vencimento,
      valor: config.valor
    }, { onConflict: 'id' })

  if (error) {
    console.error('Erro ao salvar config no Supabase:', error)
    return false
  }

  return true
}
 


function logout() {
  localStorage.clear();
  window.location.href = "/index.html";
}

function copiarPix(chave) {
  navigator.clipboard.writeText(chave)
    .then(() => alert("Chave Pix copiada!"))
    .catch(() => alert("Erro ao copiar chave Pix."));
}
// não tá funcionando
function iniciarTutorialAdm() {
  const jaViu = localStorage.getItem("tutorialAdmVisto");
  if (jaViu) return;

  const observer = new MutationObserver(() => {
    const botaoCobranca = document.querySelector('button[onclick^="adicionarCobrancaPix"]');
    const botoesAcoes = document.querySelectorAll('.boleto-acoes button');

    if (botaoCobranca && botoesAcoes.length >= 3) {
      observer.disconnect();
      introJs().setOptions({
        steps: [
          {
            element: botaoCobranca,
            intro: "Aqui você pode gerar uma nova cobrança Pix para o usuário.",
          },
          {
            element: botoesAcoes[0],
            intro: "Este botão permite editar a cobrança.",
          },
          {
            element: botoesAcoes[1],
            intro: "Marque a cobrança como paga por aqui.",
          },
          {
            element: botoesAcoes[2],
            intro: "E aqui você pode excluir a cobrança.",
          }
        ]
      }).start();

      localStorage.setItem("tutorialAdmVisto", "true");
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

iniciarTutorialAdm();

//não tem como testar
async function marcarComoPago(cpf, id) {
  await fetch(`${API_URL}/usuarios/${cpf}/boletos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pago: true })
  });
  await carregarUsuarios();
}
// não tem como testar
async function excluirBoleto(cpf, id) {
  if (!confirm("Excluir boleto?")) return;
  await fetch(`${API_URL}/usuarios/${cpf}/boletos/${id}`, {
    method: "DELETE"
  });
  await carregarUsuarios();
}

// não funciona
async function editarBoletoPrompt(cpf, id) {
  const descricao = prompt("Nova descrição:");
  const vencimento = prompt("Novo vencimento (dd/mm/aaaa):");
  const valor = prompt("Novo valor:");
  if (!descricao || !vencimento || !valor) return;

  await fetch(`${API_URL}/usuarios/${cpf}/boletos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ descricao, vencimento, valor })
  });
  await carregarUsuarios();
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
  console.log('Função cadastrarUsuario chamada.');
  
  const form = document.getElementById('cadastroForm');
  if (!form) {
    console.error('Form não encontrado dentro da função cadastrarUsuario!');
    return;
  }

  const formData = new FormData(form);
  const dados = {
    nome: formData.get('nome'),
    cpf: formData.get('cpf').replace(/\D/g, ''),
    email: formData.get('email'),
    telefone: formData.get('telefone'),
  };

  console.log('Dados extraídos do formulário:', dados);

  // Validação básica
  if (!dados.nome || !dados.cpf || !dados.email) {
    alert('Preencha todos os campos obrigatórios (nome, cpf, email).');
    console.log('Campos obrigatórios não preenchidos.');
    return;
  }

  try {
    console.log(`Enviando dados para API em ${API_URL}/usuarios`);
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    console.log('Resposta da API recebida. Status:', response.status);
    const result = await response.json();
    console.log('Corpo da resposta:', result);

    if (response.ok && !result.erro) {
      alert('Usuário cadastrado com sucesso!');
      console.log('Cadastro OK, redirecionando para adm.html');
      window.location.href = 'adm.html';
    } else {
      alert(`Erro ao cadastrar usuário: ${result.erro || 'Erro desconhecido'}`);
      console.warn('Erro na resposta da API:', result);
    }
  } catch (err) {
    console.error('Erro na conexão com a API:', err);
    alert('Erro na conexão com o servidor.');
  }
}
