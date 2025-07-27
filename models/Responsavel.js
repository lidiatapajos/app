const { Model, where } = require('sequelize');
const {Responsavel_tb, FilhoTb } = require('../database/associations.js')
const Filho = require("./Filho.js")

class Responsavel{
    #Responsavel;
    #Filho;
    constructor(){
        this.#Responsavel = Responsavel_tb;
        this.#Filho = Filho;
    }

    async Selecionar_Todos_Responsaveis(){
       const usuarios = await this.#Responsavel.findAll({include:[FilhoTb]})
       return usuarios
    }

    async Selecionar_Responsavel_Especifico(cpf){
        const usuario = await this.#Responsavel.findAll({
            where:{
                cpf:cpf
            },
            include:[FilhoTb]
        })
        return usuario
    }

    async Criar_responsavel(nome_responsavel, cpf_responsavel, email_responsavel, telefone_reponsavel, nome_filho){
        const responsavel = await this.#Responsavel.create(
            {
                nome:nome_responsavel,
                cpf:cpf_responsavel,
                email:email_responsavel,
                telefone:telefone_reponsavel,

            })

        const filho = new this.#Filho()
        console.log(`id responsavel ${responsavel.id}`)
        await filho.Criar_Filho(nome_filho, responsavel.id)

        
    }
    // campos_para_editar deve ser uma array que contenha todos os falores que deseja editar
    // cpf é o cpf do usuário que deseja editar
    async Editar_Responsavel(cpf, campos_para_editar) {
        const usuario = await this.#Responsavel.update({campos_para_editar},{where:{cpf:cpf}})
    }


    async Deletar_Usuario(id){
        const usuario = await this.#Responsavel.destroy({
            where:{
                id:id
            }
        })
    }
}

module.exports = Responsavel;
