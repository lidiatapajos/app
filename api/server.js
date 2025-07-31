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
const sequelize = require('../database/index.js');


// Middlewares
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());



// Corrigido: pasta 'view/public'
app.use(express.static(path.join(__dirname, '../view/public')));


const usuariosPath = path.join(__dirname, 'usuarios.json');

app.get('/', (req, res) => {
  res.send('API online!');
});



/*app.use((req, res, next) => {
  const cpf = req.headers['x-cpf']; // Exemplo: CPF enviado no header
  if (cpf !== '07036102284') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  next();
});*/

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


// 🔵 Buscar cobranças 
const Boleto = require('../database/Boleto.js'); // ou onde estiver seu arquivo

app.get('/usuarios/:cpf/Boletos', async (req, res) => {
  const cpf = req.params.cpf;

  const usuario = await Responsavel.findOne({
    where: { cpf },
    include: [Boleto]
  });

  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

  res.json(usuario.boletos); // Sequelize coloca como plural se não configurar
});


// 🟢 Criar cobrança Pix
app.post('/usuarios/:cpf/boletos', async (req, res) => {
  const { cpf } = req.params;
  const { descricao, vencimento, valor } = req.body;
  const chavePix = '79683428215';

  const usuario = await Responsavel.findOne({ where: { cpf } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

  const qrCodePix = gerarBRCodePix(chavePix, valor, descricao);

  const nova = await Boleto.create({
    responsavelCpf: cpf,
    descricao,
    vencimento,
    valor,
    chavePix,
    qrCodePix
  });

  res.json({ sucesso: true, boleto: nova });
});


// 🟡 Atualizar cobrança
app.patch('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params;
  const updates = req.body;

  const Boleto = await Boleto.findOne({ where: { id, responsavelCpf: cpf } });
  if (!Boleto) return res.status(404).json({ erro: 'Cobrança não encontrada' });

  await Boleto.update(updates);

  res.json({ sucesso: true, mensagem: 'Cobrança atualizada', cobranca });
});



// 🔴 Excluir cobrança
app.delete('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params;

  const boleto = await boleto.findOne({ where: { id, responsavelCpf: cpf } });
  if (!boleto) return res.status(404).json({ erro: 'Cobrança não encontrada' });

  await boleto.destroy();

  res.json({ sucesso: true, mensagem: 'Cobrança removida' });
});

// 🔁 Iniciar Servidor

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
