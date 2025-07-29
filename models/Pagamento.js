const {PagamentoTb, BoletoTb, Responsavel_tb, AdminTb} = require('../database/associations')
const {DataTypes, where, Model} = require('sequelize')



class Pagamento{
    #Pagamento;
    constructor(){
        this.#Pagamento = PagamentoTb;
    }

    async Criar_Pagamento(data_pagamento, valor_pago, meio_pagamento, status, boleto_id){
        const pagamento = await this.#Pagamento.create({
            data_pagamento:data_pagamento,
            valor_pago:valor_pago,
            meio_pagamento:meio_pagamento,
            status:status,
            boleto_id:boleto_id,
        })
    }

    async Selecionar_Pagamentos_De_Um_Responsavel(sacado_id){
        const pagamentos = await this.#Pagamento.findAll({
            attributes:[
                'id',
                'data_pagamento',
                'valor_pago',
                'meio_pagamento',
                'status',

            ],
            include:{
                model:BoletoTb,
                where:{sacado_id:sacado_id},
                as:'boleto',
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
                    }
                ]
            }
        })

        return pagamentos
    }

    async Selecionar_Todos_Pagamentos(){
        const pagamentos = this.#Pagamento.findAll()

        return pagamentos
    }


}
module.exports = Pagamento;