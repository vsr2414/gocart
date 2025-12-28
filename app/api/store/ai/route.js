import {NextResponse} from "next/server"
import {getAuth} from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"

async function main(base64Image, mimeType) {
    const messages = [
        {role: "system", "content": `You are a product listing assistant for a e-commerce store. Your job is to analyze an image of a product and generate stuctured data.
        
           Respond ONLY with raw JSON (no code block, no markdown, no explanation) .
           The JSON must strictly follow this format:

              {
           "name": string,      //Short product name 
              "description": string,  //Marketing friendly description of the product
              

            }
              `
        },
        {
            role: "user", "content": [
                { 
            
                    "type": "text",
            "text": "Analyze the following image and return name + description.",
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": `data:${mimeType};base64,${base64Image}`
                    },
                },
            ],
        }

    ];
}

export async function POST(request) {
    try {
        const {userId} = getAuth(request)
        const isSeller = await authSeller(userId)
        if(!isSeller){
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const {base64Image, mimeType} = await request.json();
    } catch (error) {
    }
}