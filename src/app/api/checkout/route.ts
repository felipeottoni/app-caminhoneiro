import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANOS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { plano } = await request.json()

    if (!plano || !['mensal', 'anual'].includes(plano)) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      )
    }

    const planoSelecionado = PLANOS[plano as 'mensal' | 'anual']

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: planoSelecionado.nome,
              description: `Jornadas ilimitadas + recursos exclusivos`,
            },
            unit_amount: planoSelecionado.valor,
            recurring: {
              interval: plano === 'mensal' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${request.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        plano: plano,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
