const FilhoTb = require('../database/Filho.js');
const Responsavel_tb = require("../database/Responsavel.js");
const AdminTb = require('../database/Admin.js');
const ContaBancoTb = require('../database/ContaBanco.js')
const BoletoTb = require('../database/Boleto.js')
const sequelize = require("./index.js");

// Associação entre a tabela responsavel e tabela filho
Responsavel_tb.hasMany(FilhoTb, { onDelete: 'CASCADE' });
FilhoTb.belongsTo(Responsavel_tb);

// Associação entre a tabela admin e tabela conta bancária
AdminTb.hasMany(ContaBancoTb,{onDelete: 'CASCADE'})
ContaBancoTb.belongsTo(AdminTb);

(async () => {
  try {
    await sequelize.sync();
    console.log('Banco sincronizado com sucesso!');
  } catch (err) {
    console.error('Erro ao sincronizar o banco:', err);
  }
})();

module.exports = { Responsavel_tb, FilhoTb, AdminTb, ContaBancoTb, BoletoTb};