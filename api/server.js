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
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://mriyckqgacainraogeif.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Middlewares
app.use(express.json());
app.use(cors({
  origin: 'https://primeirospassosdigital.netlify.app' // ou '*' para testes
}));
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
  const { data, error } = await supabase.from('responsavel').select('*')
  if (error) return res.status(500).json({ erro: error.message })
  res.json(data)
})
// 🔵 Buscar usuário por CPF
app.get('/usuarios/:cpf', async (req, res) => {
  const cpf = req.params.cpf
  const { data, error } = await supabase.from('responsavel').select('*').eq('cpf', cpf).single()
  if (error) return res.status(404).json({ erro: 'Usuário não encontrado' })
  res.json(data)
})

// 🟢 Criar novo usuário
app.post('/usuarios', async (req, res) => {
  const { cpf, nome, email, telefone, nome_filho, boletos = [] } = req.body

  if (!cpfValidator.isValid(cpf)) {
    return res.status(400).json({ erro: `CPF inválido: ${cpf}` })
  }

   // Verificar se já existe
  const { data: exists } = await supabase.from('responsavel').select('cpf').eq('cpf', cpf).single()
  if (exists) return res.status(400).json({ erro: 'Usuário já existe' })

  const { data, error } = await supabase.from('responsavel').insert([{ cpf, nome, email, telefone }])
  if (error) return res.status(500).json({ erro: error.message })

  res.status(201).json({ mensagem: 'Responsável criado com sucesso', data })
})


// 🔵 Buscar cobranças 
app.get('/usuarios/:cpf/boletos', async (req, res) => {
  const cpf = req.params.cpf

  const { data, error } = await supabase
    .from('boletos')
    .select('*')
    .eq('responsavelCpf', cpf)

  if (error) return res.status(404).json({ erro: 'Cobranças não encontradas' })

  res.json(data)
})


// 🟢 Criar cobrança Pix
app.post('/usuarios/:cpf/boletos', async (req, res) => {
  const cpf = req.params.cpf
  const { descricao, vencimento, valor } = req.body
  const chavePix = '79683428215'

  // Verifica se o responsável existe
  const { data: responsavel } = await supabase.from('responsavel').select('cpf').eq('cpf', cpf).single()
  if (!responsavel) return res.status(404).json({ erro: 'Usuário não encontrado' })

  const { data, error } = await supabase.from('boletos').insert([{
    responsavelCpf: cpf,
    descricao,
    vencimento,
    valor,
    chavePix,
    status: 'gerado'
  }])

  if (error) return res.status(500).json({ erro: error.message })

  res.status(201).json({ sucesso: true, boleto: data[0] })
})


// 🟡 Atualizar cobrança
app.patch('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params
  const updates = req.body

  const { data: boleto, error: findError } = await supabase
    .from('boletos')
    .select('*')
    .eq('id', id)
    .eq('responsavelCpf', cpf)
    .single()

  if (findError) return res.status(404).json({ erro: 'Cobrança não encontrada' })

  const { data, error } = await supabase
    .from('boletos')
    .update(updates)
    .eq('id', id)
    .eq('responsavelCpf', cpf)

  if (error) return res.status(500).json({ erro: error.message })

  res.json({ sucesso: true, mensagem: 'Cobrança atualizada', cobranca: data[0] })
})


// 🔴 Excluir cobrança
app.delete('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params

  const { data: boleto, error: findError } = await supabase
    .from('boletos')
    .select('*')
    .eq('id', id)
    .eq('responsavelCpf', cpf)
    .single()

  if (findError) return res.status(404).json({ erro: 'Cobrança não encontrada' })

  const { error } = await supabase
    .from('boletos')
    .delete()
    .eq('id', id)
    .eq('responsavelCpf', cpf)

  if (error) return res.status(500).json({ erro: error.message })

  res.json({ sucesso: true, mensagem: 'Cobrança removida' })
})

// 🔁 Iniciar Servidor

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
