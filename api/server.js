
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
    .eq('sacado_id', responsavel.id);

  if (error) return res.status(500).json({ erro: 'Erro ao buscar cobranças' });
  if (!data || data.length === 0) return res.status(404).json({ erro: 'Nenhuma cobrança encontrada' });

});


// 🟢 Criar cobrança Pix
app.post('/usuarios/:cpf/boletos', async (req, res) => {
  const cpf = req.params.cpf;  
  const { descricao, vencimento, valor } = req.body;
  const chavePix = '79683428215';
 console.log("Recebendo POST para criar cobrança");
console.log("CPF recebido:", cpf, "Body:", req.body);

// Busca responsável
const { data: responsavel, error: responsavelError } = await supabase
  .from('responsaveis')
  .select('id')
  .eq('cpf', cpf)
  .single();

if (responsavelError || !responsavel) {
  console.error("Responsável não encontrado", responsavelError);
  return res.status(404).json({ erro: 'Responsável não encontrado' });
}

console.log("Responsável encontrado com ID:", responsavel.id);




const cedente_id = responsavel.id;
console.log("Responsável encontrado com ID:", cedente_id);

// continua com a criação da cobrança usando o cedente_id


// Formata vencimento
const [dia, mes, ano] = vencimento.split('/');
const vencimentoISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

// Busca configuração
const { data: config, error: configError } = await supabase
  .from('config_boletos')
  .select('dia_liberacao')
  .limit(1)
  .maybeSingle();

if (configError) {
  console.error("Erro ao buscar config boletos", configError);
  return res.status(500).json({ erro: 'Erro ao buscar configuração dos boletos.' });
}

let dia_liberacaoISO;
if (config?.dia_liberacao) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const diaConfig = String(config.dia_liberacao).padStart(2, '0');
  dia_liberacaoISO = `${anoAtual}-${mesAtual}-${diaConfig}`;
} else {
  dia_liberacaoISO = new Date().toISOString().split('T')[0];
}

console.log("Dia de liberação definido como:", dia_liberacaoISO);


const valorNum = Number(valor.toString().replace(',', '.'));

console.log("Inserindo boleto com valor:", valorNum);

const { data: boletoData, error: boletoError } = await supabase
  .from('boletos')
  .insert([{
    sacado_id: responsavel.id,
    descricao,
    vencimento: vencimentoISO,
    valor: valorNum,
    status: 'gerado',
    dia_liberacao: dia_liberacaoISO,
    cedente_id
  }])
  .select();

if (boletoError) {
  console.error("Erro ao criar boleto:", boletoError);
  return res.status(500).json({ erro: boletoError.message });
}

const boletoComChavePix = {
  ...boletoData[0],
  chavePix
};

console.log("Boleto criado com sucesso:", boletoComChavePix);

return res.status(201).json({ sucesso: true, boleto: boletoComChavePix });
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

    const configExists = !!data;
    return res.json({ configExists });
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
