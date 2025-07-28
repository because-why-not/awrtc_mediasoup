import { ConnectionId, ILogger, NetEventType, NetworkEvent, Protocol } from "awrtc_signaling";
import { IncomingPeerEndpoint, OutgoingPeerEndpoint, SdpMessageObj } from "./PeerEndpoint";
import { SoupServer } from "./SoupServer";


/** DummyProtocol's are used in place of WebsocketProtocol if our own server acts like a WebRTC PeerConnection. 
 * 
 * By default the signaling server simply connects two clients:
 * ClientA - WebsocketProtcolA - SignalingPeerA - Server - SignalingPeerB - WebsocketProtocolB - ClientB 
 * 
 * For mediasoup support our own server acts like a client e.g.: 
 * ClientA - WebsocketProtcolA - SignalingPeerA - Server - SignalingPeerB - DummyProtocol - Mediasoup peer
 * In this case "SignalingPeerB" is controlled by our server not another client. 
 * 
 * 
 */
abstract class DummyProtocol extends Protocol {

    private mIsDisposed = false;

    protected mLog: ILogger;

    constructor(logger: ILogger) {
        super();
        this.mLog = logger;
    }

    //Send is called when the client tries to send a message to us
    public send(evt: NetworkEvent) {
        //console.log("dummy received", evt);

        if (evt.Type == NetEventType.ReliableMessageReceived) {
            //assuming we are connected to a regular peer sending 
            const incMessage = this.evtToString(evt);
            console.log(this.getIdentity() + "INC: ", incMessage);

            this.handleMessage(incMessage, evt.ConnectionId);
        } else if (evt.Type == NetEventType.Disconnected) {
            console.log(this.getIdentity() + " disconnected from client side.");
            //we remove out dummy peer if our only connection gets cut
            this.triggerClosure();
        }
    }

    //Use this to close the protocol, related SignalingPeer and tell the Controller to clean up the peer
    public triggerClosure() {
        if (this.mIsDisposed)
            return;
        //This tells the SignalingPeer the connection got closed. 
        // this triggers Disconnected events to be send to all other peers that might be connected
        // and the Controller gets told to delete the peer and this protocol
        this.mListener.onNetworkClosed();
    }

    protected forwardMessage(outMessage: string, id: ConnectionId) {

        console.log(this.getIdentity() + "OUT: ", outMessage);
        const response = this.stringToEvt(outMessage, id);
        this.mListener.onNetworkEvent(response);
    }


    private evtToString(evt: NetworkEvent): string {
        if (evt.Type != NetEventType.ReliableMessageReceived) {
            console.error("Must be of type ReliableMessageReceived");
            return null;
        }
        let output = "";
        if (evt.MessageData != null) {
            const chars = new Uint16Array(evt.MessageData.buffer, evt.MessageData.byteOffset, evt.MessageData.byteLength / 2);

            for (let i = 0; i < chars.length; i++) {
                output += String.fromCharCode(chars[i]);
            }
        }
        return output;
    }

    private stringToEvt(input: string, id: ConnectionId): NetworkEvent {
        // Convert string to Uint16Array (reverse of the original process)
        const chars = new Uint16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            chars[i] = input.charCodeAt(i);
        }

        // Create Uint8Array from the Uint16Array buffer
        const messageData = new Uint8Array(chars.buffer);

        // Create and return the NetworkEvent
        return new NetworkEvent(NetEventType.ReliableMessageReceived, id, messageData);
    }
    abstract handleMessage(msg: string, id: ConnectionId): Promise<void>;
    dispose(): void {
        if (this.mIsDisposed == false) {
            this.mIsDisposed = true;
            console.log(this.getIdentity() + " disposed");
        }
    }
}

/**DummyInProtocol handles signaling for incoming streams. 
 */
export class DummyInProtocol extends DummyProtocol {
    //send is triggered by the clients own peer. Meaning
    //these are the messages we receive 

    constructor(public soupPeer: IncomingPeerEndpoint, public soupServer: SoupServer, logger: ILogger) {
        super(logger);
    }
    async handleMessage(msg: string, id: ConnectionId) {
        try {
            const json : unknown = JSON.parse(msg);

            // Check if it's a random number
            if (typeof json === 'number') {
                console.log('Received random number:', json);

                this.forwardMessage("0", id);
            } else if (typeof json === 'object' 
                && json !== null 
                && 'type' in json && 'sdp' in json 
                && (json.type === 'offer' || json.type === 'answer')) {

                console.log(`Received ${json.type}:`, json.sdp);

                if (json.type === 'offer') {
                    // Handle offer logic here
                    console.log('Processing offer...');
                    const offerObj = json as SdpMessageObj;
                    const answerObj = await this.soupServer.processOffer(this.soupPeer, offerObj);
                    const answerMsg = JSON.stringify(answerObj);

                    this.forwardMessage(answerMsg, id);
                } else {
                    // Handle answer logic here
                    console.error("Received an answer from an incoming connection. This should not be possible.", json);
                }
            } else if (typeof json === 'object' && json !== null &&
                'candidate' in json && 'sdpMLineIndex' in json && 'sdpMid' in json) {
                //We currently ignore candidates the client offers. The server's sdp contains the only valid
                //ice candidates
            } else {
                // If none of the above, it's an unknown message type
                console.warn('Unknown message type received:', json);
            }
        } catch (error) {
            console.error('Failed to parse JSON message:', error);
            console.error('Original message:', msg);
        }
    }
    getIdentity(): string {
        return "DummyIn"
    }

    public triggerConnectionRequest(address: string): void {

        const id = new ConnectionId(2);
        this.mListener.onNetworkEvent(new NetworkEvent(NetEventType.NewConnection, id, address));
    }
}
/** DummyOutProtocol handles outgoing streams.
 * 
 */
export class DummyOutProtocol extends DummyProtocol {
    //send is triggered by the clients own peer. Meaning
    //these are the messages we receive 

    constructor(public soupPeer: OutgoingPeerEndpoint, public soupServer: SoupServer, logger: ILogger) {
        super(logger);
    }
    async handleMessage(msg: string, id: ConnectionId): Promise<void> {
        try {
            const json: unknown = JSON.parse(msg);
            if (typeof json === 'number') {
                // we ignore random numbers to negotiate offer / answer roles. 
                // server must always send an offer for outgoing streams
            } else if (typeof json === 'object' && json !== null &&
                'type' in json && 'sdp' in json &&
                (json.type === 'offer' || json.type === 'answer')) {

                console.log(`Received ${json.type}:`, json.sdp);

                if (json.type === 'offer') {


                    // Example: await peerConnection.setRemoteDescription(json);
                } else if (json.type === 'answer') {
                    // Handle answer logic here
                    console.log('Processing answer...');

                    // Handle offer logic here
                    console.log('Processing offer...');
                    const sdp = await this.soupServer.processAnswer(this.soupPeer, json as SdpMessageObj);
                    const answerObj = { type: "answer", sdp: sdp };
                    const answerMsg = JSON.stringify(answerObj);
                    this.forwardMessage(answerMsg, id);
                }
            } else if (typeof json === 'object' && json !== null &&
                'candidate' in json && 'sdpMLineIndex' in json && 'sdpMid' in json) {
                //We currently ignore candidates the client offers. The server's sdp contains the only valid
                //ice candidates

            } else {
                // If none of the above, it's an unknown message type
                console.warn('Unknown message type received:', json);
            }


        } catch (error) {
            console.error('Failed to parse JSON message:', error);
            console.error('Original message:', msg);
        }
    }
    getIdentity(): string {
        return "DummyOut"
    }

    public async triggerConnectionRequest(address: string): Promise<void> {

        const id = new ConnectionId(17000);
        this.mListener.onNetworkEvent(new NetworkEvent(NetEventType.NewConnection, id, address));

        const offerObj = await this.soupServer.createOffer(this.soupPeer);
        console.log(offerObj);
        const offerMsg = JSON.stringify(offerObj);
        this.forwardMessage(offerMsg, id);
    }
}