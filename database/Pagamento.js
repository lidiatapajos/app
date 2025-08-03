const supabase = require('./export');

async function criarPagamento(dados) {
  const { data, error } = await supabase
    .from('Pagamento')
    .insert([dados])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function listarPagamentos() {
  const { data, error } = await supabase
    .from('Pagamento')
    .select('*');

  if (error) throw error;
  return data;
}

module.exports = {
  criarPagamento,
  listarPagamentos
};
