const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { cpf: cpfValidator } = require('cpf-cnpj-validator');
const { PixQRCode } = require('pix-qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

const usuariosPath = path.join(__dirname, 'usuarios.json');

function lerUsuarios() {
  return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf8');
}

// 🔵 Buscar todos os usuários
app.get('/usuarios', (req, res) => {
  const usuarios = lerUsuarios();
  res.json(usuarios);
});

// 🔵 Buscar usuário por CPF
app.get('/usuarios/:cpf', (req, res) => {
  const cpf = req.params.cpf;
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.cpf.replace(/\D/g, '') === cpf);

  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(usuario);
});

// 🟢 Criar novo usuário
app.post('/usuarios', (req, res) => {
  const { cpf, nome, boletos = [] } = req.body;
  let usuarios = lerUsuarios();

  if (!cpfValidator.isValid(cpf)) {
    return res.status(400).json({ erro: 'CPF inválido' });
  }

  if (usuarios.find(u => u.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''))) {
    return res.status(400).json({ erro: 'Usuário já existe' });
  }

  usuarios.push({ cpf, nome, boletos });
  salvarUsuarios(usuarios);
  res.json({ sucesso: true, mensagem: 'Usuário criado com sucesso' });
});

// 🟢 Gerar BRCode e QR Pix
function gerarBRCodePixPix(chavePix, valor, descricao) {
  return PixQRCode({
    version: '01',
    key: chavePix,
    name: 'Pagamento Mensalidade',
    city: 'Sao Paulo',
    value: valor,
    description: descricao
  }).payload;
}

// 🔵 Buscar boletos
app.get('/boletos/:cpf', (req, res) => {
  const cpf = req.params.cpf;
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.cpf.replace(/\D/g, '') === cpf);

  if (!usuario || !usuario.boletos) {
    return res.status(404).json([]);
  }

  res.json(usuario.boletos);
});

// 🟠 Criar boleto
app.post('/usuarios/:cpf/boletos', (req, res) => {
  const { cpf } = req.params;
  const { descricao, vencimento, valor } = req.body;

  let usuarios = lerUsuarios();
  const usuarioIndex = usuarios.findIndex(u => u.cpf.replace(/\D/g, '') === cpf);

  if (usuarioIndex === -1) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  const chavePix = '79683428215';
  const qrCodePix = gerarBRCodePixPix(chavePix, valor, descricao);

  const novoBoleto = {
    descricao,
    vencimento,
    valor,
    pago: false,
    chavePix,
    qrCodePix
  };

  if (!usuarios[usuarioIndex].boletos) {
    usuarios[usuarioIndex].boletos = [];
  }

  usuarios[usuarioIndex].boletos.push(novoBoleto);
  salvarUsuarios(usuarios);

  res.json({ sucesso: true, mensagem: 'Boleto criado com sucesso', boleto: novoBoleto });
});

// 🟠 Atualizar boleto
app.patch('/usuarios/:cpf/boletos/:index', (req, res) => {
  const { cpf, index } = req.params;
  const i = parseInt(index);
  const { pago, descricao, vencimento, valor } = req.body;

  let usuarios = lerUsuarios();
  const usuarioIndex = usuarios.findIndex(u => u.cpf.replace(/\D/g, '') === cpf);

  if (usuarioIndex === -1) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  const boletos = usuarios[usuarioIndex].boletos || [];

  if (!Array.isArray(boletos) || i < 0 || i >= boletos.length) {
    return res.status(400).json({ erro: 'Índice do boleto inválido' });
  }

  const boleto = boletos[i];
  if (pago !== undefined) boleto.pago = pago === true;
  if (descricao !== undefined) boleto.descricao = descricao;
  if (vencimento !== undefined) boleto.vencimento = vencimento;
  if (valor !== undefined) boleto.valor = valor;

  salvarUsuarios(usuarios);
  res.json({ sucesso: true, mensagem: 'Boleto atualizado com sucesso' });
});

// 🟠 Excluir boleto
app.delete('/usuarios/:cpf/boletos/:index', (req, res) => {
  const { cpf, index } = req.params;
  const i = parseInt(index);

  let usuarios = lerUsuarios();
  const usuarioIndex = usuarios.findIndex(u => u.cpf.replace(/\D/g, '') === cpf);

  if (usuarioIndex === -1) return res.status(404).json({ erro: 'Usuário não encontrado' });

  if (!Array.isArray(usuarios[usuarioIndex].boletos) || i < 0 || i >= usuarios[usuarioIndex].boletos.length) {
    return res.status(400).json({ erro: 'Índice do boleto inválido' });
  }

  usuarios[usuarioIndex].boletos.splice(i, 1);
  salvarUsuarios(usuarios);

  res.json({ sucesso: true, mensagem: 'Boleto excluído com sucesso' });
});

// ======= Iniciar Servidor =======
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
