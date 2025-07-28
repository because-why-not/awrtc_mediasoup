import * as mediasoup from "mediasoup";
import * as RtpHelper from "./rtphelper";
import * as SdpBridge from "./external/mediasoup-sdp-bridge/index";
import { Worker, WebRtcServer, Router, RtpCodecCapability, WebRtcTransportOptions, RtpCapabilities, WebRtcTransport, Consumer, TransportListenInfo } from "mediasoup/types"
import { IncomingPeerEndpoint, OutgoingPeerEndpoint, SdpMessageObj } from "./PeerEndpoint";


console.log(mediasoup.version);
console.log(mediasoup.workerBin);


class SoupServer {

    public soupWorker: Worker;
    public webRtcServer: WebRtcServer;
    public router: Router;

    constructor() {
        this.soupWorker = null;
        this.webRtcServer = null;
        this.router = null;
    }
    async init(listenInfos: TransportListenInfo[]) {
        //setup media soup and handlers
        mediasoup.setLogEventListeners({
            ondebug: undefined,
            onwarn: (namespace, log) => {
                console.warn(`mediasoup onwarn: ${namespace} ${log}`);
            },
            onerror: (namespace, log, error) => {
                //TODO: We keep getting log spam webrtc::GoogCcNetworkController::OnRemoteBitrateReport() | Received REMB for packet feedback only GoogCC
                if (log.endsWith("Received REMB for packet feedback only GoogCC"))
                    return;
                if (error) {
                    console.error(`mediasoup onerror: ${namespace} ${log} err msg: ${error}`);
                } else {
                    console.error(`mediasoup onerror: ${namespace} ${log}`);
                }
            }
        });
        mediasoup.observer.on("newworker", (worker) => {
            console.log("new worker created [pid:%d]", worker.pid);
        });
        this.soupWorker = await mediasoup.createWorker(
            {
                logLevel: "warn",
                //dtlsCertificateFile : "/home/foo/dtls-cert.pem",
                //dtlsPrivateKeyFile  : "/home/foo/dtls-key.pem",
                appData: { foo: 123 }
            });

        this.soupWorker.on('died', () => {
            console.error(
                'mediasoup Worker died, exiting  in 2 seconds... [pid:%d]', this.soupWorker.pid);

            setTimeout(() => process.exit(1), 2000);
        });
        this.soupWorker.observer.on("newwebrtcserver", (webRtcServer) => {
            console.log("new WebRTC server created [id:%s]", webRtcServer.id);
        });


        const rtpCapabilities = mediasoup.getSupportedRtpCapabilities();

        console.log(JSON.stringify(rtpCapabilities));



        this.router = await this.soupWorker.createRouter({ mediaCodecs: RtpHelper.serverMinCodecs });

        this.router.on("workerclose", () => {
            console.log("worker closed so router closed");
        });
        this.router.on("listenererror", (eventName, error) => {
            console.error("router exception", eventName, error);
        })

        this.webRtcServer = await this.soupWorker.createWebRtcServer(
            {
                listenInfos:listenInfos
            });
    }



    public async createOutgoingPeer(from: IncomingPeerEndpoint): Promise<OutgoingPeerEndpoint> {

        const outgoingTransport = await this.createTransport()
        const outgoingSdpEndpoint = await this.createSdpEndpoint(outgoingTransport);
        const endpointRtpCapabilities = RtpHelper.rtpMinimal;

        const consumer1 = await outgoingTransport
            .consume({
                producerId: from.producers[0].id,
                rtpCapabilities: endpointRtpCapabilities,
                enableRtx: true,
                paused: false,
                ignoreDtx: true
            })
            .catch((error) => console.error("transport.consume() failed:", error));
        const consumer2 = await outgoingTransport
            .consume({
                producerId: from.producers[1].id,
                rtpCapabilities: endpointRtpCapabilities,
                enableRtx: true,
                paused: false,
                ignoreDtx: true
            })
            .catch((error) => console.error("transport.consume() failed:", error));

        outgoingSdpEndpoint.addConsumer(consumer1 as Consumer);
        outgoingSdpEndpoint.addConsumer(consumer2 as Consumer);



        //OUTGOING DC TEST
        //this.addSendingDataChannels(outgoingTransport, outgoingSdpEndpoint, to);
        //OUTGOING DC TEST END



        const consumers = [consumer1 as Consumer, consumer2 as Consumer];

        const outgingPeer = new OutgoingPeerEndpoint();
        outgingPeer.transport = outgoingTransport;
        outgingPeer.sdpEndpoint = outgoingSdpEndpoint; 
        outgingPeer.consumers = consumers;


        from.consumerPeers.push(outgingPeer);

        return outgingPeer;
    }

    //Creates an offer for an ougoing stream with 1 audio and 1 video track
    //Leave as async for now in case we need a more complex createOffer in the future
    // eslint-disable-next-line @typescript-eslint/require-await
    public async createOffer(outgingPeer: OutgoingPeerEndpoint) : Promise<SdpMessageObj>{

        const sdp = outgingPeer.sdpEndpoint.createOffer();

        const offerObj = { type: "offer", sdp: sdp };
        return offerObj;
    }

    //Processes an answer for outgoing streams after the client responded to createOffer above
    public async processAnswer(outgoingPeer: OutgoingPeerEndpoint, answerObj: SdpMessageObj) {
        await outgoingPeer.sdpEndpoint.processAnswer(answerObj.sdp);
    }


    public async createIncomingPeer(): Promise<IncomingPeerEndpoint> {

        const incomingTransport = await this.createTransport();
        const incomingSdpEndpoint = this.createSdpEndpoint(incomingTransport);
        const incomingPeer = new IncomingPeerEndpoint();
        incomingPeer.transport = incomingTransport;
        incomingPeer.sdpEndpoint = incomingSdpEndpoint;
        incomingPeer.init();
        return incomingPeer;
    }


    //processes an incoming offer for an incoming stream
    //and returns an answer
    public async processOffer(incomingPeer: IncomingPeerEndpoint, offerObj: SdpMessageObj): Promise<SdpMessageObj> {

        const offerRes = await incomingPeer.sdpEndpoint.processOffer(offerObj.sdp, undefined);
        incomingPeer.producers = offerRes.producers;

        const sdpAnswer = incomingPeer.sdpEndpoint.createAnswer();

        const answerObj = { type: "answer", sdp: sdpAnswer };
        return answerObj;
    }
    createSdpEndpoint(transport: WebRtcTransport ): SdpBridge.SdpEndpoint {
        const endpointRtpCapabilities = RtpHelper.rtpMinimal;
        return SdpBridge.createSdpEndpoint(transport, endpointRtpCapabilities);
    }



    private async createTransport(): Promise<WebRtcTransport> {


        const sctpCapabilities = { numStreams: { OS: 1024, MIS: 1024 } }

        const webRtcTransportOptions =
        {
            initialAvailableOutgoingBitrate: 1000000,
            maxSctpMessageSize: 262144,
            // Additional options that are not part of WebRtcTransportOptions.
            maxIncomingBitrate: 1500000,
            minimumAvailableOutgoingBitrate: 600000,
            webRtcServer: this.webRtcServer,
            iceConsentTimeout: 20,
            enableSctp: true,
            numSctpStreams: sctpCapabilities.numStreams,
            enableUdp: true,
            enableTcp: true
        };


        const transport =
            await this.router.createWebRtcTransport(webRtcTransportOptions);

        const { maxIncomingBitrate } = webRtcTransportOptions;

        // If set, apply max incoming bitrate limit.
        if (maxIncomingBitrate) {
            try { await transport.setMaxIncomingBitrate(maxIncomingBitrate); }
            catch (error) { }
        }

        return transport
    }
}

export { SoupServer };