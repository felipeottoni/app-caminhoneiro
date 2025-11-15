import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const PLANOS = {
  mensal: {
    priceId: process.env.STRIPE_PRICE_ID_MENSAL || '',
    valor: 799, // R$ 7,99 em centavos
    nome: 'Premium Mensal',
    intervalo: 'mês'
  },
  anual: {
    priceId: process.env.STRIPE_PRICE_ID_ANUAL || '',
    valor: 3599, // R$ 35,99 em centavos
    nome: 'Premium Anual',
    intervalo: 'ano'
  }
}
