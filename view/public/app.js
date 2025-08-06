// const API_URL = 'https://primeiros-passos-digital.onrender.com';
const API_URL = 'http://localhost:3000'

const supabaseUrl = 'https://mriyckqgacainraogeif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaXlja3FnYWNhaW5yYW9nZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTQzODQsImV4cCI6MjA2OTQ5MDM4NH0.vFwF-gtvH_LTMrN5DJUPYNjxn_EvO7LgDBZwogoRqgI'

// AQUI você chama direto do objeto global `supabase`
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


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
     localStorage.setItem('userType', result.type);

    const isAdmin = result.type === 'admin';  // espera que o backend retorne essa info

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
  const section = document.querySelector('.boletos');
  const cpf = localStorage.getItem('cpf');

  if (section && cpf) {
    fetch(`${API_URL}/usuarios/${cpf}/boletos`) // <-- corrigido aqui
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

