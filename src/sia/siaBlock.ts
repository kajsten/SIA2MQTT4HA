import { FunctionCodes } from "../functionCodes"

const BASE_PARITY = 0xFF
const HEADER_LENGTH = 2
const PACKING_LENGTH = HEADER_LENGTH + 1
const CHECK_OFFSET = 0x40

const CP850_SV: { [byte: number]: string } = {
    0x8E: 'Ä', 0x84: 'ä', 0x8F: 'Å', 0x86: 'å', 0x99: 'Ö', 0x94: 'ö'
}

function decodeText(buf: Buffer): string {
    return Array.from(buf).map(b => CP850_SV[b] ?? String.fromCharCode(b)).join('')
}

export class SIABlock {

    constructor(public funcCode: FunctionCodes, public data: string) {
    }

    toBuffer(): Buffer {
        const dataLength = this.data.length
        const bufferLength = dataLength + PACKING_LENGTH
        const checkLength = dataLength + CHECK_OFFSET
        let buffer = Buffer.alloc(bufferLength)

        buffer.writeInt8(checkLength, 0)
        buffer.writeInt8(this.funcCode, 1)

        let parity = BASE_PARITY
        parity ^= checkLength
        parity ^= this.funcCode

        this.data.split('').forEach((char, index) => {
            buffer.write(char, index + HEADER_LENGTH)
            parity ^= buffer[index + HEADER_LENGTH]
        })

        buffer[bufferLength - 1] = parity

        return buffer
    }

    static fromBuffer(buffer: Buffer): SIABlock {

        try {
            const dataLength = this.checkParity(buffer)
            const funcCode = buffer[1]
            const data = decodeText(buffer.subarray(HEADER_LENGTH, HEADER_LENGTH + dataLength))
            
            return new SIABlock(funcCode, data)
        } catch (error) {
            throw error
        }
    }

    static checkParity(buffer: Buffer): number {

        let dataLength = buffer[0] - CHECK_OFFSET
        let parity = BASE_PARITY
        let bufferLength = dataLength + PACKING_LENGTH

        for (let i = 0; i < bufferLength; i++) {
            parity ^= buffer[i]
        }

        if (parity != 0) {
            throw new Error("Parity Error")
        }

        return dataLength
    }
}
