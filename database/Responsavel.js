// const Sequelize = require('sequelize')
// const DataTypes = Sequelize.DataTypes
const sequelize = require("./index.js")
const DataTypes = require("sequelize")

const Responsavel_tb = sequelize.define('Responsavel',{
    nome:{type: DataTypes.STRING, allowNull: false} ,
    cpf:{type: DataTypes.STRING(11), allowNull:false, unique:true},
    email:{type: DataTypes.STRING, allowNull:false},
    telefone:{type: DataTypes.STRING(11), allowNull:false}
},
{
    freezeTableName:true,
});

module.exports = Responsavel_tb;




   
