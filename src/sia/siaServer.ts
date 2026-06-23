import { createServer, Server, Socket } from 'net'
import { SiaServerConfig } from "../config"
import { SIABlock } from "./siaBlock"
import { FunctionCodes } from "../functionCodes"
import { Event } from "../events/Event"
import * as events from "events"
import { now } from "../utils"

const ACK_SIA_BLOCK = new SIABlock(FunctionCodes.acknowledge, "")

export class SIAServer extends events.EventEmitter {

    server: Server

    constructor(config: SiaServerConfig) {
        super()
        this.server = createServer()
        this.server.on('connection', (socket: Socket) => this.handleConnection(socket))
        this.server.listen(config.port, '0.0.0.0', () => this.listening())
        this.server.on('error', (err) => console.log(`${now()} Server error: ${err}`))
    }

    listening() {
        console.log(`${now()} SIA2MQTT4HA server listening`)
        this.emit("Ready")
    }

    handleConnection(socket: Socket) {
        const emitter = this
        let eventText = ""
        let accountId = ""
        let event = new Event()

        const handleData = function (data: Buffer) {
            let block

            try {
                block = SIABlock.fromBuffer(data)
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`${now()} Error parsing received data: ${error.message}. Closing connection. Check Reporting encryption is disabled on panel.`)
                } else {
                    console.log(`${now()} Unknown error parsing received data ${error}. Closing connection. Check Reporting encryption is disabled on panel.`)
                }
                return
            }

            switch (block.funcCode) {
                case FunctionCodes.account_id:
                    accountId = block.data
                    break

                case FunctionCodes.new_event:
                case FunctionCodes.old_event:
                    console.log(`${now()} Raw event data: [${block.data}]`)
                    event = Event.parse(block.data)
                    break

                case FunctionCodes.ascii:
                    eventText = block.data
                    console.log(`${now()} Received event code: ${event.code} zone: ${event.zone} text: ${block.data}`)
                    eventText = eventText.replace(/^ /, "").replace(/ +/, " ")

                    if (event != null && accountId != "" && event.time != "" && event.code != "" && eventText != "") {
                        event.accountId = accountId
                        event.text = eventText

                        emitter.emit("Event", event)

                        if ((event.code == "RC" || event.code == "RO") && event.zone.length > 0) {
                            emitter.emit("ZoneEvent", event)
                        } else {
                            emitter.emit("SystemEvent", event)
                        }
                    } else {
                        console.log(`${now()} Could not parse event, discarding`)
                    }
                    break

                case FunctionCodes.end_of_data:
                    event = new Event()
                    break

                default:
                    console.log(`${now()} Unhandled funcCode: ${FunctionCodes[block.funcCode]}`)
                    break
            }

            socket.write(ACK_SIA_BLOCK.toBuffer())
        }

        socket.on('data', handleData)
    }
}
