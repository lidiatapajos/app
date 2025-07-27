const Sequelize = require("sequelize")

const sequelize = new Sequelize(
    "sistema_escola",
    "root",
    "paulo001_",
    {
    host:"localhost",
    dialect:"mysql"
    })

module.exports = sequelize;