import Stripe from "stripe"
import { NextResponse } from "next/server"
import  prisma  from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
    try {
        const body = await request.text()
        const sig = request.get('stripe-signature')
    
        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    
         const handlePayment = async (paymentIntentId, isPaid) => {
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId
            })

            const {orderIds, userId, appId} = session.data[0].metadata
        }

        if(appId !== 'gocart'){
            return NextResponse.json({received: true, message: "Invalid App id"})
    }   

    switch (event.type) {
        case 'payment_intent.succeeded': {
            await handlePaymentIntent(event.data.object.id, true)
        break;
        }

        case 'payment_intent.payment_canceled': {
            await handlePaymentIntent(event.data.object.id, false)
        break;
        }

        default:
            console.log('Unhandled event type:', event.type)
            break;
    }

    return NextResponse.json({received: true})

} catch (error) {
    console.error(error)
    return NextResponse.json({error: error.message}, {status: 400})
}
}
