import { add, parse } from "date-fns";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import Stripe from "stripe";
import { metadata } from "@/app/layout";



export async function POST(request) {
    try {
        const { userId, has } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const {addressId, items, paymentMethod, couponCode} = await request.json()

            //Check if all required fields are present
            if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
                return NextResponse.json({ error: "Missing order details" }, { status: 401 });
            }

            let coupon = null;

            if (couponCode) {

            coupon = await prisma.coupon.findUnique({
            where: { code: couponCode}
        })
        if (!coupon) {
            return NextResponse.json({error: "Coupon not found or expired"}, {status: 400})
             }
    }

    //Check if coupon is applicable for new users
             if(couponCode && coupon.forNewUser){
                const userorders = await prisma.order.findMany({
                    where: {
                        userId}})
             if(userorders.length > 0){
                return NextResponse.json({error: "Coupon valid for new users only"}, {status: 400})
                    }
                }

                const isPlusMember = has({plan:'plus'})

                //Check if coupon is applicable for plus members
                if (couponCode && coupon.forMember){
                    
                    if (!isPlusMember){
                        return NextResponse.json({error: "Coupon valid for Plus members only"}, {status: 400})
                    }
                }

                //Group orders by storeId using a map
                const ordersByStore = new Map();

                for (const item of items) {
                    const product = await prisma.product.findUnique({
                        where: { id: item.id }
                    })
                    const storeId = product.storeId

                    if (!ordersByStore.has(storeId)) {
                        ordersByStore.set(storeId, []);
                    }
                    ordersByStore.get(storeId).push({...item, price: product.price })
                }

                let orderIds = [];
                let fullAmount = 0;

                let isShippingFreeAdded = false

                //Create orders for each store
                for (const [storeId, storeItems] of ordersByStore.entries()) {
                    let total = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

                    if(couponCode){
                        total -= (total * coupon.discount) / 100;
                    }
                    if(!isPlusMember && !isShippingFreeAdded){
                        total += 5; 
                        isShippingFreeAdded = true
                    }

                    fullAmount += parseFloat(total.toFixed(2))

                    const order = await prisma.order.create({
                        data: {
                            userId,
                            storeId,
                            addressId,
                            total: parseFloat(total.toFixed(2)),
                            paymentMethod,
                            isCouponUsed: coupon ? true : false,
                            coupon: coupon ? coupon : {},
                            orderItems: {
                                create: sellerItems.map(item => ({
                                    productId: item.id,
                                    quantity: item.quantity,
                                    price: item.price
                                }))
                            }
                        }
                    })
                    orderIds.push(order.id)
                }

                if (paymentMethod === 'STRIPE') {
                    const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
                    const origin = await request.headers.get('origin')

                    const session = await stripe.checkout.sessions.create({
                        payment_method_types: ['card'],
                        line_items: [{
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: 'Order'
                                },
                                unit_amount: Math.round(fullAmount * 100)
                            },
                            quantity: 1
                        }],
                        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, //current time + 30 minutes
                        mode: 'payment',
                            success_url: `${origin}/loading?nextUrl=orders`,
                            cancel_url: `${origin}/cart`,
                            metadata: { orderIds: orderIds.join(','),
                                userId,
                                appId: 'gocart'
                            }
                    })
                    return NextResponse.json({ session})
                }


                //clear the cart 
                await prisma.user.update({
                    where: { id: userId },
                    data: {cart : {}}
                })

                return NextResponse.json({ message: "Order placed successfully"})

        } catch (error) {
                console.error(error);
                return NextResponse.json({ error: error.code || error.message }, { status: 400 })
        }
    }

    //Get all orders for the authenticated user
    export async function GET(request) {
        try {
            const { userId } = getAuth(request)
            const orders = await prisma.order.findMany({
                where: { userId, OR: [{paymentMethod: PaymentMethod.COD}, {AND:[{paymentMethod: PaymentMethod.STRIPE}, {isPaid: true}]}]},
                include: {
                    orderItems: {
                        include: {
                            product: true}},
                            address: true
                        },
                        orderBy: { createdAt: 'desc' }
                    })
                    return NextResponse.json({ orders })
                
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: error.code || error.message }, { status: 400 })
        }
    }