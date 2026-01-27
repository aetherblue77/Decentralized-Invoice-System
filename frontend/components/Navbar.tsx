"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FileText } from "lucide-react"
import UserBalance from "./UserBalance"

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-gray-200 bg-white px-6 py-4 md:px-10">
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-600 p-2">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-blue-900">
                    Decentralized Invoice
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <UserBalance />
                <ConnectButton showBalance={false} />
            </div>
        </nav>
    )
}
