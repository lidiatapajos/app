const {FilhoTb} = require("../database/associations.js");


class Filho{
    constructor(){
        this.FilhoTb = FilhoTb
    }

    async Criar_Filho(nome_filho, id_responsavel){
        await this.FilhoTb.create({nome:nome_filho, Responsavel_Id:id_responsavel})
    }
}

module.exports = Filho