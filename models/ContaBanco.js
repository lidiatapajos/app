const { where } = require('sequelize');
const {ContaBancoTb} = require('../database/associations')


class ContaBanco{
    #ContaBanco;

    constructor(){
        this.#ContaBanco = ContaBancoTb
    }

    async Criar_Conta_Banco(banco, agencia, conta, adminId){
        await this.#ContaBanco.create({banco:banco, agencia:agencia, conta:conta, AdminId:adminId})
    }

    async Selecionar_Conta_Banco_Especifica(id){
        const conta_banco = await this.#ContaBanco.findAll({where:{id:id}})
        return conta_banco
    }

    async Selecionar_Todas_Contas_Bancos(){
        const contas_bancos = await this.#ContaBanco.findAll()
        return contas_bancos
    }

    async Editar_Conta_Banco(id, campos_para_editar){
        await this.#ContaBanco.update(campos_para_editar,{where:{id:id}})
    }
    async Deletar_Conta_Banco(id){
        await this.#ContaBanco.destroy({where:{id:id}})
    }
}

module.exports = ContaBanco