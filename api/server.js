
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { cpf: cpfValidator } = require('cpf-cnpj-validator');
const { PixQRCode } = require('pix-qrcode');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;
const supabaseUrl = 'https://mriyckqgacainraogeif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaXlja3FnYWNhaW5yYW9nZWlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkxNDM4NCwiZXhwIjoyMDY5NDkwMzg0fQ.aP5bLKZYLMBec-rRaNYPfcJkLw1NhibgznhBduRP9DU';
const supabase = createClient(supabaseUrl, supabaseKey);
// Middlewares
app.use(express.json());
app.use(cors({
  origin: 'https://primeirospassosdigital.netlify.app'
}));

// Corrigido: pasta 'view/public'
app.use(express.static(path.join(__dirname, '../view/public')));
app.get('/usuarios', async (req, res) => {
  console.log("🔄 Rota /usuarios acessada");
  const { data, error } = await supabase
    .from('responsaveis')
    .select('*');

  if (error) {
    console.error("Erro ao buscar usuários:", error.message);
    return res.status(500).json({ erro: true, mensagem: 'Erro ao buscar usuários.' });
  }

  res.json(data);
});

// Rota simples
app.get('/usuarios/:cpf', async (req, res) => {
  const cpf = req.params.cpf.replace(/\D/g, '');
  console.log("🔍 Buscando CPF:", cpf);

  // Tenta achar na tabela admins
  let { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('cpf', cpf)
    .single();

  if (!adminError && adminData) {
    return res.json({ erro: false, data: adminData, type: 'admin' });
  }

  // Se não achou admin, tenta na tabela usuarios
  let { data: userData, error: userError } = await supabase
    .from('responsaveis')
    .select('*')
    .eq('cpf', cpf)
    .single();

  if (userError || !userData) {
    return res.json({ erro: true, mensagem: 'CPF não encontrado.' });
  }

  // Achou usuário normal
  return res.json({ erro: false, data: userData, type: 'user' });
});



// 🟢 Criar novo usuário 
app.post('/usuarios', async (req, res) => {
  const { cpf, nome, email, telefone } = req.body;

  if (!cpfValidator.isValid(cpf)) {
    return res.status(400).json({ erro: `CPF inválido: ${cpf}` });
  }

  // Verifica se já existe na tabela de responsáveis
  const { data: exists } = await supabase.from('responsaveis').select('cpf').eq('cpf', cpf).single();
  if (exists) return res.status(400).json({ erro: 'Usuário já existe' });

  // Insere no novosusuarios
  const { error: errorNovo } = await supabase.from('novosusuarios').insert([{ cpf, nome, email, telefone }]);
  if (errorNovo) return res.status(500).json({ erro: errorNovo.message });

  // Insere nos responsáveis 
  const { error: errorResp } = await supabase.from('responsaveis').insert([{ cpf, nome, email, telefone }]);
  if (errorResp) return res.status(500).json({ erro: errorResp.message });

  res.status(201).json({ mensagem: 'Usuário criado com sucesso nas duas tabelas' });
});


// 🔵 Buscar cobranças 
app.get('/usuarios/:cpf/boletos', async (req, res) => {
  const cpf = req.params.cpf;

  const { data, error } = await supabase
    .from('boletos')
    .select('*')
    .eq('responsaveisCpf', cpf);

  if (error) return res.status(404).json({ erro: 'Cobranças não encontradas' });

  res.json(data);
});

// 🟢 Criar cobrança Pix
app.post('/usuarios/:cpf/boletos', async (req, res) => {
  const cpf = req.params.cpf;
  const { descricao, vencimento, valor } = req.body;
  const chavePix = '79683428215';

  const { data: responsaveis } = await supabase.from('responsaveis').select('cpf').eq('cpf', cpf).single();
  if (!responsaveis) return res.status(404).json({ erro: 'Usuário não encontrado' });

  const { data, error } = await supabase.from('boletos').insert([{
    responsaveisCpf: cpf,
    descricao,
    vencimento,
    valor,
    chavePix,
    status: 'gerado'
  }]);

  if (error) return res.status(500).json({ erro: error.message });

  res.status(201).json({ sucesso: true, boleto: data[0] });
});

// 🟡 Atualizar cobrança
app.patch('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params;
  const updates = req.body;

  const { data: boleto, error: findError } = await supabase
    .from('boletos')
    .select('*')
    .eq('id', id)
    .eq('responsaveisCpf', cpf)
    .single();

  if (findError) return res.status(404).json({ erro: 'Cobrança não encontrada' });

  const { data, error } = await supabase
    .from('boletos')
    .update(updates)
    .eq('id', id)
    .eq('responsaveisCpf', cpf);

  if (error) return res.status(500).json({ erro: error.message });

  res.json({ sucesso: true, mensagem: 'Cobrança atualizada', cobranca: data[0] });
});

// 🔴 Excluir cobrança
app.delete('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params;

  const { data: boleto, error: findError } = await supabase
    .from('boletos')
    .select('*')
    .eq('id', id)
    .eq('responsaveisCpf', cpf)
    .single();

  if (findError) return res.status(404).json({ erro: 'Cobrança não encontrada' });

  const { error } = await supabase
    .from('boletos')
    .delete()
    .eq('id', id)
    .eq('responsaveisCpf', cpf);

  if (error) return res.status(500).json({ erro: error.message });

  res.json({ sucesso: true, mensagem: 'Cobrança removida' });
});
app.delete('/usuarios/:cpf', async (req, res) => {
  const { cpf } = req.params;

  // Excluir boletos do usuário
  const { error: boletosError } = await supabase
    .from('boletos')
    .delete()
    .eq('responsavelCpf', cpf);

  if (boletosError) {
    console.error("Erro ao excluir boletos:", boletosError.message);
    return res.status(500).json({ erro: 'Erro ao excluir boletos' });
  }

  // Excluir o usuário
  const { error: userError } = await supabase
    .from('responsaveis')
    .delete()
    .eq('cpf', cpf);

  if (userError) {
    console.error("Erro ao excluir usuário:", userError.message);
    return res.status(500).json({ erro: 'Erro ao excluir usuário' });
  }

  res.json({ sucesso: true, mensagem: 'Usuário e boletos excluídos' });
});

// 🔁 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
