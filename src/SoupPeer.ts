import { Consumer, Producer, WebRtcTransport } from "mediasoup/types";
import { SdpEndpoint } from "./external/mediasoup-sdp-bridge";


export type PeerConnectionStateCallback = (state: SoupPeerConnectionState) => void;

export enum SoupPeerConnectionState {
    Connecting = "Connecting",
    Connected = "Connected",
    EndedOrFailed = "EndedOrFailed"
}
export class SoupPeer {
    protected transport: WebRtcTransport;
    protected sdpEndpoint: SdpEndpoint;
    private mState: SoupPeerConnectionState;
    public get State(){
        return this.mState;
    }
    constructor(transport: WebRtcTransport, sdpEndpoint: SdpEndpoint) {
        this.transport = transport;
        this.sdpEndpoint = sdpEndpoint;
        this.mState = SoupPeerConnectionState.Connecting;
    }
    private connectionStateCallback?: PeerConnectionStateCallback;

    public setListener(cb: PeerConnectionStateCallback): void {
        this.connectionStateCallback = cb;
    }

    private triggerStateChange(state: SoupPeerConnectionState) {
        this.mState = state;
        this.connectionStateCallback?.(state);
    }
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
                if (this.mState != SoupPeerConnectionState.EndedOrFailed) {
                    this.triggerStateChange(SoupPeerConnectionState.EndedOrFailed);
                }
            }else if(dtlsState == "connected"){
                    this.triggerStateChange(SoupPeerConnectionState.Connected);
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

    public close(){
        this.transport.close();
    }
}
//Endpoint for media going out to the client
export class OutgoingSoupPeer extends SoupPeer {
    public consumers: Consumer[] = [];


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

    public override close(): void {
        super.close();
        //TODO: consumers cleanup required?
    }

    //Creates an offer for an ougoing stream with 1 audio and 1 video track
    //Leave as async for now in case we need a more complex createOffer in the future
    // eslint-disable-next-line @typescript-eslint/require-await
    public async createOffer(): Promise<SdpMessageObj> {

        const sdp = this.sdpEndpoint.createOffer();

        const offerObj = { type: "offer", sdp: sdp };
        return offerObj;
    }

    //Processes an answer for outgoing streams after the client responded to createOffer above
    public async processAnswer(answerObj: SdpMessageObj) {
        await this.sdpEndpoint.processAnswer(answerObj.sdp);
    }
}
//Endpoint for media coming from the client
export class IncomingSoupPeer extends SoupPeer {
    public producers: Producer[] = [];
    public consumerPeers: OutgoingSoupPeer[] = [];

    public override init() {
        super.init();
        this.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                console.log("Incoming stream failed. Won't recover.");
                //the incoming stream failed -> cleanup all our relay streams
                this.consumerPeers.forEach(x => {
                    x.close();
                });
                this.transport.close();
            }
        });
    }

    public override close(): void {
        super.close();        
        this.consumerPeers.forEach((x) => {
            console.log("Closing receiver's consumer because sender stopped.");
            x.close();
        });
    }

    //processes an incoming offer for an incoming stream
    //and returns an answer
    public async processOffer(offerObj: SdpMessageObj): Promise<SdpMessageObj> {

        const offerRes = await this.sdpEndpoint.processOffer(offerObj.sdp, undefined);
        this.producers = offerRes.producers;

        const sdpAnswer = this.sdpEndpoint.createAnswer();

        const answerObj = { type: "answer", sdp: sdpAnswer };
        return answerObj;
    }
}

//result of createOffer / createAnswer messages on the client side
export interface SdpMessageObj {
    //offer or answer
    type: string;
    sdp: string;
}