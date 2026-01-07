'use client'

import { useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Search } from "lucide-react"
import { ClientDate } from "@/components/client-date"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Order {
    orderId: string
    productName: string
    amount: string
    status: string | null
    createdAt: Date | null
}

export function OrdersContent({ orders }: { orders: Order[] }) {
    const { t } = useI18n()
    const [query, setQuery] = useState("")
    const [status, setStatus] = useState<string>("all")

    const getStatusBadgeVariant = (status: string | null) => {
        switch (status) {
            case 'delivered': return 'default' as const
            case 'paid': return 'secondary' as const
            case 'cancelled': return 'secondary' as const
            default: return 'outline' as const
        }
    }

    const getStatusText = (status: string | null) => {
        if (!status) return t('order.status.pending')
        return t(`order.status.${status}`) || status
    }

    const statusOptions = [
        { key: 'all', label: t('common.all') },
        { key: 'pending', label: t('order.status.pending') },
        { key: 'paid', label: t('order.status.paid') },
        { key: 'delivered', label: t('order.status.delivered') },
        { key: 'refunded', label: t('order.status.refunded') },
        { key: 'cancelled', label: t('order.status.cancelled') },
    ]

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return orders.filter(o => {
            const st = o.status || 'pending'
            const statusOk = status === 'all' ? true : st === status
            if (!statusOk) return false
            if (!q) return true
            const hay = [o.orderId, o.productName].join(' ').toLowerCase()
            return hay.includes(q)
        })
    }, [orders, query, status])

    return (
        <main className="container py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{t('orders.title')}</h1>
                <p className="text-muted-foreground">{t('orders.count', { count: orders.length })}</p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                <div className="relative md:w-[360px]">
                    <Input
                        placeholder={t('orders.searchPlaceholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map(s => (
                        <Button
                            key={s.key}
                            type="button"
                            variant={status === s.key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatus(s.key)}
                        >
                            {s.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filtered.length > 0 ? (
                    filtered.map(order => (
                        <Link href={`/order/${order.orderId}`} key={order.orderId}>
                            <Card className="hover:border-primary/50 transition-colors">
                                <div className="flex items-center p-6 gap-4">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold truncate">{order.productName}</h3>
                                            <span className="font-bold">{Number(order.amount)} {t('common.credits')}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span className="font-mono">{order.orderId}</span>
                                            <ClientDate value={order.createdAt} />
                                        </div>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(order.status)} className="ml-2 capitalize">
                                        {getStatusText(order.status)}
                                    </Badge>
                                </div>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-20 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-4">
                            <Search className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="font-semibold text-lg">{orders.length ? t('orders.noResults') : t('orders.noOrders')}</h3>
                        <p className="text-muted-foreground mb-6"></p>
                        <Link href="/" className="text-primary hover:underline">{t('orders.browseProducts')}</Link>
                    </div>
                )}
            </div>
        </main>
    )
}
