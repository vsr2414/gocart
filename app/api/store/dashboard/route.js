

//GEt Dashboard Data for seller ( total products, total earnings, total orders)

export async function GET(request) {
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        //Get all orders for the seller
        const orders = await prisma.order.findMany({where: {storeId}})

        //Get all products with ratings for the seller
        const products = await prisma.product.findMany({where: {storeId}})

        const ratings = await prisma.rating.findMany({
            where: {product: {in: products.map((product) => product.id)}},
            include: {user: true, product: true}
        })
    const dashboardData = {
        ratings,
        totalEarnings: Math.round(orders.reduce((acc, order) => acc + order.total, 0)),
        totalOrders: orders.length,
        totalProducts: products.length
    }
    return NextResponse.json({dashboardData});

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400})

    }
}