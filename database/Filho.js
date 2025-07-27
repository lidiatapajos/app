const sequelize = require("./index.js")
const DataTypes = require("sequelize")

const FilhoTb = sequelize.define("Filho",{
    nome:{type: DataTypes.STRING, allowNull:false},
}
)

module.exports = FilhoTb