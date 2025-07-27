const { where } = require('sequelize');
const {ContaBancoTb} = require('../database/associations')


class ContaBanco{
    #ContaBanco;

    constructor(){
        this.#ContaBanco = ContaBancoTb
    }

    async Criar_Conta_Banco(banco, agencia, conta){
        await this.#ContaBanco.create({banco:banco, agencia:agencia, conta:conta})
    }

    async Selecionar_Conta_Banco_Especifica(id){
        const conta_banco = await this.#ContaBanco.findAll({where:{id:id}})
        console.log(JSON.stringify(conta_banco))
    }

    async Selecionar_Todas_Contas_Banco(){
        const conta_banco = await this.#ContaBanco.findAll()
        console.log(JSON.stringify(conta_banco))
    }

    async Editar_Conta_Banco(id, campos_para_editar){
        await this.#ContaBanco.update(campos_para_editar,{where:{id:id}})
    }
    async Deletar_Conta_Banco(id){
        await this.#ContaBanco.destroy({where:{id:id}})
    }
}

module.exports = ContaBanco