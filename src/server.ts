import { Publisher } from "./publisher"
import { getConfig, parseZones } from "./config"
import { SIAServer } from "./sia/siaServer"
import { handleZoneEvent } from "./handlers/ZoneEventHandler"
import { Event } from "./events/Event"
import { handleSystemEvent, sendInitialSystemEventState } from "./handlers/SystemEventHandler"
import { now } from "./utils"

console.log(`${now()} Starting SIA2MQTT4HA`)

const CONFIG_FILE = "/data/options.json"
const config = getConfig(CONFIG_FILE)

console.log(`${now()} Config loaded: ${JSON.stringify(config)}`)

let zones = parseZones(config)
if (zones == null) {
    console.log(`${now()} Couldn't parse zones, maybe there are none`)
}

const publisher = new Publisher(config.mqtt, zones)
const siaServer = new SIAServer(config.sia)

setTimeout(() => {
    const address = siaServer.server.address()
    console.log(`${now()} Listening on: ${JSON.stringify(address)}`)
}, 2000)

sendInitialStates(publisher)

siaServer.on("ZoneEvent", async function (event: Event) {
    if (zones) {
        await handleZoneEvent(event, zones, publisher)
    }
})

siaServer.on("SystemEvent", async function (event: Event) {
    await handleSystemEvent(event, publisher)
})

siaServer.on("Event", async function (event: Event) {
    await publisher.publishJSON("event", event)
})

async function sendInitialStates(publisher: Publisher) {
    try {
        await sendInitialSystemEventState(publisher)
    } catch (error) {
        console.log(`${now()} Error publishing initial states`)
    }
}
