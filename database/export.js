const Responsavel = require('./Responsavel.js');
const Filho = require('./Filho.js');
const Admin = require('./Admin.js');
const ContaBanco = require('./ContaBanco.js');
const Boleto = require('./Boleto.js');
const Pagamento = require('./Pagamento.js');

const supabase = require('./index.js');

module.exports = {
  supabase,
  Responsavel,
  Filho,
  Admin,
  ContaBanco,
  Boleto,
  Pagamento
};
