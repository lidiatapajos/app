
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
app.use(express.static(path.join(__dirname, '../view')));
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

  /*if (!cpfValidator.isValid(cpf)) {
    return res.status(400).json({ erro: `CPF inválido: ${cpf}` });
  }*/

  // Verifica se já existe na tabela de responsáveis
  const { data: exists } = await supabase.from('responsaveis').select('cpf').eq('cpf', cpf).single();
  if (exists) return res.status(400).json({ erro: 'Usuário já existe' });

  const { data, error } = await supabase.from('responsaveis').insert([{
    cpf: cpf,
    nome: nome,
    email: email,
    telefone: telefone,
  }]);
  if (error) return res.status(500).json({ erro: error.message });

  res.status(201).json({ mensagem: 'Responsável criado com sucesso', data });
});


// 🔵 Buscar cobranças 
app.get('/usuarios/:cpf/boletos', async (req, res) => {
  const cpf = req.params.cpf;

  // Buscar ID do responsável pelo CPF
  const { data: responsavel, error: responsavelError } = await supabase
    .from('responsaveis')
    .select('id')
    .eq('cpf', cpf)
    .single();

  if (responsavelError || !responsavel) {
    return res.status(404).json({ erro: 'Responsável não encontrado' });
  }

  const { data, error } = await supabase
    .from('boletos')
    .select('*')
    .eq('sacado_id', responsavel.id);

  if (error) return res.status(404).json({ erro: 'Cobranças não encontradas' });

  res.json(data);
});


// 🟢 Criar cobrança Pix
app.post('/usuarios/:cpf/boletos', async (req, res) => {
  const cpf = req.params.cpf;
  const { descricao, vencimento, valor } = req.body;
  const chavePix = '79683428215';

  // Buscar ID do responsável pelo CPF
  const { data: responsavel, error: responsavelError } = await supabase
    .from('responsaveis')
    .select('id')
    .eq('cpf', cpf)
    .single();

  if (responsavelError || !responsavel) {
    return res.status(404).json({ erro: 'Responsável não encontrado' });
  }

  // Criar boleto com sacado_id correto
  const { data, error } = await supabase.from('boletos').insert([{
    sacado_id: responsavel.id,
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

  // Buscar ID do responsável pelo CPF
  const { data: responsavel, error: responsavelError } = await supabase
    .from('responsaveis')
    .select('id')
    .eq('cpf', cpf)
    .single();

  if (responsavelError || !responsavel) {
    return res.status(404).json({ erro: 'Responsável não encontrado' });
  }

  // Verificar se a cobrança existe para este sacado
  const { data: boleto, error: findError } = await supabase
    .from('boletos')
    .select('*')
    .eq('id', id)
    .eq('sacado_id', responsavel.id)
    .single();

  if (findError || !boleto) return res.status(404).json({ erro: 'Cobrança não encontrada' });

  const { data, error } = await supabase
    .from('boletos')
    .update(updates)
    .eq('id', id)
    .eq('sacado_id', responsavel.id);

  if (error) return res.status(500).json({ erro: error.message });

  res.json({ sucesso: true, mensagem: 'Cobrança atualizada', cobranca: data[0] });
});

// 🔴 Excluir cobrança
app.delete('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('boletos')
    .delete()
    .eq('id', id)
    .eq('sacado_id', responsavel.id);

  if (error) {
    console.error("Erro ao deletar cobrança:", error);
    return res.status(500).json({ erro: error.message });
  }

  res.json({ sucesso: true, mensagem: 'Cobrança removida' });
});

app.delete('/usuarios/:cpf', async (req, res) => {
  const cpf = req.params.cpf;
  console.log("CPF recebido para exclusão:", cpf);

  // Busca o responsável pelo CPF
  const { data: responsavel, error: responsavelError } = await supabase
    .from('responsaveis')
    .select('id')
    .eq('cpf', cpf)
    .single();

  if (responsavelError || !responsavel) {
    console.error("Erro ao buscar responsável:", responsavelError);
    return res.status(404).json({ erro: 'Responsável não encontrado' });
  }

  // Exclui boletos vinculados ao responsável
  const { error: boletosError } = await supabase
    .from('boletos')
    .delete()
    .eq('sacado_id', responsavel.id);

  if (boletosError) {
    console.error("Erro ao excluir boletos:", boletosError);
    return res.status(500).json({ erro: 'Erro ao excluir boletos' });
  }

  // Exclui o responsável
  const { error: responsavelDeleteError } = await supabase
    .from('responsaveis')
    .delete()
    .eq('cpf', cpf);

  if (responsavelDeleteError) {
    console.error("Erro ao excluir responsável:", responsavelDeleteError);
    return res.status(500).json({ erro: "Erro ao excluir usuário" });
  }

  res.status(200).json({ sucesso: "Usuário e boletos excluídos" });
});


// 🔁 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
