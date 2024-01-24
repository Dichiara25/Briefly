export function getDateIn30Days(): Date {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 30);
    return currentDate;
}
