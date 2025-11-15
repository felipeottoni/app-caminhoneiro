import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { priceId, planType } = await req.json()

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
      success_url: `${req.headers.get('origin')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        planType,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err: any) {
    console.error('Erro ao criar sessão de checkout:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
