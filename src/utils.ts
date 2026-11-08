export function now(): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Stockholm",
        hour12: false,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date())

    const p: { [type: string]: string } = {}
    for (const part of parts) p[part.type] = part.value

    // Vissa Node-versioner visar midnatt som "24" med hour12:false
    const hour = p.hour === "24" ? "00" : p.hour

    return `${p.year}-${p.month}-${p.day} ${hour}:${p.minute}:${p.second}`
}
