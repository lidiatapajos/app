const FilhoTb = require('../database/Filho.js');
const Responsavel_tb = require("../database/Responsavel.js");
const AdminTb = require('../database/Admin.js');
const ContaBancoTb = require('../database/ContaBanco.js')
const sequelize = require("./index.js");

Responsavel_tb.hasMany(FilhoTb, { onDelete: 'CASCADE' });
FilhoTb.belongsTo(Responsavel_tb);

(async () => {
  try {
    await sequelize.sync();
    console.log('Banco sincronizado com sucesso!');
  } catch (err) {
    console.error('Erro ao sincronizar o banco:', err);
  }
})();

module.exports = { Responsavel_tb, FilhoTb, AdminTb, ContaBancoTb };