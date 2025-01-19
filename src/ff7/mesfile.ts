import {Parser} from 'binary-parser';
import { decodeText, encodeText } from './fftext';

const text = new Parser().string('', {greedy: true});

const ffText = new Parser()
    .wrapped('', {
        wrapper: decodeText,
        type: text,
        readUntil: function(byte: number) {
            return byte === 0xFF;
        }
    })
    
const mesMessage = new Parser()
    .uint16le('offset')
    .pointer('text', {
        type: ffText,
        offset: 'offset'
    })

const mesParser = new Parser()
    .uint16le('numMessages')
    .array('messages', {
        type: mesMessage,
        length: 'numMessages'
    })

interface Message {
    offset: number;
    text: string;
}

interface Messages {
    numMessages: number;
    messages: Message[];
}

export class MesFile {
    data: Messages;

    constructor(data: Uint8Array) {
        this.data = mesParser.parse(data);
    }

    readMessage(index: number) {
        return this.data.messages[index];
    }

    setMessage(index: number, message: string) {
        this.data.messages[index].text = message;
    }

    writeMessages(): Uint8Array {
        const out = new Uint8Array(0x1000);
        const view = new DataView(out.buffer);
        const numMessages = this.data.messages.length;
        let pos = 0;

        view.setUint16(pos, numMessages, true);
        pos += 2;

        let offset = 2 + numMessages * 2;

        for (const message of this.data.messages) {
            const text = encodeText(message.text);

            view.setUint16(pos, offset, true);
            pos += 2;

            out.set(text, offset);

            offset += text.length;
        }

        return out;
    }
}