// const Responsavel = require('../models/User')
// import Responsavel_tb from '../database/Responsavel';
const Responsavel = require('../models/Responsavel.js')
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

app.use((req, res, next) => {
  const cpf = req.headers['x-cpf']; // Exemplo: CPF enviado no header
  if (cpf !== '07036102284') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  next();
});

// 🔵 Buscar todos os usuários
  app.get('/usuarios', async (req, res) => {
  const responsavel = new Responsavel()
  const todos_responsaveis = await responsavel.Selecionar_Todos_Responsaveis()
  res.json(todos_responsaveis);
});

// 🔵 Buscar usuário por CPF
app.get('/usuarios/:cpf', async (req, res) => {
  const cpf = req.params.cpf;
  
  const usuarios = new Responsavel();
  const usuario_especifico = await usuarios.Selecionar_Responsavel_Especifico(cpf);
  
  if (!usuario_especifico) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(usuario_especifico);

});

// 🟢 Criar novo usuário
app.post('/usuarios', (req, res) => {
  
  const { cpf, nome, email, telefone, nome_filho, boletos = [] } = req.body;

  // if (!cpfValidator.isValid(cpf)) {
  //   return res.status(400).json({ erro: `CPF inválido ${cpf}`});
  // }

  // if (usuarios.find(u => u.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''))) {
  //   return res.status(400).json({ erro: 'Usuário já existe' });
  // }

  const responsavel = new Responsavel()
  responsavel.Criar_responsavel(nome, cpf, email, telefone, nome_filho)

  res.status(201).json({mesagem: "Responsavel criado com sucesso"})

});


// 🔵 Buscar cobranças (ex-boletos)
app.get('/usuarios/:cpf/cobrancas', (req, res) => {
  const cpf = req.params.cpf;
  const usuario = usuarios.find(u => u.cpf.replace(/\D/g, '') === cpf);

  if (!usuario || !usuario.boletos) {
  }

  res.json(usuario.boletos);
});

// 🟢 Criar cobrança Pix
app.post('/usuarios/:cpf/cobrancas', (req, res) => {
  const { cpf } = req.params;
  const { descricao, vencimento, valor } = req.body;
  const usuarioIndex = usuarios.findIndex(u => u.cpf.replace(/\D/g, '') === cpf);

  if (usuarioIndex === -1) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  const chavePix = '79683428215';
  const qrCodePix = gerarBRCodePix(chavePix, valor, descricao);

  const novaCobranca = {
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

  usuarios[usuarioIndex].boletos.push(novaCobranca);

  res.json({ sucesso: true, mensagem: 'Cobrança criada com sucesso', cobranca: novaCobranca });
});

// 🟡 Atualizar cobrança
app.patch('/usuarios/:cpf/cobrancas/:index', (req, res) => {
  const { cpf, index } = req.params;
  const i = parseInt(index);
  const { pago, descricao, vencimento, valor } = req.body;
  const usuarioIndex = usuarios.findIndex(u => u.cpf.replace(/\D/g, '') === cpf);

  if (usuarioIndex === -1) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  const cobrancas = usuarios[usuarioIndex].boletos || [];

  if (!Array.isArray(cobrancas) || i < 0 || i >= cobrancas.length) {
    return res.status(400).json({ erro: 'Índice inválido' });
  }

  const cobranca = cobrancas[i];
  if (pago !== undefined) cobranca.pago = pago === true;
  if (descricao !== undefined) cobranca.descricao = descricao;
  if (vencimento !== undefined) cobranca.vencimento = vencimento;
  if (valor !== undefined) cobranca.valor = valor;

  res.json({ sucesso: true, mensagem: 'Cobrança atualizada com sucesso' });
});

// 🔴 Excluir cobrança
app.delete('/usuarios/:cpf/cobrancas/:index', (req, res) => {
  const { cpf, index } = req.params;
  const i = parseInt(index);
  const usuarioIndex = usuarios.findIndex(u => u.cpf.replace(/\D/g, '') === cpf);

  if (usuarioIndex === -1) return res.status(404).json({ erro: 'Usuário não encontrado' });

  if (!Array.isArray(usuarios[usuarioIndex].boletos) || i < 0 || i >= usuarios[usuarioIndex].boletos.length) {
    return res.status(400).json({ erro: 'Índice inválido' });
  }

  usuarios[usuarioIndex].boletos.splice(i, 1);


  res.json({ sucesso: true, mensagem: 'Cobrança excluída com sucesso' });
});

// 🔁 Iniciar Servidor

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
