import { Consumer, Producer, WebRtcTransport } from "mediasoup/types";
import WebSocket from "ws";
import { SdpEndpoint } from "./external/mediasoup-sdp-bridge";

export class SoupEndpoint {

}
//Represents a single client on the webpage
//A client has 1 websocket connections, 1 optional incoming peer (being forwarded to other users) and n outgoing stream
export class ClientEndpoint {
    public username: string;
    public ws: WebSocket;

    //Transport for incoming stream from the client
    public incomingPeer: IncomingPeerEndpoint = null;

    //outgoing stream to the client
    public outgoingPeer: { [id: string]: OutgoingPeerEndpoint } = {};

    constructor(ws) {
        this.ws = ws;
        this.username = "Anonymous";
    }

    public send(message: SignalingMessage) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
}

export interface PeerEndpoint {
    transport: WebRtcTransport;
    sdpEndpoint: SdpEndpoint;
}
//Endpoint for media going out to the client
export interface OutgoingPeerEndpoint extends PeerEndpoint {
    consumers: Consumer[];
}
//Endpoint for media coming from the client
export interface IncomingPeerEndpoint extends PeerEndpoint {
    producers: Producer[];
    consumerPeers: OutgoingPeerEndpoint[];
}


export interface SignalingMessage {
    type: string;
    message: string;
    id?: string;
}


export interface SdpMessageObj {
    //offer or answer
    type: string;
    sdp: string;
}