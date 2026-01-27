"use client"

import { useAccount, useReadContract, useChainId } from "wagmi"
import { formatUnits, erc20Abi } from "viem"
import { getContractAddress } from "@/lib/utils"
import { Wallet, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"

export default function UserBalance() {
    const { address } = useAccount()
    const chainId = useChainId()
    const addresses = getContractAddress(chainId)

    // 1. Get MockUSDC Balance with use ERC20 ABI Standard
    const {
        data: balance,
        isLoading,
        refetch,
        isRefetching,
    } = useReadContract({
        address: addresses?.mockUSDC as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        // force component to refetch data every 3 seconds
        query: {
            refetchInterval: 3000, // 3000 ms = 3 seconds
        }
    })

    // 2. Auto Refresh Balance every component appear (opsional)
    useEffect(() => {
        refetch()
    }, [address, refetch])

    if (!address) return null

    return (
        <div className="hidden h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-1.5 shadow-sm transition-all hover:bg-gray-50 md:flex">
            {/* Icon Kecil */}
            <Wallet className="h-3.5 w-3.5 text-blue-600" />
            
            {/* Nominal Saldo */}
            {isLoading ? (
                <Skeleton className="h-4 w-16 bg-gray-200" />
            ) : (
                <span className="font-sans text-sm font-bold text-gray-900">
                    {balance ? Number(formatUnits(balance, 18)).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0"} 
                    <span className="ml-1 text-xs font-normal text-gray-500">USDC</span>
                </span>
            )}
        </div>
    )
}
