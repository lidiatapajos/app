// 🧾 Função: Gerar código Pix
function gerarBRCodePix(chavePix, valor, descricao) {
  return PixQRCode({
    version: '01',
    key: chavePix,
    name: 'Pagamento Mensalidade',
    city: 'Sao Paulo',
    value: valor,
    description: descricao
  }).payload;
}