import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


//update seller orders status
export async function POST (request) {
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json({error: 'not authorized'}, {status: 401})
        }

        const {orderId, status} = await request.json()

        await prisma.order.update({
            where: {
                id: orderId, storeId
            },
            data: {
                status
            }
        })
        return NextResponse.json({message: 'Order status updated successfully'})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.mesage}, {status: 400})
    }
}