import { IClientOptions, IClientPublishOptions } from "mqtt"
import MQTT, { AsyncMqttClient } from 'async-mqtt'
import { MqttConfig, Zones } from "./config"
import { now } from "./utils"

export class Publisher {

    mqttClient: AsyncMqttClient;

    constructor(private config: MqttConfig, private zones: Zones) {
        const options = {
            will: {
                topic: `${config.baseTopic}/bridge/availability`,
                payload: 'offline',
                retain: true,
            },
            username: config.username,
            password: config.password,
            clientId: "SIA2MQTT4HA"
        } as IClientOptions

        this.mqttClient = MQTT.connect(config.brokerUrl, options)

        this.mqttClient.on("connect", () => {
            console.log(`${now()} Connected to MQTT broker`)
            this.publishOnline()
        })

        this.mqttClient.on("reconnect", () => {
            console.log(`${now()} Reconnecting to MQTT broker`)
        })

        this.mqttClient.on("disconnect", () => {
            console.log(`${now()} Disconnected from MQTT broker`)
        })
    }

    // ... resten av klassen oförändrad, bara publishOnline() catch-blocket:
    private async publishOnline(): Promise<any> {
        // ... all befintlig kod oförändrad ...
        try {
            await this.publish("bridge/availability", "online", true)
            for (let entity in statusEntities) {
                let thisEntity = statusEntities[entity]
                let entityDiscoveryTopic = `${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.unique_id}/config`
                await this.publishJSONdiscovery(entityDiscoveryTopic, statusEntities[entity], true)
            }
            for (let entity in zoneEntities) {
                let thisEntity = zoneEntities[entity]
                let entityDiscoveryTopic = `${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.unique_id}/config`
                await this.publishJSONdiscovery(entityDiscoveryTopic, zoneEntities[entity], true)
            }
        } catch (error) {
            console.log(`${now()} publishOnline() error: ${error}`)
        }
    }

    // publish(), publishJSON(), publishJSONdiscovery() oförändrade
}
