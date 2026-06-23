export function now(): string {
    return new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })
}
