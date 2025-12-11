import {getAuth} from "@clerk/nextjs/server"
import authSeller from "@/middlewares/authSeller"
import imagekit from "@/configs/imageKit"

//Add a new product
export async function POST(request) {
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: "not unauthorized"}, {status: 401})
        }

        //Get the data from the form
        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const category = formData.get("category")
        const images = formData.getAll("images")

        if(!name || !description || !mrp || !price || !category || images.length < 1){
            return NextResponse.json({error: "missing product details"}, {status: 400})
        }

        //upload images to imagekit
        const imagesUrl = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer()) 
        }))

    } catch (error) {

    }
}