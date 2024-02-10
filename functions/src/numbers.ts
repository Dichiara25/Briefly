function canBeStrictlyCastedToNumber(str: string): boolean {
    return /^-?\d+(\.\d+)?$/.test(str.trim());
}

export function isLimitValid(limit: string): boolean {
    const canBeCastedToNumber = canBeStrictlyCastedToNumber(limit);

    if (canBeCastedToNumber) {
        const castedLimit: number = parseInt(limit);

        return castedLimit > 0;
    }

    return false;
}