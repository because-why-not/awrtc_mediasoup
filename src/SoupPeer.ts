import { Consumer, Producer, WebRtcTransport } from "mediasoup/types";
import { SdpEndpoint } from "./external/mediasoup-sdp-bridge";


export type PeerConnectionStateCallback = (state: SoupPeerConnectionState) => void;

export enum SoupPeerConnectionState {
    Connecting = "Connecting",
    Connected = "Connected",
    //disconnect or close called
    Closed = "Closed"
}
/**
 * 
 */
export class SoupPeer {
    protected mTransport: WebRtcTransport;
    protected mSdpEndpoint: SdpEndpoint;

    private mState: SoupPeerConnectionState;
    public get state() {
        return this.mState;
    }

    
    constructor(transport: WebRtcTransport, sdpEndpoint: SdpEndpoint) {
        this.mTransport = transport;
        this.mSdpEndpoint = sdpEndpoint;
        this.mState = SoupPeerConnectionState.Connecting;
    }
    private connectionStateCallback?: Set<PeerConnectionStateCallback> = new Set<PeerConnectionStateCallback>();

    public addListener(cb: PeerConnectionStateCallback): void {
        this.connectionStateCallback.add(cb);
    }

    public remListener(cb: PeerConnectionStateCallback): void {
        this.connectionStateCallback.add(cb);
    }

    private triggerStateChange(state: SoupPeerConnectionState) {
        this.mState = state;

        for (const cb of this.connectionStateCallback) {
            try {
                cb(state);
            } catch (err) {
                console.warn("Error in connectionStateCallback callback:", err);
            }
        }
    }
    public init() {
        this.mTransport.on('icestatechange', (iceState) => {
            console.log("icestatechange", iceState);
            if (iceState === 'disconnected' || iceState === 'closed') {
                console.warn('WebRtcTransport "icestatechange" event [iceState:%s], closing peer', iceState);
                //exit
            }
        });

        this.mTransport.on('sctpstatechange', (sctpState) => {
            console.log("sctpstatechange", sctpState);

        });

        this.mTransport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                console.warn('WebRtcTransport "dtlsstatechange" event [dtlsState:%s], closing peer', dtlsState);
                if (this.mState != SoupPeerConnectionState.Closed) {
                    this.close();
                }
            } else if (dtlsState == "connected") {
                this.triggerStateChange(SoupPeerConnectionState.Connected);
            }
        });

        this.mTransport.observer.on('newdataproducer', (dataProducer) => {
            console.warn('newdataproducer', dataProducer);
            //dataProducers.set(dataProducer.id, dataProducer);
            //dataProducer.observer.on('close', () => dataProducers.delete(dataProducer.id));
        });

        this.mTransport.observer.on('newdataconsumer', (dataConsumer) => {
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


    public close() {
        this.mTransport.close();

        if (this.mState != SoupPeerConnectionState.Closed) {
            this.triggerStateChange(SoupPeerConnectionState.Closed);
        }
        this.connectionStateCallback.clear();
    }
}
//Endpoint for media going out to the client
export class OutgoingSoupPeer extends SoupPeer {

    private mConsumers: Consumer[] = [];

    constructor(transport: WebRtcTransport, sdpEndpoint: SdpEndpoint, consumers: Consumer[]) {
        super(transport, sdpEndpoint);
        this.mConsumers = consumers;
    }

    public override init() {
        super.init();
        this.mTransport.on('dtlsstatechange', (dtlsState) => {
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
        this.mConsumers.forEach((x) => x.close());
    }

    //Creates an offer for an ougoing stream with 1 audio and 1 video track
    //Leave as async for now in case we need a more complex createOffer in the future
    // eslint-disable-next-line @typescript-eslint/require-await
    public async createOffer(): Promise<SdpMessageObj> {

        const sdp = this.mSdpEndpoint.createOffer();

        const offerObj = { type: "offer", sdp: sdp };
        return offerObj;
    }

    //Processes an answer for outgoing streams after the client responded to createOffer above
    public async processAnswer(answerObj: SdpMessageObj) {
        await this.mSdpEndpoint.processAnswer(answerObj.sdp);
    }
}
//Endpoint for media coming from the client
export class IncomingSoupPeer extends SoupPeer {

    private mProducers: Producer[] = [];
    public get producers(): readonly Producer[] {
        return this.mProducers;
    }

    private mConsumerPeers: Set<OutgoingSoupPeer> = new Set<OutgoingSoupPeer>();

    public override init() {
        super.init();
        this.mTransport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                console.log("Incoming stream failed. Won't recover.");
                //the incoming stream failed -> cleanup all our relay streams
                this.mConsumerPeers.forEach(x => {
                    x.close();
                });
                this.mTransport.close();
            }
        });
    }

    public override close(): void {
        super.close();
        this.mConsumerPeers.forEach((x) => {
            console.log("Closing receiver's consumer because sender stopped.");
            x.close();
        });
    }

    //processes an incoming offer for an incoming stream
    //and returns an answer
    public async processOffer(offerObj: SdpMessageObj): Promise<SdpMessageObj> {

        const offerRes = await this.mSdpEndpoint.processOffer(offerObj.sdp, undefined);
        this.mProducers = offerRes.producers;

        const sdpAnswer = this.mSdpEndpoint.createAnswer();

        const answerObj = { type: "answer", sdp: sdpAnswer };
        return answerObj;
    }

    public addConsumer(outgoingPeer: OutgoingSoupPeer) {
        this.mConsumerPeers.add(outgoingPeer);
        outgoingPeer.addListener((state) => {
            if(state == SoupPeerConnectionState.Closed)
                this.removeConsumer(outgoingPeer);
        });
    }

    public removeConsumer(outgoingPeer: OutgoingSoupPeer): void {
        this.mConsumerPeers.delete(outgoingPeer);
    }
}

//result of createOffer / createAnswer messages on the client side
export interface SdpMessageObj {
    //offer or answer
    type: string;
    sdp: string;
}