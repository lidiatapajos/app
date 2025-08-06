const API_URL = 'https://primeiros-passos-digital.onrender.com';

const supabaseUrl = 'https://mriyckqgacainraogeif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaXlja3FnYWNhaW5yYW9nZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTQzODQsImV4cCI6MjA2OTQ5MDM4NH0.vFwF-gtvH_LTMrN5DJUPYNjxn_EvO7LgDBZwogoRqgI'

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


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('Service Worker registrado:', reg))
    .catch(err => console.error('Erro ao registrar o SW:', err));
}

