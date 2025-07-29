const {DataTypes} = require("sequelize")
const sequelize = require("./index")


const PagamentoTb = sequelize.define("Pagamento",{
    data_pagamento:{type: DataTypes.DATE, allowNull:false},
    valor_pago:{type: DataTypes.DOUBLE, allowNull:false},
    meio_pagamento:{type: DataTypes.ENUM('cartão', 'pix', 'dinheiro'), allowNull:false},
    status:{type: DataTypes.ENUM('sucesso', 'falha'), allowNull:false}
})

module.exports = PagamentoTb;