
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { cpf: cpfValidator } = require('cpf-cnpj-validator');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;
const supabaseUrl = 'https://mriyckqgacainraogeif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaXlja3FnYWNhaW5yYW9nZWlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkxNDM4NCwiZXhwIjoyMDY5NDkwMzg0fQ.aP5bLKZYLMBec-rRaNYPfcJkLw1NhibgznhBduRP9DU';
const supabase = createClient(supabaseUrl, supabaseKey);



const corsOptions = {
  origin: 'https://primeirospassosdigital.netlify.app',
  methods: 'GET,POST,PATCH,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
};
app.use(cors(corsOptions));
app.use(cors())
app.use(express.json());

// USUARIOS E ADM
app.use(express.static(path.join(__dirname, '../view')));


app.get('/usuarios', async (req, res) => {
  try {
    // Pega todos os responsáveis
    const { data: usuarios, error: usuariosError } = await supabase
      .from('responsaveis')
      .select('id, cpf, nome');

    if (usuariosError) {
      return res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }

    // Para cada usuário, buscar boletos e filhos
    const usuariosComDados = await Promise.all(
      usuarios.map(async (usuario) => {
        const { data: boletos, error: boletosError } = await supabase
          .from('boletos')
          .select('*')
          .eq('responsavel_id', usuario.id)
          .neq('status', 'pago')
          .order('vencimento', { ascending: true });

        const { data: filhos, error: filhosError } = await supabase
          .from('filhos')
          .select('nome')
          .eq('responsavel_id', usuario.id);

        return {
          cpf: usuario.cpf,
          nome: usuario.nome,
          boletos: boletosError ? [] : boletos,
          filhos: filhosError ? [] : filhos,
        };
      })
    );

    res.json(usuariosComDados);
  } catch (e) {
    console.error('Erro inesperado:', e);
    res.status(500).json({ erro: 'Erro inesperado' });
  }
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

  const { cpf, nome, email, telefone, nomeFilho } = req.body;

  try {
    // Verifica se responsável já existe
    const { data: exists, error: existsError } = await supabase
      .from('responsaveis')
      .select('cpf')
      .eq('cpf', cpf)
      .single();

    if (existsError && existsError.code !== 'PGRST116') {
      console.error('Erro ao buscar CPF:', existsError);
      return res.status(500).json({ erro: 'Erro ao consultar banco de dados' });
    }

    if (exists) {
      console.log(`CPF ${cpf} já existe!`);
      return res.status(400).json({ erro: 'Usuário já existe' });
    }

    // Insere responsável
    const { data: responsavelData, error: insertError } = await supabase
      .from('responsaveis')
      .insert([{ cpf, nome, email, telefone }])
      .select('id') // seleciona o id criado
      .single();

    if (insertError) {
      console.error('Erro ao inserir usuário:', insertError);
      return res.status(500).json({ erro: insertError.message });
    }

    console.log('Responsável criado com sucesso:', responsavelData);

    // Se nomeFilho foi enviado, cadastra o filho linkando com responsavelid
    if (nomeFilho) {
      const { error: filhoError } = await supabase
        .from('filhos')
        .insert([{ nome: nomeFilho, responsavel_id: responsavelData.id }]);
      if (filhoError) {
        console.error('Erro ao inserir filho:', filhoError);
        return res.status(500).json({ erro: filhoError.message });
      }
      console.log('Filho cadastrado com sucesso para o responsável:', responsavelData.id);
    }

    res.status(201).json({ mensagem: 'Responsável e filho criados com sucesso', data: responsavelData });

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

  console.log("POST /usuarios/boletos chamado");
  console.log("Body recebido:", req.body);
  console.log("CPF recebido:", cpf);

  try {
    // 1. Buscar responsável pelo CPF
    console.log("Buscando responsável pelo CPF...");
    const { data: responsaveis, error: respError } = await supabase
      .from('responsaveis')
      .select('id, cpf')
      .eq('cpf', cpf)
      .single();
    console.log("Busca responsável finalizada");

    if (respError || !responsaveis) {
      console.log("Responsável não encontrado ou erro:", respError);
      return res.status(400).json({ erro: 'Responsável não encontrado' });
    }

    const responsavel_Id = responsaveis.id;
    const cedente_id = 2;

    // 2. Buscar conta bancária do admin
    console.log("Buscando conta bancária do admin...");
    const { data: conta, error: contaError } = await supabase
      .from('contabancos')
      .select('conta, banco, agencia')
      .eq('adminid', cedente_id)
      .single();
    console.log("Busca conta bancária finalizada");

    if (contaError || !conta) {
      console.log("Conta bancária do admin não encontrada ou erro:", contaError);
      return res.status(400).json({ erro: 'Conta bancária do admin não encontrada' });
    }

    const agencia_id = 3;
    const dataLiberacao = new Date().toISOString().split('T')[0];
    const vencimentoFormatado = vencimento.split('/').reverse().join('-');

    // 3. Inserir o boleto
    console.log("Inserindo boleto...");
    const { error: boletoError } = await supabase
      .from('boletos')
      .insert([
        {
          valor: parseFloat(valor.replace(',', '.')),
          data_liberacao: dataLiberacao,
          vencimento: vencimentoFormatado,
          status: 'gerado',
          responsavel_id: responsavel_Id,
          agencia_id: agencia_id,
          cedente_id: cedente_id,
          descricao,
          chave_pix: chavePix,
        },
      ]);
    console.log("Tentou inserir boleto");

    if (boletoError) {
      console.log("Erro ao criar boleto:", boletoError);
      return res.status(500).json({ erro: 'Erro ao criar boleto', detalhes: boletoError });
    }

    console.log("Boleto criado com sucesso");
    return res.status(200).json({ sucesso: 'Boleto criado com sucesso' });

  } catch (e) {
    console.error("Erro inesperado:", e);
    return res.status(500).json({ erro: 'Erro inesperado', detalhes: e.message });
  }
});



// 🟡 Atualizar cobrança
app.patch('/usuarios/boletos/:cpf/:id/editar', async (req, res) => {
  const cpf = req.params.cpf;
  const boletoId = req.params.id;
  const { descricao, vencimento, valor } = req.body;

  try {
    const { data: responsavel, error: erroResp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (erroResp || !responsavel)
      return res.status(404).json({ erro: 'Responsável não encontrado' });

    const updates = {};
    if (descricao) updates.descricao = descricao;
    if (vencimento) updates.vencimento = vencimento;
    if (valor) updates.valor = valor;

    const { data, error } = await supabase
      .from('boletos')
      .update(updates)
      .eq('id', boletoId)
      .eq('responsavel_id', responsavel.id)
      .select();

    if (error) return res.status(500).json({ erro: 'Erro ao editar boleto.' });

    res.json({ sucesso: true, mensagem: 'Boleto editado com sucesso', boleto: data[0] });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ erro: 'Erro inesperado ao editar boleto.' });
  }
});

app.get('/usuarios/boletos/:cpf', async (req, res) => {
  const cpf = req.params.cpf;

  try {
    // 1. Buscar responsável
    const { data: responsavel, error: respError } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (respError || !responsavel) {
      return res.status(404).json({ erro: 'Responsável não encontrado' });
    }

    // 2. Buscar boletos PENDENTES (status = 'gerado')
    const { data: boletos, error } = await supabase
      .from('boletos')
      .select('descricao, valor, vencimento')
      .eq('responsavel_id', responsavel.id)
      .eq('status', 'gerado');

    if (error) {
      console.error('Erro ao buscar boletos:', error);
      return res.status(500).json({ erro: 'Erro ao buscar boletos' });
    }

    res.json(boletos);
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar boletos' });
  }
});


app.patch('/usuarios/boletos/:cpf/:id/pagar', async (req, res) => {
  const cpf = req.params.cpf;
  const boletoId = req.params.id;

  try {
    const { data: responsavel, error: erroResp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (erroResp || !responsavel)
      return res.status(404).json({ erro: 'Responsável não encontrado' });

    const { data, error } = await supabase
      .from('boletos')
      .update({ status: 'pago' })
      .eq('id', boletoId)
      .eq('responsavel_id', responsavel.id)
      .select();

    if (error) return res.status(500).json({ erro: 'Erro ao marcar boleto como pago.' });

    res.json({ sucesso: true, mensagem: 'Boleto marcado como pago', boleto: data[0] });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ erro: 'Erro inesperado ao marcar boleto como pago.' });
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

  try {
    const { data: responsavel, error: responsavelError } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (responsavelError || !responsavel) {
      console.error("Erro ao buscar responsável:", responsavelError);
      return res.status(404).json({ erro: 'Responsável não encontrado' });
    }

    // 2) Atualizar o boleto para pago
    const { data, error } = await supabase
      .from('boletos')
      .update({ status: 'pago' })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao atualizar cobrança:', error);
      return res.status(500).json({ erro: 'Não foi possível atualizar a cobrança' });
    }

    if (!data || data.length === 0) {
      console.error('Nenhuma cobrança encontrada para atualizar');
      return res.status(404).json({ erro: 'Cobrança não encontrada' });
    }

    res.json({ sucesso: true, mensagem: 'Cobrança atualizada', cobranca: data[0] });
  } catch (e) {
    console.error("Erro inesperado:", e);
    return res.status(500).json({ erro: 'Erro inesperado.' })
  };
}
);


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
// app.get('/configuracao-boletos', async (_req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('config_boletos')
//       .select('id')
//       .limit(1)
//       .maybeSingle();

//     if (error) {
//       console.error("Erro ao buscar configuração:", error);
//       return res.status(500).json({ erro: 'Erro ao buscar configuração.' });
//     }
//     console.log(data, "----------------------- resposta do bd confing");


//     const configExists = !!data;
//     return res.status(200).json({ configExists });
//   } catch (e) {
//     console.error("Erro inesperado:", e);
//     return res.status(500).json({ erro: 'Erro inesperado.' });
//   }
// });

// app.post('/configuracao-boletos', async (req, res) => {
//   const { diaLiberacao, diaVencimento, valor } = req.body;
//   const usarConfiguracaoPadrao = req.body.usarConfiguracaoPadrao || false;

//   if (
//     diaLiberacao == null ||
//     diaVencimento == null ||
//     valorPadrao == null
//   ) {
//     return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
//   }

//   // Validação simples (opcional)
//   console.log(diaLiberacao, diaVencimento, valor, "----------------------- valores recebidos");
//   if (

//     !Number.isInteger(diaLiberacao) ||
//     !Number.isInteger(diaVencimento) ||
//     typeof valor !== 'number'
//   ) {
//     console.log("aqui")
//     return res.status(400).json({ erro: 'Campos com tipos inválidos.' });
//   }
//   console.log("la fora")
//   try {
//     // Remove qualquer configuração existente
//     await supabase.from('config_boletos').delete();

//     let configData;
//     console.log(usarConfiguracaoPadrao, "----------------------- valor do usar config padrao");
//     if (usarConfiguracaoPadrao) {
//       // Caso o admin escolha a configuração padrão
//       configData = {
//         dia_liberacao: 4,
//         dia_vencimento: 28,
//         valor: 100,
//       };
//     } else {
//       // Validação para configuração manual
//       console.log("aqui dentro")
//       if (
//         diaLiberacao == null ||
//         diaVencimento == null ||
//         valor == null
//       ) {
//         return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
//       }
//       console.log(diaLiberacao, diaVencimento, valor, "----------------------- valores recebidos dentro do else");
//       // if (
//       //   !Number.isInteger(diaLiberacao) ||
//       //   !Number.isInteger(diaVencimento) ||
//       //   typeof valor !== 'number'
//       // ) {
//       //   return res.status(400).json({ erro: 'Campos com tipos inválidos.' });
//       // }

//       configData = {
//         diaLiberacao, diaVencimento, valor
//       };
//     }
//     console.log(configData, "----------------------- dados para inserir no bd");

//     const { data, error } = await supabase
//       .from('config_boletos')
//       .insert([{
//         dia_liberacao: diaLiberacao,
//         dia_vencimento: diaVencimento,
//         valor: valor
//       }]);

//     if (error) {
//       console.error("Erro ao salvar configuração:", error);
//       return res.status(500).json({ erro: 'Erro ao salvar configuração.' });
//     }

//     return res.status(201).json({ sucesso: true, data });
//   } catch (e) {
//     console.error("Erro inesperado:", e);
//     return res.status(500).json({ erro: 'Erro inesperado.' });
//   }
// });



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

  res.status(200).json({ sucesso: "Contato editado con sucesso", data });
});


app.get('/pix', async (req, res) => {
const pixPayload = require('pix-payload');
const QRCode = require('qrcode');
  const { valor, nome, cidade } = req.query;
  const chave = process.env.CHAVE_PIX || '79683428215';

  if (!valor || !nome || !cidade) {
    return res.status(400).json({ erro: 'Parâmetros obrigatórios: valor, nome, cidade' });
  }

  try {
    const payload = pixPayload({
      pixKey: chave,
      merchantName: nome,
      merchantCity: cidade.toUpperCase(),
      amount: parseFloat(valor),
      transactionId: `txid-${Date.now()}`
    });

    const qrCodeBase64 = await QRCode.toDataURL(payload);

    res.status(200).json({
      payload,
      qrCodeBase64,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`
    });

  } catch (err) {
    console.error('Erro ao gerar Pix:', err);
    res.status(500).json({ erro: 'Erro interno ao gerar Pix' });
  }
});
app.get('/comprovantes', async (req, res) => {
  const { cpf } = req.query;

  if (!cpf) {
    return res.status(400).json({ erro: "CPF é obrigatório." });
  }

  try {
    // Primeiro busca o responsável com esse CPF
    const { data: responsavel, error: erroResp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (erroResp || !responsavel) {
      return res.status(404).json({ erro: "Responsável não encontrado." });
    }

    // Agora busca os boletos pagos desse responsável
    const { data: comprovantes, error } = await supabase
      .from('boletos')
      .select('descricao, valor, data_liberacao')
      .eq('responsavel_id', responsavel.id)
      .eq('status', 'pago');

    if (error) throw error;

    // Renomear `data_liberacao` pra `data_pagamento`
    const resultado = comprovantes.map(c => ({
      ...c,
      data_pagamento: c.data_liberacao
    }));

    res.json(resultado);
  } catch (err) {
    console.error("Erro ao buscar comprovantes:", err);
    res.status(500).json({ erro: "Erro interno ao buscar comprovantes." });
  }
});

app.get('/chave-pix', (req, res) => {
  const chavePix = process.env.CHAVE_PIX || '79683428215';
  res.json({ chave: chavePix });
});

// 🔁 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
