async function excluirUsuario(cpf) {
  if (!confirm("Excluir este usuário e todos os boletos?")) return;

  await fetch(`${API_URL}/usuarios/${cpf}`, { method: "DELETE" });
  await carregarUsuarios();
}