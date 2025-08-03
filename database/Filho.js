const supabase = require('./export');

// Criar um filho
async function criarFilho(dados) {
  const { data, error } = await supabase
    .from('Filho')
    .insert([dados])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Buscar todos os filhos
async function buscarFilhos() {
  const { data, error } = await supabase
    .from('filhos')
    .select('*');

  if (error) throw error;
  return data;
}

module.exports = { criarFilho, buscarFilhos };
