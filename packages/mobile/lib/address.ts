import { Address, getAddress } from "viem";

export function formatAddressForDisplay(address: Address, startChars = 8, endChars = 6) {
    const checksummed = getAddress(address);
    return `${checksummed.slice(0, startChars)}...${checksummed.slice(-endChars)}`;
}