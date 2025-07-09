import * as mediasoup from "mediasoup";
import * as RtpHelper from "./rtphelper";
import * as SdpBridge from "./external/mediasoup-sdp-bridge/index";
import { Worker, WebRtcServer, Router, RtpCodecCapability, WebRtcTransportOptions, RtpCapabilities, WebRtcTransport, Consumer, TransportListenInfo } from "mediasoup/types"
import { IncomingPeerEndpoint, OutgoingPeerEndpoint, SdpMessageObj } from "./PeerEndpoint";


console.log(mediasoup.version);
console.log(mediasoup.workerBin);

const LOCAL_IP = '192.168.1.46';

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

        let outgoingTransport = await this.createTransport()
        let outgoingSdpEndpoint = await this.createSdpEndpoint(outgoingTransport);
        const endpointRtpCapabilities = RtpHelper.rtpMinimal;

        let consumer1 = await outgoingTransport
            .consume({
                producerId: from.producers[0].id,
                rtpCapabilities: endpointRtpCapabilities,
                enableRtx: true,
                paused: false,
                ignoreDtx: true
            })
            .catch((error) => console.error("transport.consume() failed:", error));
        let consumer2 = await outgoingTransport
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

        const outgingPeer = { transport: outgoingTransport, sdpEndpoint: outgoingSdpEndpoint, consumers: consumers };


        outgingPeer.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                //an outgoing stream failed. 
                //TODO: This chould either mean the user left or has connection issues and needs to reconnect this specific peer
                console.log("Outgoing stream failed. Won't recover.");
            }
        });
        from.consumerPeers.push(outgingPeer);

        return outgingPeer;
    }

    //Creates an offer for an ougoing stream with 1 audio and 1 video track
    public async createOffer(outgingPeer: OutgoingPeerEndpoint) {

        const sdpOffer = outgingPeer.sdpEndpoint.createOffer();
        return sdpOffer;
    }

    //Processes an answer for outgoing streams after the client responded to createOffer above
    public async processAnswer(outgoingPeer: OutgoingPeerEndpoint, answerObj: SdpMessageObj) {
        await outgoingPeer.sdpEndpoint.processAnswer(answerObj.sdp);
    }


    public async createIncomingPeer(): Promise<IncomingPeerEndpoint> {

        const incomingTransport = await this.createTransport();
        const incomingSdpEndpoint = await this.createSdpEndpoint(incomingTransport);
        //TODO: unclear if 2nd argument scalabilityMode is needed / used

        const incomingPeer = {
            transport: incomingTransport,
            sdpEndpoint: incomingSdpEndpoint,
            producers: [],
            consumerPeers: []
        };
        //await this.addReceivingDataChannels(client);

        //OUTGOING DC TEST via incoming peer
        //this.addSendingDataChannels(incomingTransport, incomingSdpEndpoint, client);
        //OUTGOING DC TEST
        return incomingPeer;
    }


    //processes an incoming offer for an incoming stream
    //and returns an answer
    public async processOffer(incomingPeer: IncomingPeerEndpoint, offerObj): Promise<string> {

        const offerRes = await incomingPeer.sdpEndpoint.processOffer(offerObj.sdp, undefined);
        incomingPeer.producers = offerRes.producers;

        incomingPeer = incomingPeer;
        incomingPeer.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                //the incoming stream failed -> cleanup all our relay streams
                incomingPeer.consumerPeers.forEach(x => {
                    x.transport.close();
                });
                incomingPeer.transport.close();
            }
        });

        const sdpAnswer = incomingPeer.sdpEndpoint.createAnswer();

        return sdpAnswer;
    }
    async createSdpEndpoint(transport): Promise<SdpBridge.SdpEndpoint> {
        const endpointRtpCapabilities = RtpHelper.rtpMinimal;
        return await SdpBridge.createSdpEndpoint(transport, endpointRtpCapabilities as RtpCapabilities);
    }



    private async createTransport(): Promise<WebRtcTransport> {


        const sctpCapabilities = { numStreams: { OS: 1024, MIS: 1024 } }

        const webRtcTransportOptions =
        {
            listenInfos:
                [
                    {
                        protocol: 'udp',
                        ip: process.env.MEDIASOUP_LISTEN_IP || LOCAL_IP,
                        announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
                        portRange:
                        {
                            min: 40000,
                            max: 49999,
                        }
                    },
                    {
                        protocol: 'tcp',
                        ip: process.env.MEDIASOUP_LISTEN_IP || LOCAL_IP,
                        announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
                        portRange:
                        {
                            min: 40000,
                            max: 49999,
                        }
                    }
                ],
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


        let transport =
            await this.router.createWebRtcTransport(webRtcTransportOptions as any);


        transport.on('icestatechange', (iceState) => {
            console.log("icestatechange", iceState);
            if (iceState === 'disconnected' || iceState === 'closed') {
                console.warn('WebRtcTransport "icestatechange" event [iceState:%s], closing peer', iceState);

                //exit
            }
        });

        transport.on('sctpstatechange', (sctpState) => {
            console.log("sctpstatechange", sctpState);

        });

        transport.on('dtlsstatechange', (dtlsState) => {
            console.log("dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                console.warn('WebRtcTransport "dtlsstatechange" event [dtlsState:%s], closing peer', dtlsState);

                //exit 
            }
        });

        transport.observer.on('newdataproducer', (dataProducer) => {
            console.warn('newdataproducer', dataProducer);
            //dataProducers.set(dataProducer.id, dataProducer);
            //dataProducer.observer.on('close', () => dataProducers.delete(dataProducer.id));
        });

        transport.observer.on('newdataconsumer', (dataConsumer) => {
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