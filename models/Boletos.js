const {BoletoTb, AdminTb, Responsavel_tb, ContaBancoTb} = require('../database/associations')
const { DataTypes, where } = require("sequelize");


class Boleto{
    #Boleto;
    constructor(){
        this.#Boleto = BoletoTb;
    }

    async Criar_Boleto(sacado_id, cedente_id, valor, dia_liberaco, dia_vencimento, status){
        await this.#Boleto.create({
            sacado_id:sacado_id,
            cedente_id:cedente_id,
            valor:valor,
            dia_liberacao:dia_liberaco,
            dia_vencimento:dia_vencimento,
            status:status,
            agencia_id:cedente_id,
        })
    }
    
    async Selecionar_Boletos_Responsavel_Especifico(sacado_id){
            const boleto = await this.#Boleto.findOne(
                {
                    where:
                    {
                        sacado_id:sacado_id
                    },
                    attributes:[
                        'id',
                        'valor',
                        'dia_liberacao',
                        'dia_vencimento',
                        'status'
                    ],
                    include:[
                        {
                            model:Responsavel_tb,
                            as:'sacado',
                            attributes:['nome', 'cpf']
                        },
                        {
                            model:AdminTb,
                            as:'cedente',
                            attributes:['nome', 'cpf']
                        },
                        {
                            model:AdminTb,
                            as:'agencia',
                            attributes:['nome'],
                            include:{
                                model:ContaBancoTb,
                                attributes:['agencia']
                            }
                        }
                ]})
            return boleto
        }

    async Selecionar_Todos_Boletos(){
        const boletos = await this.#Boleto.findAll({
            attributes:[
                'id',
                'valor',
                'dia_liberacao',
                'dia_vencimento',
                'status'
            ],
            include:[
                    {
                        model:Responsavel_tb,
                        as:'sacado',
                        attributes:['nome', 'cpf']
                    },
                    {
                        model:AdminTb,
                        as:'cedente',
                        attributes:['nome', 'cpf']
                    },
                    {
                        model:AdminTb,
                        as:'agencia',
                        attributes:['nome'],
                        include:{
                            model:ContaBancoTb,
                            attributes:['agencia']
                        }
                    }
                ]
        })
        return boletos
    }

    

}

module.exports = Boleto;