const { where } = require('sequelize');
const {AdminTb} = require('../database/associations');
const { json } = require('body-parser');
const { UPDATE } = require('sequelize/lib/query-types');


class Admin{
    #Admin;
    constructor(){
        this.#Admin = AdminTb;
    }

    async Criar_Admin(nome, cpf){
        await this.#Admin.create({nome:nome, cpf:cpf})
    }

    async Selecionar_Admin(cpf){
        const admin = await this.#Admin.findAll({where:{cpf:cpf}})
        console.log(JSON.stringify(admin))
    }

    async Editar_Admin(cpf, campos_para_editar){
        const admin = await this.#Admin.update(campos_para_editar,{where:{cpf:cpf}})
    }

    async Deletar_Admin(cpf){
        const admin = await this.#Admin.destroy({where:{cpf:cpf}})
    }
}

module.exports = Admin