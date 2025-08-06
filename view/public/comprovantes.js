  const API_URL = 'https://primeiros-passos-digital.onrender.com';
  document.addEventListener("DOMContentLoaded", async () => {
      const lista = document.getElementById("comprovantes-lista");
      const mensagem = document.getElementById("mensagem");

      // ⚠️ Aqui é onde você simula o CPF do usuário logado
      // Quando tiver login real, substitua por: const cpf = usuarioLogado.cpf;
      const cpf = localStorage.getItem("cpf");

      if (!cpf) {
        mensagem.textContent = "Nenhum usuário logado.";
        return;
      }

      try {
        const res = await fetch(`${API_URL}/comprovantes?cpf=${cpf}`);
        if (!res.ok) throw new Error("Erro ao buscar comprovantes");

        const comprovantes = await res.json();

        if (comprovantes.length === 0) {
          mensagem.textContent = "Nenhum pagamento realizado ainda.";
          return;
        }

        comprovantes.forEach(comp => {
          const li = document.createElement("li");
          li.className = "comprovante";

          const info = document.createElement("div");
          info.className = "info";
          info.innerHTML = `
            <p><strong>${comp.descricao}</strong></p>
            <p>Pago em: ${formatarData(comp.data_pagamento)}</p>
            <p>Valor: R$ ${parseFloat(comp.valor).toFixed(2)}</p>
          `;

          const actions = document.createElement("div");
          actions.className = "actions";
          const btn = document.createElement("button");
          btn.innerHTML = '<i class="fas fa-download"></i> PDF';
          btn.onclick = () => gerarComprovantePDF(comp);
          actions.appendChild(btn);

          li.appendChild(info);
          li.appendChild(actions);
          lista.appendChild(li);
        });

      } catch (err) {
        console.error(err);
        mensagem.textContent = "Erro ao carregar comprovantes.";
      }
    });

    function formatarData(data) {
      if (!data) return "";
      const d = new Date(data);
      return d.toLocaleDateString("pt-BR");
    }

    function gerarComprovantePDF(comp) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Comprovante de Pagamento", 20, 20);

      doc.setFontSize(12);
      doc.text(`Descrição: ${comp.descricao}`, 20, 40);
      doc.text(`Valor: R$ ${parseFloat(comp.valor).toFixed(2)}`, 20, 50);
      doc.text(`Data de pagamento: ${formatarData(comp.data_pagamento)}`, 20, 60);
      doc.text("Este comprovante confirma que o pagamento foi realizado com sucesso.", 20, 80, { maxWidth: 170 });

      doc.save(`comprovante_${comp.descricao}.pdf`);
    }