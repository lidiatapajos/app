const sequelize = require("./index.js")
const DataTypes = require('sequelize')

const AdminTb = sequelize.define("Admin",{
    nome:{type:DataTypes.STRING, allowNull:false},
    cpf:{type:DataTypes.STRING, allowNull:false},
})

module.exports = AdminTb
