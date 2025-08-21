import * as mediasoup from "mediasoup";
import * as RtpHelper from "./rtphelper";
import * as SdpBridge from "./external/mediasoup-sdp-bridge/index";
import {
  Worker,
  WebRtcServer,
  Router,
  WebRtcTransport,
  Consumer,
  TransportListenInfo,
} from "mediasoup/types";
import { IncomingSoupPeer, OutgoingSoupPeer } from "./SoupPeer";
import { ILogger } from "awrtc_signaling";

console.log(`mediasoup version: ${mediasoup.version}`);

/* This is a bare bone mediasoup server. It only provides the basic functionality needed
 * to create incoming and outgoing peers with the other awrtc based apps.
 *
 * You likely want to customize the numbers of servers, webRtcServer and router configurations
 * beyond what is implemented here.
 */
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
          console.error(
            `mediasoup onerror: ${namespace} ${log} err msg: ${error}`,
          );
        } else {
          console.error(`mediasoup onerror: ${namespace} ${log}`);
        }
      },
    });
    mediasoup.observer.on("newworker", (worker) => {
      console.log("new worker created [pid:%d]", worker.pid);
    });
    this.soupWorker = await mediasoup.createWorker({
      logLevel: "warn",
    });

    this.soupWorker.on("died", () => {
      console.error(
        "mediasoup Worker died, exiting  in 2 seconds... [pid:%d]",
        this.soupWorker.pid,
      );

      setTimeout(() => process.exit(1), 2000);
    });
    this.soupWorker.observer.on("newwebrtcserver", (webRtcServer) => {
      console.log("new WebRTC server created [id:%s]", webRtcServer.id);
    });

    const rtpCapabilities = mediasoup.getSupportedRtpCapabilities();

    console.log(JSON.stringify(rtpCapabilities));

    this.router = await this.soupWorker.createRouter({
      mediaCodecs: RtpHelper.serverMinCodecs,
    });

    this.router.on("workerclose", () => {
      console.log("worker closed so router closed");
    });
    this.router.on("listenererror", (eventName, error) => {
      console.error("router exception", eventName, error);
    });

    this.webRtcServer = await this.soupWorker.createWebRtcServer({
      listenInfos: listenInfos,
    });
  }

  public close() {
    this.webRtcServer.close();
    this.router.close();
    this.soupWorker.close();
  }

  public async createOutgoingPeer(
    from: IncomingSoupPeer,
    logger: ILogger,
  ): Promise<OutgoingSoupPeer> {
    const outgoingTransport = await this.createTransport();
    const outgoingSdpEndpoint = this.createSdpEndpoint(outgoingTransport);
    const endpointRtpCapabilities = RtpHelper.rtpMinimal;
    const consumers: Consumer[] = [];

    for (const producer of from.producers) {
      const consumer = await outgoingTransport
        .consume({
          producerId: producer.id,
          rtpCapabilities: endpointRtpCapabilities,
          enableRtx: true,
          paused: producer.paused,
          ignoreDtx: true,
        })
        .catch((error) => console.error("transport.consume() failed:", error));
      outgoingSdpEndpoint.addConsumer(consumer as Consumer);
      consumers.push(consumer as Consumer);
    }
    const outgingPeer = new OutgoingSoupPeer(
      outgoingTransport,
      outgoingSdpEndpoint,
      consumers,
      logger,
    );
    from.addConsumer(outgingPeer);

    return outgingPeer;
  }

  public async createIncomingPeer(logger: ILogger): Promise<IncomingSoupPeer> {
    const incomingTransport = await this.createTransport();
    const incomingSdpEndpoint = this.createSdpEndpoint(incomingTransport);
    const incomingPeer = new IncomingSoupPeer(
      incomingTransport,
      incomingSdpEndpoint,
      logger,
    );
    incomingPeer.init();
    return incomingPeer;
  }

  createSdpEndpoint(transport: WebRtcTransport): SdpBridge.SdpEndpoint {
    const endpointRtpCapabilities = RtpHelper.rtpMinimal;
    return new SdpBridge.SdpEndpoint(transport, endpointRtpCapabilities);
  }

  private async createTransport(): Promise<WebRtcTransport> {
    const sctpCapabilities = { numStreams: { OS: 1024, MIS: 1024 } };

    //This is based on the mediasoup example and likely needs customization
    const webRtcTransportOptions = {
      initialAvailableOutgoingBitrate: 1000000,
      maxSctpMessageSize: 262144,
      // Additional options that are not part of WebRtcTransportOptions.
      maxIncomingBitrate: 1500000,
      minimumAvailableOutgoingBitrate: 600000,
      webRtcServer: this.webRtcServer,
      iceConsentTimeout: 20,
      // this is not used currently but might be useful in the future
      enableSctp: true,
      numSctpStreams: sctpCapabilities.numStreams,
      enableUdp: true,
      enableTcp: true,
    };

    const transport = await this.router.createWebRtcTransport(
      webRtcTransportOptions,
    );

    const { maxIncomingBitrate } = webRtcTransportOptions;

    // If set, apply max incoming bitrate limit.
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {
        console.error(error)
      }
    }

    return transport;
  }
}

export { SoupServer };
