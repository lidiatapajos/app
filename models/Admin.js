const supabase = require('../database/associacao'); // importa o client configurado
const ContaBanco = require('./ContaBanco');

class Admin {
  #ContaBanco;

  constructor() {
    this.#ContaBanco = new ContaBanco();
  }

  async Criar_Admin(nome, cpf, banco, agencia, conta) {
    const { data: admin, error } = await supabase
      .from('admins')
      .insert([{ nome, cpf }])
      .select()
      .single();

    if (error) throw error;

    await this.#ContaBanco.Criar_Conta_Banco(banco, agencia, conta, admin.id);
  }

  async Selecionar_Admin_especifico(cpf) {
    const { data, error } = await supabase
      .from('admins')
      .select('*, contabancos(*)') // relacionamento
      .eq('cpf', cpf);

    if (error) throw error;

    return data;
  }

  async Selecionar_Todos_Admins() {
    const { data, error } = await supabase
      .from('admins')
      .select('*, contabancos(*)');

    if (error) throw error;

    return data;
  }

  async Editar_Admin(cpf, campos_para_editar) {
    const { error } = await supabase
      .from('admins')
      .update(campos_para_editar)
      .eq('cpf', cpf);

    if (error) throw error;
  }

  async Deletar_Admin(cpf) {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('cpf', cpf);

    if (error) throw error;
  }
}

module.exports = Admin;
