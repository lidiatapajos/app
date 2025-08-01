const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  'postgres',            // nome do banco
  'postgres',            // usuário
  'Passinhos2025',      // senha do Supabase (coloca sua real)
  {
    host: 'mriyckqgacainraogeif.supabase.co',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false, // desliga logs chatos
  }
);

module.exports = sequelize;
