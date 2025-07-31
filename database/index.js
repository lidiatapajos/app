const Sequelize = require("sequelize")

const sequelize = new Sequelize(
    "sistemaEscola",
    "root",
    "",
    {
    host:"localhost",
    dialect:"mysql"
    })

module.exports = sequelize;