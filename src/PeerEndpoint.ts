import { Consumer, Producer, WebRtcTransport } from "mediasoup/types";
import { SdpEndpoint } from "./external/mediasoup-sdp-bridge";


export class PeerEndpoint {
    transport: WebRtcTransport;
    sdpEndpoint: SdpEndpoint;

    public init() {
        this.transport.on('icestatechange', (iceState) => {
            console.log("icestatechange", iceState);
            if (iceState === 'disconnected' || iceState === 'closed') {
                console.warn('WebRtcTransport "icestatechange" event [iceState:%s], closing peer', iceState);

                //exit
            }
        });

        this.transport.on('sctpstatechange', (sctpState) => {
            console.log("sctpstatechange", sctpState);

        });

        this.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                console.warn('WebRtcTransport "dtlsstatechange" event [dtlsState:%s], closing peer', dtlsState);

                //exit 
            }
        });

        this.transport.observer.on('newdataproducer', (dataProducer) => {
            console.warn('newdataproducer', dataProducer);
            //dataProducers.set(dataProducer.id, dataProducer);
            //dataProducer.observer.on('close', () => dataProducers.delete(dataProducer.id));
        });

        this.transport.observer.on('newdataconsumer', (dataConsumer) => {
            console.warn('newdataconsumer', dataConsumer);

            //dataConsumers.set(dataConsumer.id, dataConsumer);
            //dataConsumer.observer.on('close', () => dataConsumers.delete(dataConsumer.id));
        });
        /*
                await transport.enableTraceEvent(['bwe']);
                transport.on('trace', (trace) => {
        
                    console.debug(
                        'transport "trace" event [transportId:%s, trace.type:%s, trace:%o]',
                        transport.id, trace.type, trace);
                });
        */
    }
}
//Endpoint for media going out to the client
export class OutgoingPeerEndpoint extends PeerEndpoint {
    consumers: Consumer[]= [];


    public override init() {
        super.init();
        this.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                //an outgoing stream failed. 
                //TODO: This chould either mean the user left or has connection issues and needs to reconnect this specific peer
                console.log("Outgoing stream failed. Won't recover.");
            }
        });
    }
}
//Endpoint for media coming from the client
export class IncomingPeerEndpoint extends PeerEndpoint {
    producers: Producer[] = [];
    consumerPeers: OutgoingPeerEndpoint[]= [];

    public override init() {
        super.init();
        this.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                console.log("Incoming stream failed. Won't recover.");
                //the incoming stream failed -> cleanup all our relay streams
                this.consumerPeers.forEach(x => {
                    x.transport.close();
                });
                this.transport.close();
            }
        });



    }
}
//result of createOffer / createAnswer messages on the client side
export interface SdpMessageObj {
    //offer or answer
    type: string;
    sdp: string;
}