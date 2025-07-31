const sequelize = require('./index')
const DataTypes = require('sequelize')

const ContaBancoTb = sequelize.define("ContaBanco",{
    banco:{type:DataTypes.STRING, allowNull:false},
    agencia:{type:DataTypes.STRING},
    conta:{type:DataTypes.STRING, allowNull:false}
})

module.exports = ContaBancoTb;