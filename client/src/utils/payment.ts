// func that converts currency to subcurrency : 1$ = 100c
export const convertToSubcurrency = (num: number) => {
    return Math.round(parseFloat(num.toFixed(2)) * 100);
}