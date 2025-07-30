async function marcarComoPago(cpf, index) {
  await fetch(`${API_URL}/usuarios/${cpf}/boletos/${index}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pago: true }),
  });
  await carregarUsuarios();
}
