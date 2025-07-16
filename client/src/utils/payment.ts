export const convertToSubcurrency = (num: number) => {
    return Math.round(parseFloat(num.toFixed(2)) * 100);
}