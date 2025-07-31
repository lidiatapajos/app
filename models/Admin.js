const { where } = require('sequelize');
const {AdminTb, ContaBancoTb} = require('../database/associations');
const { json } = require('body-parser');
const { UPDATE } = require('sequelize/lib/query-types');
const ContaBanco = require('./ContaBanco')


class Admin{
    #Admin;
    #ContaBanco;
    constructor(){
        this.#Admin = AdminTb;
        this.#ContaBanco = ContaBanco;
    }

    async Criar_Admin(nome, cpf, banco, agencia, conta){
        const admin = await this.#Admin.create({nome:nome, cpf:cpf})

        const conta_banco = new this.#ContaBanco()
        await conta_banco.Criar_Conta_Banco(banco, agencia, conta, admin.id)
    }

    async Selecionar_Admin_especifoco(cpf){
        const admin = await this.#Admin.findAll({
            where:{
                cpf:cpf
            },
            include:[ContaBancoTb]})

        return admin
    }

    async Selecionar_Todos_Admins(){
        const admin = await this.#Admin.findAll({include:[ContaBancoTb]})
    return admin
    }

    async Editar_Admin(cpf, campos_para_editar){
        const admin = await this.#Admin.update(campos_para_editar,{where:{cpf:cpf}})
    }

    async Deletar_Admin(cpf){
        const admin = await this.#Admin.destroy({where:{cpf:cpf}})
    }
}

module.exports = Admin