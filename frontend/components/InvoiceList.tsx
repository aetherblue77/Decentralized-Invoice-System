"use client"

import { useState, useEffect, useMemo } from "react"
import { useAccount, useReadContract, useChainId } from "wagmi"
import { formatUnits, erc20Abi } from "viem"
import { getContractAddress } from "@/lib/utils"
import invoiceAbi from "@/constants/invoiceSystemAbi.json"
import {
    Loader2,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    Ban,
    CalendarDays,
    RefreshCcw,
    Search,
    X,
    Copy,
    Filter,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface Invoice {
    id: number
    seller: string
    client: string
    tokenAddress: string
    amount: bigint
    dueDate: number
    isPaid: boolean
    description: string
}

interface InvoiceListProps {
    invoices: Invoice[]
    isLoading: boolean
    refetch: () => void
    isRefreshing: boolean
}

export default function InvoiceList({
    invoices,
    isLoading,
    refetch,
    isRefreshing,
}: InvoiceListProps) {
    const { address } = useAccount()

    ///////////////////////////////////
    ///// SEARCH INVOICE FEATURES /////
    ///////////////////////////////////

    // STATE FOR SEARCH FEATURES
    const [searchId, setSearchId] = useState("")
    const [searchResult, setSearchResult] = useState<Invoice | null>(null)

    // STATE TO LOCK SCREEN WHEN TRANSACTION IS IN PROGRESS
    const [isGlobalLoading, setIsGlobalLoading] = useState(false)

    // STATE FOR ACTIVE TAB & FILTERING MONTH
    const [activeTab, setActiveTab] = useState("inbox")
    const [selectedMonth, setSelectedMonth] = useState<string>("all")

    // --- LOGIC 1: SEARCH INVOICE ---
    const handleSearch = () => {
        if (!searchId) return
        const found = invoices.find((inv) => inv.id.toString() === searchId)

        if (found) {
            setSearchResult(found)
            setSearchId("")
        } else {
            toast.error("Invoice Not Found", {
                description: `ID #${searchId} doesn't exist.`,
            })
            setSearchResult(null)
            setSearchId("")
        }
    }

    // --- LOGIC 2: DIVIDED DATA BASED ON CATEGORY ---
    const { createPending, createHistory, receivedPending, receivedHistory } =
        useMemo(() => {
            const createAll = invoices.filter((inv) => inv.seller === address)
            const receivedAll = invoices.filter((inv) => inv.client === address)

            return {
                // A. Create (Outbox)
                createPending: createAll.filter((inv) => !inv.isPaid),
                createHistory: createAll.filter((inv) => inv.isPaid),

                // B. Received (Inbox)
                receivedPending: receivedAll.filter((inv) => !inv.isPaid),
                receivedHistory: receivedAll.filter((inv) => inv.isPaid),
            }
        }, [invoices, address])

    // --- LOGIC 3: DETERMINING ACTIVE LIST BASED ON TAB ---
    const currentList = useMemo(() => {
        switch (activeTab) {
            case "inbox":
                return receivedPending
            case "outbox":
                return createPending
            case "history_inbox":
                return receivedHistory
            case "history_outbox":
                return createHistory
            default:
                return []
        }
    }, [
        activeTab,
        receivedPending,
        createPending,
        receivedHistory,
        createHistory,
    ])

    // --- LOGIC 4: GENERATE AVAILABLE MONTH ---
    const availableMonths = useMemo(() => {
        const months = new Set<string>()
        currentList.forEach((inv) => {
            const date = new Date(inv.dueDate * 1000)
            const monthYear = date.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            })
            months.add(monthYear)
        })
        // Convert to Array and Sort (Newest to Oldest)
        return Array.from(months).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime(),
        )
    }, [currentList])

    // Reset Month Filter if move tab
    useEffect(() => {
        setSelectedMonth("all")
    }, [activeTab])

    // --- LOGIC 5: FILTERING DATA BASED ON MONTH ---
    const filteredByMonthList = useMemo(() => {
        if (selectedMonth === "all") return currentList
        return currentList.filter((inv) => {
            const date = new Date(inv.dueDate * 1000)
            const monthYear = date.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            })
            return monthYear === selectedMonth
        })
    }, [currentList, selectedMonth])

    // --- LOGIC 6: FINAL GROUPING (daily) ---
    const groupedInvoices = useMemo(() => {
        const groups: { [key: string]: Invoice[] } = {}
        filteredByMonthList.forEach((inv) => {
            const dateObj = new Date(inv.dueDate * 1000)
            const dateKey = dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })
            if (!groups[dateKey]) groups[dateKey] = []
            groups[dateKey].push(inv)
        })

        // Sorting Logic (Overdue at the top for Inbox, History at the bottom for History)
        const sortOrder = activeTab.includes("history") ? "desc" : "asc"

        return Object.keys(groups)
            .sort((a, b) => {
                const dateA = new Date(a).getTime()
                const dateB = new Date(b).getTime()
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA
            })
            .reduce(
                (obj, key) => {
                    obj[key] = groups[key]
                    return obj
                },
                {} as { [key: string]: Invoice[] },
            )
    }, [filteredByMonthList, activeTab])

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="w-full space-y-8">
            {/* Overlay Loading - appear when transaction is processing */}
            {isGlobalLoading && (
                <div className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="flex items-center gap-3 rounded-full border border-gray-100 bg-white px-6 py-3 shadow-2xl duration-300 animate-in fade-in zoom-in">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">
                                Processing Transaction...
                            </span>
                            <span className="text-[10px] text-gray-500">
                                Please don't close this window
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* PART 1: SEARCH BAR (GUEST PAYMENT) */}
            <div className="relative space-y-4 overflow-hidden rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold text-gray-700">
                    <Search className="h-4 w-4 text-purple-600" /> Find Invoice
                    to Pay
                </h3>
                <div className="flex gap-2">
                    <Input
                        disabled={isGlobalLoading}
                        placeholder="Enter Invoice ID (e.g. 1)"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        type="number"
                        className="font-mono"
                    />
                    <Button
                        disabled={isGlobalLoading}
                        onClick={handleSearch}
                        className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                        Search
                    </Button>
                    {searchResult && (
                        <Button
                            variant="ghost"
                            disabled={isGlobalLoading}
                            onClick={() => {
                                setSearchResult(null)
                                setSearchId("")
                            }}
                        >
                            <X className="h-4 w-4" /> Clear
                        </Button>
                    )}
                </div>

                {/* SEARCH RESULT APPEARANCE */}
                {searchResult && (
                    <div className="mt-4 border-t pt-4 animate-in fade-in slide-in-from-top-4">
                        <p className="mb-2 text-sm font-medium text-gray-500">
                            Search Result:
                        </p>
                        <InvoiceCard
                            invoice={searchResult}
                            // Determine role
                            role={
                                searchResult.client === address
                                    ? "client"
                                    : searchResult.seller === address
                                      ? "seller"
                                      : "guest"
                            }
                            refetch={refetch}
                            setGlobalLoading={setIsGlobalLoading}
                        />
                    </div>
                )}
            </div>

            {/* PART 2: MAIN TABS & MONTHLY SLIDER */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 p-1 md:w-[600px]">
                        <TabsTrigger
                            value="inbox"
                            className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
                        >
                            Inbox ({receivedPending.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="outbox"
                            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                        >
                            Outbox ({createPending.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="history_inbox"
                            className="data-[state=active]:bg-gray-200"
                        >
                            Paid (Inbox)
                        </TabsTrigger>
                        <TabsTrigger
                            value="history_outbox"
                            className="data-[state=active]:bg-gray-200"
                        >
                            Paid (Outbox)
                        </TabsTrigger>
                    </TabsList>

                    {/* Button for refresh manually */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isRefreshing || isGlobalLoading}
                        className="hidden gap-2 md:flex"
                    >
                        <RefreshCcw
                            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                        />
                        {isRefreshing ? "Refreshing..." : "Refresh List"}
                    </Button>
                </div>

                {/* --- MONTHLY SLIDER FEATURE --- */}
                {/* Only show if available months exists */}
                {availableMonths.length > 0 && (
                    <div className="mb-6">
                        <div className="mb-2 flex items-center gap-2">
                            <Filter className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Filter by Month
                            </span>
                        </div>

                        {/* Container Scrollable */}
                        <div className="scrollbar-hide mask-linear-fade flex gap-2 overflow-x-auto pb-2">
                            {/* All Time Button */}
                            <button
                                onClick={() => setSelectedMonth("all")}
                                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                                    selectedMonth === "all"
                                        ? "bg-gray-900 text-white shadow-md"
                                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                All Time
                            </button>

                            {/* Months Button */}
                            {availableMonths.map((month) => (
                                <button
                                    key={month}
                                    onClick={() => setSelectedMonth(month)}
                                    className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                                        selectedMonth === month
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {month}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CONTENT LIST --- */}
                <div className="min-h-[300px] space-y-6">
                    {Object.keys(groupedInvoices).length === 0 ? (
                        <EmptyState
                            message={
                                searchId
                                    ? "No invoices match your search."
                                    : selectedMonth !== "all"
                                      ? `No invoices found in ${selectedMonth}.`
                                      : activeTab.includes("history")
                                        ? "No paid history yet." // Message for history tab
                                        : "No invoices found in this list." // General message
                            }
                        />
                    ) : (
                        Object.keys(groupedInvoices).map((date) => (
                            <div
                                key={date}
                                className="space-y-3 duration-500 animate-in fade-in slide-in-from-bottom-2"
                            >
                                <DateHeader
                                    date={date}
                                    color={
                                        activeTab === "inbox"
                                            ? "orange"
                                            : activeTab === "outbox"
                                              ? "blue"
                                              : "gray"
                                    }
                                    label={
                                        activeTab.includes("history")
                                            ? "Original Due:"
                                            : "Due Date:"
                                    }
                                />
                                {groupedInvoices[date].map((inv) => (
                                    <InvoiceCard
                                        key={inv.id}
                                        invoice={inv}
                                        role={
                                            inv.seller === address
                                                ? "seller"
                                                : "client"
                                        }
                                        refetch={refetch}
                                        setGlobalLoading={setIsGlobalLoading}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </Tabs>
        </div>
    )
}

// --- SUB_COMPONENT: INVOICES ON CARD ---
function InvoiceCard({
    invoice,
    role,
    refetch,
    setGlobalLoading,
}: {
    invoice: Invoice
    role: "seller" | "client" | "guest"
    refetch: () => void
    setGlobalLoading?: (state: boolean) => void
}) {
    const chainId = useChainId()
    const addresses = getContractAddress(chainId)
    const { address } = useAccount() // User Address / Payer Address
    const [lastAction, setLastAction] = useState<"approve" | "pay" | null>(null)

    // Local State for track if this card is loading
    const [amILoading, setAmILoading] = useState(false)

    // STATE OPTIMIS: For update appearance instanly before blockchain's data enters
    const [isPaidOptimistic, setIsPaidOptimistic] = useState(false)

    // WRITE CONTRACT (For approve & Pay)
    const { writeContract, data: hash, isPending } = useWriteContract()
    // Monitor the status Transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        { hash },
    )

    // 1. READ ALLOWANCE (Check if the invoice system had been approved to use our money.)
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: addresses?.mockUSDC as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [
            address as `0x${string}`,
            addresses?.invoiceSystem as `0x${string}`,
        ],
    })

    // 2. READ USER BALANCE (Check if we have enough money to pay)
    const { data: userBalance } = useReadContract({
        address: addresses?.mockUSDC as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
    })

    // [NEW LOGIC] Merge the original state (from props) with the optimistic (local) state
    // if one is True, then assume it is Paid
    const isInvoicePaid = invoice.isPaid || isPaidOptimistic

    // CONDITION: Not Paid AND Due Date Passed (Current Time > Due Time)
    const now = new Date()
    // Reset Time to 00:00:00
    now.setHours(0, 0, 0, 0)
    const currentDayTimestamp = Math.floor(now.getTime() / 1000)
    const isOverdue = !isInvoicePaid && currentDayTimestamp > invoice.dueDate

    // Check Balance is Enough to Pay
    // If Balance undefined, assume false (not Insufficient)
    const isBalanceInsufficient =
        userBalance !== undefined ? userBalance < invoice.amount : false

    // Check if we have enough allowance to pay
    // If allowance (permission) < invoice.amount, We need Approve first
    const isAllowanceInsufficient = allowance
        ? allowance < invoice.amount
        : true

    // FUNCTION 1: APPROVE
    const handleApprove = () => {
        setLastAction("approve")
        writeContract({
            address: addresses?.mockUSDC as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [addresses?.invoiceSystem as `0x${string}`, invoice.amount],
        })
    }

    // FUNCTION 2: PAY
    const handlePay = async () => {
        setLastAction("pay")
        try {
            writeContract({
                address: addresses?.invoiceSystem as `0x${string}`,
                abi: invoiceAbi,
                functionName: "payInvoice",
                args: [BigInt(invoice.id)],
            })
        } catch (error) {
            toast.error("Payment failed")
        }
    }

    // --- USE EFFECTS (Logic Loading & Sync) ---
    // Effect 1: Loading Screen (don't change)
    useEffect(() => {
        if (!setGlobalLoading) return
        const isLoadingNow = isPending || isConfirming

        if (isLoadingNow) {
            setAmILoading(true)
            setGlobalLoading(true)
        } else if (amILoading) {
            setAmILoading(false)
            setGlobalLoading(false)
        }
    }, [isPending, isConfirming, setGlobalLoading, amILoading])

    // Effect 2: Sync Props --> Optimistic
    useEffect(() => {
        if (invoice.isPaid) {
            setIsPaidOptimistic(true)
        } else {
            setIsPaidOptimistic(false)
        }
    }, [invoice.isPaid, invoice.id])

    // Effect 3: Success Action Handling (UPDATED)
    useEffect(() => {
        if (isSuccess) {
            if (lastAction === "approve") {
                toast.success("USDC Approved! Now you can pay. ✅")
                refetchAllowance() // Check again for the permission
                setLastAction(null)
            } else if (lastAction === "pay") {
                toast.success("Payment Successful! 🎉")
                // [IMPORTANT] Forced appearance to PAID right now
                setIsPaidOptimistic(true)
                // Still call refetch to update original in background
                refetch()
                setLastAction(null)
            }
        }
    }, [isSuccess, isAllowanceInsufficient, refetch, refetchAllowance])

    // --- COPY ID FUNCTION ---
    const copyToClipboard = () => {
        navigator.clipboard.writeText(invoice.id.toString())
        toast.success("Invoice ID copied to clipboard! 📋")
    }

    return (
        <Card
            className={`border-l-4 transition-shadow hover:shadow-lg ${
                // Condition for Left Border Color
                isInvoicePaid
                    ? "border-gray-200 border-l-green-500" // Paid (Green)
                    : isOverdue
                      ? "border-red-200 border-l-red-500 bg-red-50/30" // OverDue (Red)
                      : "border-gray-200 border-l-orange-500" //Pending (Orange)
            }`}
        >
            <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                    <div
                        className={`rounded-full p-3 ${
                            role === "seller"
                                ? "bg-blue-100"
                                : role === "client"
                                  ? "bg-orange-100"
                                  : "bg-purple-100"
                        }`}
                    >
                        {role === "seller" ? (
                            <ArrowUpRight className="text-blue-600" />
                        ) : role === "client" ? (
                            <ArrowDownLeft className="text-orange-600" />
                        ) : (
                            <Search className="h-6 w-6 text-orange-600" />
                        )}
                    </div>

                    {/* --- INFO SECTION WITH ID --- */}
                    <div>
                        {/* ID Badge with Copy Button */}
                        <div
                            onClick={copyToClipboard}
                            className="mb-1 inline-flex cursor-pointer items-center gap-1 rounded border border-blue-100 bg-blue-50 px-2 py-0.5 transition-colors hover:bg-blue-100"
                            title="Click to copy ID"
                        >
                            <span className="font-mono text-[10px] font-bold text-blue-600">
                                #{invoice.id.toString()}
                            </span>
                            <Copy className="h-3 w-3 text-blue-400" />
                        </div>

                        <h4 className="text-lg font-bold text-gray-900">
                            {invoice.description}
                        </h4>
                        <p className="font-mono text-sm text-gray-500">
                            {role === "seller"
                                ? `Billed to: ${invoice.client.slice(0, 6)}...${invoice.client.slice(-4)}`
                                : `From: ${invoice.seller.slice(0, 6)}...${invoice.seller.slice(-4)}`}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                        {formatUnits(invoice.amount, 18)} USDC
                    </div>

                    {/* REMINDER TEXT FOR OVERDUE */}
                    {isOverdue && !isInvoicePaid && (
                        <p className="mt-1 flex animate-pulse items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
                            ⚠️ Immediate Payment Required
                        </p>
                    )}

                    <div className="mt-2 flex items-center justify-end gap-2">
                        {isInvoicePaid ? (
                            <Badge className="border-green-200 bg-green-100 px-3 py-1 text-green-700 hover:bg-green-100">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                            </Badge>
                        ) : isOverdue ? (
                            // Appearance for Overdue
                            <Badge
                                variant="destructive"
                                className="flex items-center px-3 py-1"
                            >
                                <Clock className="mr-1 h-3 w-3" /> Overdue
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-orange-200 bg-orange-50 px-3 py-1 text-orange-600"
                            >
                                <Clock className="mr-1 h-3 w-3" /> Pending
                            </Badge>
                        )}

                        {(role === "client" || role === "guest") &&
                            !isInvoicePaid && (
                                <Button
                                    size="sm"
                                    onClick={
                                        isAllowanceInsufficient
                                            ? handleApprove
                                            : handlePay
                                    }
                                    disabled={
                                        isPending ||
                                        isConfirming ||
                                        isBalanceInsufficient
                                    }
                                    className={`ml-4 h-8 ${
                                        isBalanceInsufficient
                                            ? "cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
                                            : isAllowanceInsufficient
                                              ? "bg-amber-500 text-white hover:bg-amber-600" // Need Approve (Yellow)
                                              : isOverdue
                                                ? "bg-red-600 text-white hover:bg-red-700" // Ready to pay but Overdue (Red)
                                                : "bg-blue-600 text-white hover:bg-blue-700" // Normal (Blue)
                                    }`}
                                >
                                    {isPending || isConfirming ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isBalanceInsufficient ? (
                                        "Insufficient Balance"
                                    ) : isAllowanceInsufficient ? (
                                        "Approve USDC"
                                    ) : (
                                        "Pay Now"
                                    )}
                                </Button>
                            )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// --- HELPER COMPONENT: EMPTY STATE ---
function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
            <Ban className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">{message}</p>
        </div>
    )
}

// --- HELPER COMPONENT: DATE HEADER ---
function DateHeader({
    date,
    color,
    label,
}: {
    date: string
    color: string
    label?: string
}) {
    // 1. Definition color mapping explicitly
    const colorMap: { [key: string]: string } = {
        orange: "text-orange-500",
        blue: "text-blue-500",
        gray: "text-gray-500",
    }

    // 2. Get class based on props color
    const iconColorClass = colorMap[color] || "text-gray-500"
    return (
        <div className="flex items-center gap-2">
            <CalendarDays className={`h-4 w-4 ${iconColorClass}`} />
            <div className="flex items-center gap-2">
                {label && (
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {label}
                    </span>
                )}
                <h3 className="rounded-md bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                    {date}
                </h3>
            </div>
        </div>
    )
}
