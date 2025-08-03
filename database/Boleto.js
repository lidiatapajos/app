const supabase = require('./export');

// CRUD básico pra Boletos

async function criarBoleto(dados) {
  const { data, error } = await supabase
    .from('boletos')
    .insert([dados]);

  if (error) throw error;
  return data;
}

async function listarBoletos() {
  const { data, error } = await supabase
    .from('boletos')
    .select('*');

  if (error) throw error;
  return data;
}

async function atualizarBoleto(id, novosDados) {
  const { data, error } = await supabase
    .from('boletos')
    .update(novosDados)
    .eq('id', id);

  if (error) throw error;
  return data;
}

async function deletarBoleto(id) {
  const { data, error } = await supabase
    .from('boletos')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
}

module.exports = {
  criarBoleto,
  listarBoletos,
  atualizarBoleto,
  deletarBoleto
};
