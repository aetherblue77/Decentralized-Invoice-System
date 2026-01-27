import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import contractAddresses from "@/constants/contractAddresses.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContractAddresses {
  [key: string]: {
    InvoiceSystem: string[];
    MockUSDC: string[];
  };
}

export function getContractAddress(chainId: number) {
  const chainIdStr = chainId.toString();
  const addresses = contractAddresses as ContractAddresses;

  if (!addresses[chainIdStr]) {
    return null;
  }

  const invoiceSystem = addresses[chainIdStr].InvoiceSystem.slice(-1)[0];
  const mockUSDC = addresses[chainIdStr].MockUSDC.slice(-1)[0];

  return { invoiceSystem, mockUSDC };
}