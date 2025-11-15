import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Assinatura ausente' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (error) {
    console.error('Erro ao verificar webhook:', error)
    return NextResponse.json(
      { error: 'Webhook inválido' },
      { status: 400 }
    )
  }

  // Processar eventos do Stripe
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Pagamento concluído:', session.id)
      // Aqui você pode salvar no banco de dados que o usuário é premium
      // Por exemplo: await atualizarUsuarioPremium(session.customer)
      break

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription
      console.log('Assinatura cancelada:', subscription.id)
      // Aqui você pode remover o status premium do usuário
      break

    case 'invoice.payment_failed':
      const invoice = event.data.object as Stripe.Invoice
      console.log('Pagamento falhou:', invoice.id)
      // Aqui você pode notificar o usuário sobre falha no pagamento
      break

    default:
      console.log(`Evento não tratado: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
