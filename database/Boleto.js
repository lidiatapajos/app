const sequelize = require('./index')
const DataTypes = require('sequelize')


const BoletoTb = sequelize.define("Boleto",{
    valor:{type:DataTypes.DOUBLE},
    dia_liberacao:{type:DataTypes.DATE},
    dia_vencimento:{type:DataTypes.DATE},
    status:{type:DataTypes.ENUM('gerado', "pago","vencido", "cancelado")}},
    {
        timestamps:false
    }
)

module.exports = BoletoTb