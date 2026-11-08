export function now(): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Stockholm",
        hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date())

    const p: { [type: string]: string } = {}
    for (const part of parts) p[part.type] = part.value

    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
}
