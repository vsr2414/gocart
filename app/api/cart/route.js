import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

//Update user cart
export async function POST(request) {
    try {
        const {userId} = getAuth(request)
        const {cart} = await request.json()

        //Save cart to user object
        await prisma.user.update({
            where: {id: userId},
            data: {cart: cart}
        })

        return NextResponse.json({message: "Cart updated successfully."})

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.message }, {status: 400})
    }
}

//Get user cart
export async function GET(request) {
    try {
        const {userId} = getAuth(request)
        const user = await prisma.user.findUnique({
            where: {id: userId}
        })
        return NextResponse.json({cart: user.cart})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.message }, {status: 400})
    }
}