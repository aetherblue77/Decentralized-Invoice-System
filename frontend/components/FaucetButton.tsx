"use client"

import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useChainId,
    useAccount,
} from "wagmi"
import { parseUnits } from "viem"
import { getContractAddress } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Loader2, Coins } from "lucide-react"
import { toast } from "sonner"
import { useEffect, useState } from "react"

const mintAbi = [
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "mint",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const

export default function FaucetButton() {
    const { address } = useAccount()
    const chainId = useChainId()
    const addresses = getContractAddress(chainId)

    const { data: hash, writeContract, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        { hash },
    )

    // State for Loading Overlay
    const [isLoading, setIsLoading] = useState(false)

    const handleMint = () => {
        if (!addresses?.mockUSDC || !address) return
        writeContract({
            address: addresses.mockUSDC as `0x${string}`,
            abi: mintAbi,
            functionName: "mint",
            args: [address, parseUnits("1000", 18)],
        })
    }

    useEffect(() => {
        const isLoadingNow = isPending || isConfirming
        setIsLoading(isLoadingNow)
    }, [isPending, isConfirming])

    useEffect(() => {
        if (isSuccess) {
            toast.success("Success! You received 1,000 MockUSDC 💰")
        }
    }, [isSuccess])

    return (
        <>
            {/* --- GLOBAL OVERLAY --- */}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="flex items-center gap-3 rounded-full border border-gray-100 bg-white px-6 py-3 shadow-2xl duration-300 animate-in fade-in zoom-in">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">
                                Processing Transaction...
                            </span>
                            <span className="text-[10px] text-gray-500">
                                Please do not close this window
                            </span>
                        </div>
                    </div>
                </div>
            )}
            <Button
                variant="outline"
                size="sm"
                onClick={handleMint}
                disabled={isPending || isConfirming}
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
                {isPending || isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        {" "}
                        <Coins className="mr-2 h-4 w-4" /> Get Free USDC{" "}
                    </>
                )}
            </Button>
        </>
    )
}
