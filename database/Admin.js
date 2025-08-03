const supabase = require('./export');

// Criar um novo admin
async function criarAdmin({ nome, cpf }) {
  const { data, error } = await supabase
    .from('admins')
    .insert([{ nome, cpf }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Buscar todos os admins
async function buscarTodosAdmins() {
  const { data, error } = await supabase
    .from('admins')
    .select('*');

  if (error) throw error;
  return data;
}

// Buscar admin por CPF
async function buscarAdminPorCPF(cpf) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('cpf', cpf);

  if (error) throw error;
  return data;
}

// Editar admin por CPF
async function editarAdmin(cpf, campos) {
  const { data, error } = await supabase
    .from('admins')
    .update(campos)
    .eq('cpf', cpf);

  if (error) throw error;
  return data;
}

// Deletar admin por CPF
async function deletarAdmin(cpf) {
  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('cpf', cpf);

  if (error) throw error;
}

module.exports = {
  criarAdmin,
  buscarTodosAdmins,
  buscarAdminPorCPF,
  editarAdmin,
  deletarAdmin
};
