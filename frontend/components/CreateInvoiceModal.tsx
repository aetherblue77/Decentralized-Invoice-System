"use client"

import { useEffect, useState } from "react"
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useChainId,
    useAccount,
} from "wagmi"
import { parseUnits, isAddress } from "viem"
import { getContractAddress } from "@/lib/utils"
import invoiceAbi from "@/constants/invoiceSystemAbi.json"
import { toast } from "sonner"
import { Loader2, Plus, Wallet, FileText } from "lucide-react" // Nice Icon

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Description } from "@radix-ui/react-dialog"

const MAX_NOTE_LENGTH = 60

interface CreateInvoiceModalProps {
    onSuccess?: () => void
}

export default function CreateInvoiceModal({
    onSuccess,
}: CreateInvoiceModalProps) {
    const [open, setOpen] = useState(false) // Controller for open/close Modal
    const { address } = useAccount()

    // State Form
    const [client, setClient] = useState("")
    const [amount, setAmount] = useState("")
    const [note, setNote] = useState("")
    const [dueDate, setDueDate] = useState("")

    // This function to clear Form
    const clearForm = () => {
        setClient("")
        setAmount("")
        setNote("")
        setDueDate("")
        reset()
    }

    // Wagmi Hooks
    const chainId = useChainId()
    const addresses = getContractAddress(chainId)
    const { data: hash, writeContract, isPending, reset } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        },
    )

    const isLoading = isPending || isConfirming

    const handleCreate = async () => {
        // 1. Validate Empty Field
        if (!client || !addresses?.mockUSDC || !amount || !dueDate || !note) {
            toast.error("Missing Information", {
                description: "Please fill all required fields.",
            })
            return
        }
        // 2. Validate Address
        if (!isAddress(client)) {
            toast.error("Invalid Address Format", {
                description:
                    "Make sure the address is correct.",
            })
            return
        }

        // 3. Validate when goal address is the same as sender/seller address
        if (client.toLowerCase() === address?.toLowerCase()) {
            toast.error("Can't Create Invoice for Yourself", {
                description: "Please enter a different address.",
            })
            return
        }

        // 4. Validate Amount
        if (Number(amount) <= 0) {
            toast.error("Invalid Amount", {
                description: "Amount must be greater than 0.",
            })
            return
        }

        // Conversion Date to Unix Timestamp
        const unixDueDate = Math.floor(new Date(dueDate).getTime() / 1000)

        try {
            writeContract({
                address: addresses.invoiceSystem as `0x${string}`,
                abi: invoiceAbi,
                functionName: "createInvoice",
                args: [
                    client,
                    parseUnits(amount, 18),
                    addresses.mockUSDC,
                    BigInt(unixDueDate),
                    note,
                ],
            })
        } catch (error) {
            console.error(error)
            toast.error("Failed to initiate transaction")
        }
    }

    // Reset When Form closed manually
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                clearForm()
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [open, reset])

    // Reset Form when Success
    useEffect(() => {
        if (isSuccess) {
            toast.success("Invoice created on Blockchain! 🚀", {
                description: "Wait the seconds to see the invoice in the list.",
            })
            setOpen(false)
            setClient("")
            setAmount("")
            setNote("")
            setDueDate("")
            reset()

            // Call refresh function from page.tsx
            if (onSuccess) {
                // Give little bit delay (2 detik)
                setTimeout(() => {
                    onSuccess()
                }, 2000)
            }
        }
    }, [isSuccess, reset, onSuccess])

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (isLoading && !isOpen) return
                setOpen(isOpen)
            }}
        >
            <DialogTrigger asChild>
                <Button className="h-auto bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    New Invoice
                </Button>
            </DialogTrigger>

            <DialogContent
                onInteractOutside={(e) => {
                    if (isLoading) e.preventDefault()
                }}
                className="bg-white dark:border-gray-800 dark:bg-gray-200 sm:max-w-[425px]"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Wallet className="h-5 w-5 text-blue-500">
                            Create WEB3 Invoice
                        </Wallet>
                    </DialogTitle>
                    <DialogDescription>
                        Create an immutable invoice on the blockchain.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Client Address Input */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="client"
                            className="text-sm font-semibold text-gray-700"
                        >
                            Bill to (Wallet Address)
                        </Label>
                        <Input
                            id="client"
                            disabled={isLoading}
                            placeholder="0x..."
                            className="border-gray-300 font-mono text-sm focus:border-blue-500 focus:ring-blue-500"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                        />
                    </div>

                    {/* Amount & Due Date Input (Grid 2 columns) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="amount"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Amount (USDC)
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-bold text-gray-500">
                                    $
                                </span>
                                <Input
                                    id="amount"
                                    disabled={isLoading}
                                    type="number"
                                    placeholder="0.00"
                                    className="border-gray-300 pl-7 focus:border-blue-500"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Input Date */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="date"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Due Date
                            </Label>
                            <Input
                                id="date"
                                disabled={isLoading}
                                type="date"
                                className="block border-gray-300 focus:border-blue-500"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Decription Note */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label
                                htmlFor="note"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Description
                            </Label>
                            <span
                                className={`text-xs ${note.length >= MAX_NOTE_LENGTH ? "text-red-500" : "text-gray-400"}`}
                            >
                                {note.length}/{MAX_NOTE_LENGTH}
                            </span>
                        </div>
                        <div className="relative">
                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="note"
                                disabled={isLoading}
                                maxLength={MAX_NOTE_LENGTH}
                                placeholder="e.g. Project Development Fee..."
                                className="border-gray-300 pl-9 focus:border-blue-500"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">
                            *Short description saves gas fees.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleCreate}
                        disabled={isLoading}
                        className="w-full bg-blue-600 py-5 font-bold text-white hover:bg-blue-700"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            "Create Invoice"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
