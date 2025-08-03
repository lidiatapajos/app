const supabase = require('./export');


async function criarResponsavel(dados) {
  const { data, error } = await supabase
    .from('responsaveis')
    .insert([dados])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function buscarResponsavelPorCPF(cpf) {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('*')
    .eq('cpf', cpf);

  if (error) throw error;
  return data;
}

async function buscarTodosResponsaveis() {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('*');

  if (error) throw error;
  return data;
}

async function editarResponsavel(cpf, campos) {
  const { data, error } = await supabase
    .from('responsaveis')
    .update(campos)
    .eq('cpf', cpf);

  if (error) throw error;
  return data;
}

async function deletarResponsavel(cpf) {
  const { error } = await supabase
    .from('responsaveis')
    .delete()
    .eq('cpf', cpf);

  if (error) throw error;
}

module.exports = {
  criarResponsavel,
  buscarResponsavelPorCPF,
  buscarTodosResponsaveis,
  editarResponsavel,
  deletarResponsavel
};
