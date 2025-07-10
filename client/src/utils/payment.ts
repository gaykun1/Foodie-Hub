export const convertToSubcurrency = (num: number) => {
    return Math.round(parseInt(num.toFixed(2)) * 100);
}