import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { and, desc, eq, or, sql } from "drizzle-orm"
import { AdminOrdersContent } from "@/components/admin/orders-content"
import { cancelExpiredOrders } from "@/lib/db/queries"

export const dynamic = 'force-dynamic';

function parseIntParam(value: unknown, fallback: number) {
    const num = typeof value === 'string' ? Number.parseInt(value, 10) : NaN
    return Number.isFinite(num) && num > 0 ? num : fallback
}

function firstParam(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined
    return Array.isArray(value) ? value[0] : value
}

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>
}) {
    try {
        await cancelExpiredOrders()
    } catch {
        // Best effort cleanup
    }

    const q = (firstParam(searchParams.q) || '').trim()
    const status = (firstParam(searchParams.status) || 'all').trim()
    const page = parseIntParam(firstParam(searchParams.page), 1)
    const pageSize = Math.min(parseIntParam(firstParam(searchParams.pageSize), 50), 200)

    const whereParts: any[] = []
    if (status !== 'all') {
        whereParts.push(eq(orders.status, status))
    }
    if (q) {
        const like = `%${q}%`
        whereParts.push(or(
            sql`${orders.orderId} ILIKE ${like}`,
            sql`${orders.productName} ILIKE ${like}`,
            sql`COALESCE(${orders.username}, '') ILIKE ${like}`,
            sql`COALESCE(${orders.email}, '') ILIKE ${like}`,
            sql`COALESCE(${orders.tradeNo}, '') ILIKE ${like}`
        ))
    }
    const whereExpr = whereParts.length ? and(...whereParts) : undefined

    const offset = (page - 1) * pageSize

    const countQuery = db.select({ count: sql<number>`count(*)::int` }).from(orders)
    const countResPromise = whereExpr ? countQuery.where(whereExpr as any) : countQuery

    const [rows, countRes] = await Promise.all([
        db.query.orders.findMany({
            where: whereExpr,
            orderBy: [desc(orders.createdAt)],
            limit: pageSize,
            offset,
        }),
        countResPromise,
    ])

    const total = countRes[0]?.count || 0

    return (
        <AdminOrdersContent
            orders={rows.map(o => ({
                orderId: o.orderId,
                username: o.username,
                email: o.email,
                productName: o.productName,
                amount: o.amount,
                status: o.status,
                cardKey: o.cardKey,
                tradeNo: o.tradeNo,
                createdAt: o.createdAt
            }))}
            total={total}
            page={page}
            pageSize={pageSize}
            query={q}
            status={status}
        />
    )
}
