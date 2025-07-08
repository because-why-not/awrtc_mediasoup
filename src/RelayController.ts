import { PeerPool, SignalingPeer, WebsocketNetworkServer, AppConfig, ConnectionId, NetEventType, NetworkEvent, Protocol } from "awrtc_signaling";
import { SoupServer } from "./soupserver";
import { IncomingPeerEndpoint, OutgoingPeerEndpoint } from "./clientendpoint";



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
abstract class DummyProtocol extends Protocol{

    private mIsDisposed = false;

    //Send is called when the client tries to send a message to us
    public send(evt: NetworkEvent) {
        //console.log("dummy received", evt);

        if (evt.Type == NetEventType.ReliableMessageReceived) {
            //assuming we are connected to a regular peer sending 
            const incMessage = this.evtToString(evt);
            console.log(this.GetLogPrefix()+"INC: ", incMessage);

            this.handleMessage(incMessage, evt.ConnectionId);
        }else if(evt.Type == NetEventType.Disconnected){
            console.log(this.GetLogPrefix() + " disconnected from client side.");
            //we remove out dummy peer if our only connection gets cut
            this.triggerClosure();
        }
    }

    //Use this to close the protocol, related SignalingPeer and tell the Controller to clean up the peer
    public triggerClosure(){
        if(this.mIsDisposed)
            return;
        //This tells the SignalingPeer the connection got closed. 
        // this triggers Disconnected events to be send to all other peers that might be connected
        // and the Controller gets told to delete the peer and this protocol
        this.mListener.onNetworkClosed();
    }

    protected forwardMessage(outMessage: string, id: ConnectionId){

        console.log(this.GetLogPrefix()+"OUT: ", outMessage);
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
            let chars = new Uint16Array(evt.MessageData.buffer, evt.MessageData.byteOffset, evt.MessageData.byteLength / 2);

            for (var i = 0; i < chars.length; i++) {
                output += String.fromCharCode(chars[i]);
            }
        }
        return output;
    }

    private stringToEvt(input: string, id: ConnectionId): NetworkEvent {
        const eventType: NetEventType = NetEventType.ReliableMessageReceived;

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
    dispose(): void{
        if(this.mIsDisposed == false)
        {
            this.mIsDisposed = true;
            console.log(this.GetLogPrefix() + " disposed");
        }
    }
}

/**DummyInProtocol handles signaling for incoming streams. 
 */
class DummyInProtocol extends DummyProtocol {
    //send is triggered by the clients own peer. Meaning
    //these are the messages we receive 

    constructor(public soupPeer: IncomingPeerEndpoint, public soupServer: SoupServer) {
        super();
    }
    async handleMessage(msg: string, id: ConnectionId) {
        try {
            const json = JSON.parse(msg);

            // Check if it's a random number
            if (typeof json === 'number') {
                console.log('Received random number:', json);

                this.forwardMessage("0", id);
            } else if (typeof json === 'object' && json !== null &&
                'type' in json && 'sdp' in json &&
                (json.type === 'offer' || json.type === 'answer')) {

                console.log(`Received ${json.type}:`, json.sdp);

                if (json.type === 'offer') {
                    // Handle offer logic here
                    console.log('Processing offer...');
                    const sdp = await this.soupServer.processOffer(this.soupPeer, json);
                    const answerObj = { type: "answer", sdp: sdp };
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
    GetLogPrefix(): string {
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
class DummyOutProtocol extends DummyProtocol {
    //send is triggered by the clients own peer. Meaning
    //these are the messages we receive 

    constructor(public soupPeer: OutgoingPeerEndpoint, public soupServer: SoupServer) {
        super();
    }
    async handleMessage(msg: string, id: ConnectionId): Promise<void>{
        try {
            const json = JSON.parse(msg);
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
                    const sdp = await this.soupServer.processAnswer(this.soupPeer, json);
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
    GetLogPrefix(): string {
        return "DummyOut"
    }

    public async triggerConnectionRequest(address: string) : Promise<void> {

        const id = new ConnectionId(17000);
        this.mListener.onNetworkEvent(new NetworkEvent(NetEventType.NewConnection, id, address));

        const offer = await this.soupServer.createOffer(this.soupPeer);
        console.log(offer);
        const offerObj = { type: "offer", sdp: offer };
        const offerMsg = JSON.stringify(offerObj);
        this.forwardMessage(offerMsg, id);
    }
}
interface AddressSenderDict {
    [key: string]: Sender;
};
interface AddressReceiversDict {
    [key: string]: Receiver[];
};

class Sender{
    //WebRTC / Mediasoup specific peer
    public soupPeer: IncomingPeerEndpoint;

    //signaling peer that connects us to the client side peer
    public dummyPeer: SignalingPeer;

    public protocol: DummyInProtocol;
}

class Receiver{
    public soupPeer: OutgoingPeerEndpoint;
    public dummyPeer: SignalingPeer;

    public protocol: DummyOutProtocol;
}

export class RelayController extends PeerPool {
    private mAppConfig: AppConfig;
    public get name(): string {
        return this.mAppConfig.name;
    }

    private mAddressSharing = false;

    private mSoupServer: SoupServer;

    //currently active senders for each address
    private mSenders: AddressSenderDict = {};
    //list of receivers for each address
    private mReceivers: AddressReceiversDict = {};




    constructor(config: AppConfig, soupServer: SoupServer) {
        super();
        this.mAppConfig = config;
        if (this.mAppConfig.address_sharing) {
            this.mAddressSharing = this.mAppConfig.address_sharing;
        }
        this.mSoupServer = soupServer;
    }

    private addSender(address:string, dummyPeer: SignalingPeer, dummyProtocol: DummyInProtocol, soupPeer: IncomingPeerEndpoint){

        const sender = new Sender();
        sender.dummyPeer = dummyPeer;
        sender.protocol  = dummyProtocol
        sender.soupPeer = soupPeer;

        this.mSenders[address] = sender;
        this.mReceivers[address] = [];
        this.mConnections.push(dummyPeer);


        
        sender.soupPeer.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("Sender dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                //clean up
                this.removeSender(address, sender);
            }
        });
    }

    private removeSender(address: string, sender: Sender){
        //make sure everything is closed if not yet done
        sender.soupPeer.transport.close();
        sender.soupPeer.consumerPeers.forEach((x)=>{
            console.log("Closing receiver's consumer because sender stopped.");
            x.transport.close();
        });
        sender.protocol.triggerClosure();

        if(!this.mSenders[address])
        {
            console.warn("Tried to cleanup sender  " + sender.protocol.GetLogPrefix() + " address " + address + " but no sender found.");
            return;
        }
        delete this.mSenders[address];

        //Workaround: It appears dtlsstatechange never triggers if we manually close receiver's transport
        //-> force remove receivers otherwise we leak memory
        const receivers = this.mReceivers[address];
        receivers.forEach(receiver=>this.removeReceiver(address, receiver));
        

        //if there are no receivers cleanup the empty list
        //otherwise the receivers get their own events later and then cleanup
        //removed for now because we force all receivers to be removed above because dtlsstatechange doesn't trigger when we call .close
        //if(this.mReceivers[address].length === 0){
        //    console.log("No receivers left for " + address + ". Cleaning up receiver list");
        //    delete this.mReceivers[address];
        //}
    }

    private removeReceiver(address: string, receiver: Receiver){

        //make sure everything is closed if not yet done
        receiver.soupPeer.transport.close();
        receiver.protocol.triggerClosure();

        //remove from receiver list
        if(!this.mReceivers[address])
        {
            console.warn("Tried to cleanup receiver  " + receiver.protocol.GetLogPrefix() + " address " + address + " but no receiver found.");
            return;
        }

        this.mReceivers[address] = this.mReceivers[address].filter(item => item !== receiver);
        if(this.mReceivers[address].length === 0 && !this.mSenders[address]){
            console.log("No receivers left for " + address + ". Cleaning up receiver list");
            delete this.mReceivers[address];
        }
    }

    private addReceiver(address:string, dummyPeer: SignalingPeer, dummyProtocol: DummyOutProtocol, soupPeer: OutgoingPeerEndpoint){

        const receiver = new Receiver();
        receiver.dummyPeer = dummyPeer;
        receiver.protocol  = dummyProtocol
        receiver.soupPeer = soupPeer;

        this.mReceivers[address].push(receiver);
        this.mConnections.push(dummyPeer);


        
        receiver.soupPeer.transport.on('dtlsstatechange', (dtlsState) => {
            console.log("Receiver dtlsstatechange", dtlsState);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                this.removeReceiver(address, receiver);
            }
        });
    }


    public async createNewIncomingRelay(address: string, incomingSignalingPeer: SignalingPeer) {
        console.log("crreating incoming peer for " + address);
        //create incoming peer
        let soupPeer = await this.mSoupServer.createIncomingPeer();

        //create a new SignalingPeer to connect to the incomingSignalingPeer
        //instead of events coming from websockets we feed the events into it via DummyProtocol
        //data will flow: server side logic -> DummyProtocol -> outgoingSignalingPeer -> incomingSignalingPeer -> websocket -> client
        const dummyProtocol = new DummyInProtocol(soupPeer, this.mSoupServer);
        const dummyPeer = new SignalingPeer(this, dummyProtocol);
        


        this.addSender(address, dummyPeer, dummyProtocol, soupPeer);

        //trigger a new signaling connection with the client side
        dummyProtocol.triggerConnectionRequest(address);
    }

    public async createNewOutgoingRelay(address: string, clientPeer: SignalingPeer) {
        //create incoming peer
        let senderAddress = address.substring(0, address.length - 4);
        senderAddress = senderAddress + "_snd";
        console.log("creating outgoing peer for " + senderAddress);

        //get the peer that receives the stream
        const sender = this.mSenders[senderAddress];

        //create the peer that sends the stream out
        const soupPeer = await this.mSoupServer.createOutgoingPeer(sender.soupPeer);
        const dummyProtocol = new DummyOutProtocol(soupPeer, this.mSoupServer);
        const dummyPeer = new SignalingPeer(this, dummyProtocol);
        this.addReceiver(senderAddress, dummyPeer, dummyProtocol, soupPeer);

        //send large number to force the other side into answer mode
        //trigger a new signaling connection with the client side
        dummyProtocol.triggerConnectionRequest(address);
        //create offer
    }

    public onListeningRequest(peer: SignalingPeer, address: string): void {
        if (this.isAddressAvailable(address)) {

            console.log("RELAY: New address " + address);

            this.addListener(peer, address);
            peer.acceptListening(address);
            if (address.endsWith("_snd")) {
                this.createNewIncomingRelay(address, peer);
            } else if (address.endsWith("_rec")) {
                this.createNewOutgoingRelay(address, peer);
            }

            if (this.hasAddressSharing()) {
                //address sharing is active. connect to every endpoint already listening on this address
                this.acceptJoin(address, peer);
            }
        } else {
            peer.denyListening(address);
        }
    }

    //If multiple users listen on the same address we all connect them to each other
    //(hasAddressSharing flag is true)
    public acceptJoin(address: string, client: SignalingPeer): void {

        var serverConnections = this.getServerConnection(address);

        //in join mode every connection is incoming as everyone listens together
        if (serverConnections != null) {

            for (var v of serverConnections) {
                //avoid connecting the peer to itself
                if (v != client) {
                    v.acceptIncomingConnection(client);
                    client.acceptIncomingConnection(v);
                }
            }
        }
    }

    public onStopListening(client: SignalingPeer, address: string): void {

        this.removeServer(client, address);
    }


    public onConnectionRequest(client: SignalingPeer, address: string, newConnectionId: ConnectionId): void {

        //all peers listening to address
        //if this contains 0 peers -> connection fails because no one is listening
        //If this contains 1 peer -> connect to that peer
        //TODO: if it contains multiple peers -> trigger an error as connect can only be used for 1-to-1
        var serverConnections = this.getServerConnection(address);
        if (serverConnections != null && serverConnections.length == 1) {

            const otherPeer = serverConnections[0];
            //tell the other user they received an incoming connection
            otherPeer.acceptIncomingConnection(client);
            //tell this peer about the new connection
            client.acceptOutgoingConnection(otherPeer, newConnectionId);
        } else {
            //if address is not in use or it is in multi join mode -> connection fails
            client.denyConnection(address, newConnectionId);
        }
    }


    public hasAddressSharing(): boolean {
        return this.mAddressSharing;
    }


    //Tests if the address is available for use. 
    //returns true in the following cases
    //the address is longer than the maxAddressLength and the server the address is not yet in use or address sharing is active
    public isAddressAvailable(address: string): boolean {
        if (address.length <= this.maxAddressLength // only allow addresses shorter than maxAddressLength
            && (this.mServers[address] == null || this.mAddressSharing)) {
            return true;
        }
        return false;
    }

    public onCleanup(client: SignalingPeer): void {
        this.removeConnection(client);
        WebsocketNetworkServer.logv(client.GetLogPrefix() + "removed");
        this.logStatus();
    }

    public logStatus(){
        WebsocketNetworkServer.logv( this.count()
            + " connections left in pool ");
    }
}