import { Consumer, Producer, WebRtcTransport } from "mediasoup/types";
import { SdpEndpoint } from "./external/mediasoup-sdp-bridge";


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
//result of createOffer / createAnswer messages on the client side
export interface SdpMessageObj {
    //offer or answer
    type: string;
    sdp: string;
}