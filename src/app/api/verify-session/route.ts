import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID não fornecido' },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return NextResponse.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      planType: session.metadata?.planType,
    })
  } catch (err: any) {
    console.error('Erro ao verificar sessão:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
