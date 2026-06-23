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

    private async publishOnline(): Promise<any> {
        const availability = [
            {
                topic: `${this.config.baseTopic}/bridge/availability`
            }
        ]

        let device = {
            identifiers: ["sia2mqtt4ha_alarmpanel"],
            name: "AlarmPanel",
            manufacturer: "SIA2MQTT4HA",
            model: "SIA2MQTT4HA App",
            sw_version: "0.2"
        }

        let statusEntities = [
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/set_status`,
                json_attributes_topic: `${this.config.baseTopic}/set_status`,
                name: "Set Status",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_set_status",
                value_template: '{{ value_json.status }}',
                icon: "mdi:security",
                platform: "sensor"
            },
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/last_event`,
                json_attributes_topic: `${this.config.baseTopic}/last_event`,
                name: "Last Event",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_last_event",
                value_template: '{{ value_json.status }}',
                icon: "mdi:comment",
                platform: "sensor"
            },
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/comms_test`,
                json_attributes_topic: `${this.config.baseTopic}/comms_test`,
                name: "Comms Status",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_comms_test",
                value_template: '{{ value_json.status }}',
                icon: "mdi:check-network",
                platform: "sensor",
                force_update: true
            },
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/triggered`,
                json_attributes_topic: `${this.config.baseTopic}/triggered`,
                name: "Triggered",
                type: "binary_sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_triggered",
                value_template: '{{ value_json.state }}',
                payload_off: false,
                payload_on: true,
                icon: "mdi:bell",
                platform: "binary_sensor"
            },
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/event`,
                json_attributes_topic: `${this.config.baseTopic}/event`,
                name: "Event",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_event",
                value_template: '{{ value_json.code }}',
                icon: "mdi:flag",
                platform: "sensor",
                entity_category: "diagnostic"
            }
        ]

        let zoneEntities = []
        for (let i in this.zones) {
            let device_class
            let template
            if (this.zones[i].type.toUpperCase() == "DOOR") {
                device_class = "door"
                template = "contact"
            } else {
                device_class = "motion"
                template = "occupancy"
            }

            let zoneEntity = {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/zone_${i}`,
                json_attributes_topic: `${this.config.baseTopic}/zone_${i}`,
                name: this.zones[i].name,
                type: "binary_sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_zone_" + i,
                value_template: `{{ value_json.${template} }}`,
                device_class: device_class,
                payload_off: false,
                payload_on: true,
                platform: "binary_sensor"
            }

            zoneEntities.push(zoneEntity)
        }

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

    public async publish(subTopic: string, data: string, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, data,
                { retain: retain || false } as IClientPublishOptions)
        } catch (error) {
            throw `publish() error ${error}`
        }
    }

    public async publishJSON(subTopic: string, data: object, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, JSON.stringify(data),
                { retain: retain || false } as IClientPublishOptions)
        } catch (error) {
            throw `publishJSON() error ${error}`
        }
    }

    public async publishJSONdiscovery(discoveryTopic: string, data: object, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${discoveryTopic}`, JSON.stringify(data),
                { retain: retain || false } as IClientPublishOptions)
        } catch (error) {
            throw `publishJSONdiscovery() error ${error}`
        }
    }
}
