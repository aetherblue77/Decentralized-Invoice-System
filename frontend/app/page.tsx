"use client"

import { useState, useEffect, useMemo } from "react"
import CreateInvoiceModal from "@/components/CreateInvoiceModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    FileText,
    DollarSign,
    Mail,
    ShieldCheck,
    Zap,
    Loader2,
} from "lucide-react"
import FaucetButton from "@/components/FaucetButton"
import InvoiceList, { Invoice } from "@/components/InvoiceList"
import { useAccount, useReadContract, useChainId } from "wagmi"
import { getContractAddress } from "@/lib/utils"
import invoiceAbi from "@/constants/invoiceSystemAbi.json"
import { formatUnits } from "viem"
import UserBalance from "@/components/UserBalance"

export default function Home() {
    const { isConnected, address } = useAccount()
    const chainId = useChainId()
    const addresses = getContractAddress(chainId)

    // State for keep all invoices data
    const [allInvoices, setAllInvoices] = useState<Invoice[]>([])

    // 1. FETCH DATA FROM BLOCKCHAIN/CONTRACT
    const {
        data: rawData,
        isLoading,
        refetch,
        isRefetching
    } = useReadContract({
        address: addresses?.invoiceSystem as `0x${string}`,
        abi: invoiceAbi,
        functionName: "getAllInvoices",
        args: [],
        query: {
            enabled: isConnected, // Only fetch if connected wallet
        },
    })

    // 2. PROCESS & FORMAT DATA
    useEffect(() => {
        if (rawData) {
            const formattedData = (rawData as any[]).map((item) => ({
                id: Number(item.id),
                seller: item.seller,
                client: item.client,
                tokenAddress: item.tokenAddress,
                amount: item.amount,
                dueDate: Number(item.dueDate),
                description: item.description,
                isPaid: item.isPaid,
            }))
            setAllInvoices(formattedData)
        }
    }, [rawData])

    // 3. COUNT STATISTICS (Real-time Calculations)
    const stats = useMemo(() => {
        if (!address || allInvoices.length === 0) {
            return { revenue: 0, sent: 0, received: 0 }
        }

        let totalRevenue = BigInt(0)
        let sentCount = 0
        let pendingReceivedCount = 0

        allInvoices.forEach((inv) => {
            // Count Revenue: If i am Seller AND invoice is paid
            if (inv.seller === address && inv.isPaid) {
                totalRevenue += inv.amount
            }
            // Count Sent: If i am Seller
            if (inv.seller === address) {
                sentCount++
            }
            // Count Received: If i am Client (Inbox)
            if (inv.client === address && !inv.isPaid) {
                pendingReceivedCount++
            }
        })

        return {
            revenue: Number(formatUnits(totalRevenue, 18)), // Convert BigInt to Decimal
            sent: sentCount,
            received: pendingReceivedCount,
        }
    }, [allInvoices, address])

    // --- APPEARANCE 1: IF WALLET NOT CONNECTED ---
    if (!isConnected) {
        return (
            <main className="flex min-h-[80vh] flex-col items-center justify-center bg-gray-50/50 p-8 font-[family-name:var(--font-geist-sans)]">
                <div className="max-w-md space-y-6 text-center">
                    {/* Big Icon */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                        <ShieldCheck className="h-10 w-10 text-blue-600" />
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Welcome to WEB3 Invoice System
                        </h1>
                        <p className="text-gray-500">
                            Secure, transparent, and decentralized invoicing
                            platform. Please connect your wallet to access your
                            dashboard.
                        </p>
                    </div>

                    {/* Highlight Feature */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <Zap className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                            <div className="text-sm font-medium">
                                Instant Payment
                            </div>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <FileText className="mx-auto mb-2 h-6 w-6 text-green-500" />
                            <div className="text-sm font-medium">
                                On-Chain Record
                            </div>
                        </div>
                    </div>

                    {/* Instruction */}
                    <div className="pt-4 text-sm text-gray-400">
                        ↗️ Click "Connect Wallet" on the top right to start
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50/50 p-8 font-[family-name:var(--font-geist-sans)]">
            {/* HEADER SECTION */}
            <div className="mx-auto mb-8 flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Manage your decentralized invoices and payments.
                    </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-3">
                    <FaucetButton />
                    <CreateInvoiceModal onSuccess={refetch} />
                </div>
            </div>

            {/* STATS CARDS (REAL DATA) */}
            <div className="mx-auto mb-8 grid max-w-5xl gap-4 md:grid-cols-3">
                {/* Card 1: Revenue */}
                <Card className="border-l-4 border-l-blue-500 bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {/* Show Loading or Real Data */}
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                `${stats.revenue.toFixed(2)} USDC`
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Lifetime earnings (Paid)
                        </p>
                    </CardContent>
                </Card>

                {/* Card 2: Invoices Sent */}
                <Card className="border-l-4 border-l-purple-500 bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Invoices Created
                        </CardTitle>
                        <FileText className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                stats.sent
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Total invoices created
                        </p>
                    </CardContent>
                </Card>

                {/* Card 3: Pending Received Invoice */}
                <Card className="border-l-4 border-l-green-500 bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Invoices Received
                        </CardTitle>
                        <Mail className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                stats.received
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Waiting for Payment
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* MAIN CONTENT (INVOICE LIST) */}
            <div className="mx-auto max-w-5xl">
                <InvoiceList
                    invoices={allInvoices}
                    isLoading={isLoading}
                    refetch={refetch}
                    isRefreshing={isRefetching}
                />
            </div>
        </main>
    )
}
