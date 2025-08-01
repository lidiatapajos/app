const API_URL = 'https://primeiros-passos-digital.onrender.com';

async function login() {
  const cpfInput = document.getElementById('cpf');
  const mensagem = document.getElementById('mensagem');

  const cpf = cpfInput.value.replace(/\D/g,''); //limpa a formatação do que for digitado

  if (!cpf) {
    mensagem.textContent = 'Por favor, informe um CPF válido.';
    mensagem.style.color = 'red';
    return;
  }

  mensagem.textContent = 'Verificando...';
  mensagem.style.color = 'black';

  try {
    const res = await fetch(`${API_URL}/usuarios/${cpf}`);
    const result = await res.json();

    if (!result || result.erro) {
      mensagem.textContent = 'CPF não encontrado.';
      mensagem.style.color = 'red';
      return;
    }

    mensagem.textContent = 'Login realizado com sucesso!';
    mensagem.style.color = 'green';
    localStorage.setItem('cpf', cpf);

    const isAdmin = result.type === 'adm';  // espera que o backend retorne essa info

    setTimeout(() => {
      window.location.href = isAdmin ? 'adm.html' : 'home.html';
    }, 500);

  } catch (error) {
    console.error(error);
    mensagem.textContent = 'Erro ao conectar à API.';
    mensagem.style.color = 'red';
  }
}





window.addEventListener('load', () => {
  const section = document.querySelector('.boleto');
  const cpf = localStorage.getItem('cpf');

  if (section && cpf) {
    fetch(`${API_URL}/usuarios/${cpf}/boleto`) // <-- corrigido aqui
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar cobranças');
        return res.json();
      })
      .then(boletos => {
        const lista = section.querySelector('ul');
        lista.innerHTML = '';

        boletos.forEach(boleto => {
          if (boleto.pago) return;

          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${escapeHtml(boleto.descricao)}</strong>: 
            Vencimento: ${escapeHtml(boleto.vencimento)} - 
            Valor: R$ ${escapeHtml(String(boleto.valor))}
            <button>Gerar Pix</button>
          `;

          const btn = li.querySelector('button');
          btn.addEventListener('click', async () => {
            try {
              const params = new URLSearchParams({
                chave: '79683428215', // chave Pix correta
                valor: boleto.valor,
                nome: 'Meu primeiro passos digital',
                cidade: 'Cidade Soure'
              });

              const res = await fetch(`${API_URL}/pix?${params}`);
              const { qr } = await res.json();

              window.open(qr, '_blank');

            } catch (err) {
              alert('Erro ao gerar Pix.');
              console.error(err);
            }
          });

          lista.appendChild(li);
        });

        atualizarTotalPagar(boletos);
      })
      .catch(error => {
        section.innerHTML = '<p>Erro ao carregar cobranças.</p>';
        console.error(error);
      });
  }
});




function atualizarTotalPagar(boletos) {
  const total = boletos.reduce((acc, c) => {
    if (!c.pago) {
      const valor = parseFloat(c.valor.replace(',', '.')) || 0;
      return acc + valor;
    }
    return acc;
  }, 0);

  const totalEl = document.getElementById('total-pagar');
  if (totalEl) {
    totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}



if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('Service Worker registrado:', reg))
    .catch(err => console.error('Erro ao registrar o SW:', err));
}

