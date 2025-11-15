import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, plano } = await request.json()

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/dashboard?success=true&plano=${plano}`,
      cancel_url: `${request.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        plano: plano
      }
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Erro ao criar checkout:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
