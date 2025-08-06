const API_URL = 'https://primeiros-passos-digital.onrender.com';


document.addEventListener("DOMContentLoaded", async () => {
  const cpf = localStorage.getItem('cpf');
  const totalSpan = document.getElementById("total");
  const totalContainer = document.querySelector(".total-container");

  if (!cpf) {
    totalContainer.innerHTML = `<p style="color: red;">CPF não encontrado. Faça login novamente.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/usuarios/${cpf}/boletos`);
    if (!response.ok) throw new Error('Erro ao buscar boletos');

    const boletos = await response.json();

    if (!boletos || boletos.length === 0) {
      totalContainer.innerHTML = `<p style="color: green; font-weight: bold;">Você não possui boletos a pagar no momento.</p>`;
      return;
    }

    let total = boletos.reduce((sum, boleto) => {
      if (!boleto.pago) {
        const valor = parseFloat(String(boleto.valor).replace(',', '.')) || 0;
        return sum + valor;
      }
      return sum;
    }, 0);

    totalSpan.textContent = total.toFixed(2).replace('.', ',');
  } catch (error) {
    console.error(error);
    totalContainer.innerHTML = `<p style="color: red;">Erro ao carregar boletos.</p>`;
  }

  })

function copiarPix(chave) {
  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave Pix copiada!");
  }).catch(() => {
    alert("Erro ao copiar chave Pix.");
  });
}
window.addEventListener('load', () => {
  const section = document.querySelector('.boletos');
  const cpf = localStorage.getItem('cpf');

  if (section && cpf) {
    fetch(`${API_URL}/usuarios/${cpf}/boletos`) // <-- corrigido aqui
      .then(res => {
        console.log("Boletos recebidos:", boletos); //
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
    if (c.pago === false || c.pago === 'false' || c.pago === 0 || c.pago === '0') {
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
