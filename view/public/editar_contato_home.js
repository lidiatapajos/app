document.addEventListener("DOMContentLoaded", () => {
    EditarContato()
});

async function EditarContato(){
    const form = document.getElementById("form-contato");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log('Submit do form acionado');
        const email = document.getElementById("email").value.trim();
        const telefone = document.getElementById("telefone").value.trim();
        const msg = document.getElementById("mensagem")
        const API_URL = 'http://localhost:3000'
        const cpf = localStorage.getItem("cpf")
        
        
        try {
      const resposta = await fetch(`${API_URL}/usuarios/${cpf}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({ email:email, telefone:telefone })
      });

      console.log('Status da resposta:', resposta.status);
      const textoResposta = await resposta.text();
      console.log('Resposta raw:', textoResposta);

      const data = await resposta.json();

      if (resposta.ok) {
        msg.textContent = "Informações salvas com sucesso!";
      } else {
        msg.textContent = "Erro ao salvar: " + (data.error || "Erro desconhecido");
      }
    } catch (err) {
      msg.textContent = "Erro de conexão com o servidor.";
      console.error(err);
    }
})}