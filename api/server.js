
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


const corsOptions = {
  origin: 'https://primeirospassosdigital.netlify.app',
  methods: 'GET,POST,PATCH,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
};

app.use(cors(corsOptions));
app.use(express.json());

// USUARIOS E ADM
app.use(express.static(path.join(__dirname, '../view')));
app.get('/usuarios', async (_req, res) => {
  console.log("🔄 Rota /usuarios acessada");
  const { data, error } = await supabase
    .from('responsaveis')
    .select('*, boletos(*)');

  if (error) {
    console.error("Erro ao buscar usuários:", error.message);
    return res.status(500).json({ erro: true, mensagem: 'Erro ao buscar usuários.' });
  }

  res.json(data);
});

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
  console.log('POST /usuarios chamado');
  console.log('Corpo da requisição:', req.body);

  const { cpf, nome, email, telefone } = req.body;

  try {
    console.log(`Verificando se CPF ${cpf} já existe...`);
    const { data: exists, error: existsError } = await supabase
      .from('responsaveis')
      .select('cpf')
      .eq('cpf', cpf)
      .single();

    if (existsError && existsError.code !== 'PGRST116') { // 'PGRST116' = not found, normal se não existir
      console.error('Erro ao buscar CPF:', existsError);
      return res.status(500).json({ erro: 'Erro ao consultar banco de dados' });
    }

    if (exists) {
      console.log(`CPF ${cpf} já existe!`);
      return res.status(400).json({ erro: 'Usuário já existe' });
    }

    console.log('Inserindo novo usuário:', { cpf, nome, email, telefone });
    const { data, error } = await supabase
      .from('responsaveis')
      .insert([{ cpf, nome, email, telefone }]);

    if (error) {
      console.error('Erro ao inserir usuário:', error);
      return res.status(500).json({ erro: error.message });
    }

    console.log('Usuário criado com sucesso:', data);
    res.status(201).json({ mensagem: 'Responsável criado com sucesso', data });

  } catch (err) {
    console.error('Erro inesperado no POST /usuarios:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// ACABOU ARÉA DOS USUARIOS E ADMS
// COBRANÇAS
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
    .eq('responsavel_id', responsavel.id);

  if (error) return res.status(500).json({ erro: 'Erro ao buscar cobranças' });

  
  res.json(data);
});



// 🟢 Criar cobrança Pix
app.post('/usuarios/boletos', async (req, res) => {
  const { descricao, vencimento, valor, chavePix } = req.body;
  const cpf = req.query.cpf;
  console.log("entrou aqui-----------------------------------------------------------------------------------fds");

  try {
    // 1. Buscar responsável pelo CPF
    const { data: responsaveis, error: respError } = await supabase
      .from('responsaveis')
      .select('id, cpf')
      .eq('cpf', cpf)
      .single();

    if (respError || !responsaveis) {
      return res.status(400).json({ erro: 'Responsável não encontrado' });
    }

    const responsavelId = responsaveis.id;
    const cedente_id = 2;

    // 2. Buscar conta bancária do admin
    const { data: conta, error: contaError } = await supabase
      .from('contabancos')
      .select('conta, banco, agencia')
      .eq('adminid', cedente_id)
      .single();

    if (contaError || !conta) {
      return res.status(400).json({ erro: 'Conta bancária do admin não encontrada' });
    }

    const contaBancariaId = conta.conta;
    console.log("rodando", contaBancariaId);
    const agencia_id = 3;
    // 3. Inserir o boleto com todos os dados
    const dataLiberacao = new Date().toISOString().split('T')[0]; // hoje
    const vencimentoFormatado = vencimento.split('/').reverse().join('-'); // de DD/MM/YYYY pra YYYY-MM-DD

    const { error: boletoError } = await supabase
      .from('boletos')
      .insert([
        {
          valor: parseFloat(valor),
          data_liberacao: dataLiberacao,
          vencimento: vencimentoFormatado,
          status: 'gerado',
          responsavel_id: responsavelId,
          agencia_id: agencia_id,
          cedente_id: cedente_id,
          descricao,
          chave_pix: chavePix,
        },
      ]);

    if (boletoError) {
      return res.status(500).json({ erro: 'Erro ao criar boleto', detalhes: boletoError });
    }

    res.status(200).json({ sucesso: 'Boleto criado com sucesso' });

  } catch (e) {
    res.status(500).json({ erro: 'Erro inesperado', detalhes: e.message });
  }

  const { data, error } = await supabase
    .from('config_boletos')
    .select('*')
    .eq('id')
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // registro não encontrado
      return false
    }
    console.error('Erro ao verificar config:', error)
    return false
  }

  return !!data
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
    .eq('responsavel_id', responsavel.id)
    .single();

  if (findError || !boleto) return res.status(404).json({ erro: 'Cobrança não encontrada' });

  const { data, error } = await supabase
    .from('boletos')
    .update(updates)
    .eq('id', id)
    .eq('responsavel_id', responsavel.id);

  if (error) return res.status(500).json({ erro: error.message });

  res.json({ sucesso: true, mensagem: 'Cobrança atualizada', cobranca: data[0] });
});

app.get('/pix', (req, res) => {
  const { chave, valor, nome, cidade } = req.query;

  if (!chave || !valor || !nome || !cidade) {
    return res.status(400).json({ erro: 'Parâmetros obrigatórios: chave, valor, nome, cidade' });
  }

  try {
    const payload = {
      version: '01',
      key: chave,
      name: nome,
      city: cidade,
      amount: valor
    };

    const codigoPix = new PixQRCode(payload);

    res.json({
      brcode: codigoPix.payload(),
      qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codigoPix.payload())}`
    });

  } catch (err) {
    console.error('Erro ao gerar QRCode:', err);
    res.status(500).json({ erro: 'Erro ao gerar código Pix' });
  }
});
// 🔴 Excluir cobrança
app.delete('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params;
  console.log(`Recebido DELETE para boleto id=${id} e cpf=${cpf}`);

  const { data: responsavel, error: responsavelError } = await supabase
    .from('responsaveis')
    .select('id')
    .eq('cpf', cpf)
    .single();

  if (responsavelError || !responsavel) {
    console.log('Responsável não encontrado:', responsavelError);
    return res.status(404).json({ erro: 'Responsável não encontrado' });
  }

  console.log(`Responsável encontrado com id: ${responsavel.id}`);

  const { error } = await supabase
    .from('boletos')
    .delete()
    .eq('id', id)
    .eq('responsavel_id', responsavel.id);

  if (error) {
    console.log("Erro ao deletar boleto:", error);
    return res.status(500).json({ erro: error.message });
  }

  console.log('Boleto deletado com sucesso');
  res.json({ sucesso: true, mensagem: 'Cobrança removida' });
});

//Marcar como pago
app.patch('/usuarios/:cpf/boletos/:id', async (req, res) => {
  const { cpf, id } = req.params;

  // Buscar o responsável pelo CPF
  const { data: responsavel, error: responsavelError } = await supabase
    .from('responsaveis')
    .select('id')
    .eq('cpf', cpf)
    .single();

  if (responsavelError || !responsavel) {
    return res.status(404).json({ erro: 'Responsável não encontrado' });
  }

  // Atualizar o status do boleto pra "pago"
  const { data, error } = await supabase
    .from('boletos')
    .update({ status: 'pago' })
    .eq('id', id)
    .eq('responsavel_id', responsavel.id);

  if (error) return res.status(500).json({ erro: error.message });

  res.json({ sucesso: true, mensagem: 'Boleto marcado como pago', boleto: data[0] });
});

//ACABOU ARÉA DAS COBRANÇAS
// ARÉA DE DELETAR

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
    .eq('responsavel_id', responsavel.id);

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
// ACABOU ARÉA DE DELETAR
// CONFIGURAÇÃO DE BOLETOS E ETC
app.get('/configuracao-boletos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('config_boletos')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar configuração:", error);
      return res.status(500).json({ erro: 'Erro ao buscar configuração.' });
    }
    console.log(data, "----------------------- resposta do bd confing");
    

    const configExists = !!data;
    return res.status(200).json({ configExists });
  } catch (e) {
    console.error("Erro inesperado:", e);
    return res.status(500).json({ erro: 'Erro inesperado.' });
  }
});

app.post('/configuracao-boletos', async (req, res) => {
  const { dia_liberacao, dia_vencimento, valor } = req.body;

  if (
    dia_liberacao == null ||
    dia_vencimento == null ||
    valor == null
  ) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }

  // Validação simples (opcional)
  if (
    !Number.isInteger(dia_liberacao) ||
    !Number.isInteger(dia_vencimento) ||
    typeof valor !== 'number'
  ) {
    return res.status(400).json({ erro: 'Campos com tipos inválidos.' });
  }

  try {
    // Apaga todas as configurações existentes para manter apenas uma
    await supabase.from('config_boletos').delete();

    const { data, error } = await supabase
      .from('config_boletos')
      .insert([{ dia_liberacao, dia_vencimento, valor }]);

    if (error) {
      console.error("Erro ao salvar configuração:", error);
      return res.status(500).json({ erro: 'Erro ao salvar configuração.' });
    }

    return res.status(201).json({ sucesso: true, data });
  } catch (e) {
    console.error("Erro inesperado:", e);
    return res.status(500).json({ erro: 'Erro inesperado.' });
  }
});
// ACABOU A ARÉA DE BOLETOS 

app.patch('/usuarios/:cpf', async (req, res) => {
  console.log('PATCH chegou aqui!');
  const cpf = req.params.cpf;
  const { email, telefone } = req.body;

  const { data, error } = await supabase
    .from('responsaveis')
    .update({ email, telefone })
    .eq('cpf', cpf);


  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ sucesso: true, data });
});



// 🔁 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
