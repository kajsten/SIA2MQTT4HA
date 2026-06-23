import { Event } from "../events/Event"
import { Publisher } from "../publisher"
import { Zones } from "../config"
import { now } from "../utils"

const stateMap: { [code: string]: { state: boolean }} = {
    "RO": { state: true },
    "RC": { state: false }
}

export async function handleZoneEvent(event: Event, zones: Zones, publisher: Publisher): Promise<any> {
    let message = {}

    if (!zones[parseInt(event.zone)]) {
        console.log(`${now()} Zone does not exist in config`)
        return
    } else if (!stateMap[event.code]) {
        console.log(`${now()} Invalid state`)
        return
    } else {
        switch (zones[parseInt(event.zone)].type.toUpperCase()) {
            case "PIR":
                message = { occupancy: stateMap[event.code].state }
                break
            case "DOOR":
                message = { contact: stateMap[event.code].state }
                break
            default:
                console.log(`${now()} Type is unknown`)
                return
        }
    }
    console.log(`${now()} ZoneEvent: ${event.zone} ${stateMap[event.code].state}`)
    return await publisher.publishJSON(`zone_${event.zone}`, message)
}
