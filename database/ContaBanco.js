const supabase = require('./export');

// 🔵 Criar nova conta bancária
async function criarContaBanco(dadosConta) {
  const { data, error } = await supabase
    .from('ContaBanco')
    .insert([dadosConta]);

  if (error) {
    console.error('Erro ao criar conta bancária:', error);
    return null;
  }

  return data;
}

// 🔍 Buscar todas as contas bancárias
async function buscarContasBancarias() {
  const { data, error } = await supabase
    .from('ContaBanco')
    .select('*');

  if (error) {
    console.error('Erro ao buscar contas bancárias:', error);
    return [];
  }

  return data;
}

module.exports = {
  criarContaBanco,
  buscarContasBancarias
};
