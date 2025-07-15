import http from "http";
import https from "https";
import fs from "fs";
import ws from "ws";

import { WebsocketNetworkServer, DefaultPeerPool, SLogger } from "awrtc_signaling"
import { RelayController } from "./RelayController";
import { SoupServer } from "./SoupServer";
import { RelayServerConfig } from "./RelayServerConfig";


const logger = new SLogger("sig");
//This server works similar to the default setup of awrtc_signaling but
//adds our relay functionality if an app has set relay to true. 
export class SoupSignalingServer {

    signalingServer: WebsocketNetworkServer;

    constructor() {
        this.signalingServer = new WebsocketNetworkServer(logger);
    }

    public async init(config: RelayServerConfig) {
        const soupServer = new SoupServer();
        await soupServer.init(config.listenInfos);

        config.apps.forEach((app) => {
            if (app.relay) {
                this.signalingServer.addPeerPool(app.path, new RelayController(app, soupServer, logger.createSub(app.path)));
            } else {
                this.signalingServer.addPeerPool(app.path, new DefaultPeerPool(app, logger.createSub(app.path)));
            }
        })
        




        let httpServer = http.createServer({
        });
        let options = {
            port: config.httpConfig.port,
            host: config.httpConfig.host
        }
        httpServer.listen(options, function () {
            console.log("listening on ", httpServer.address());
        }); 

        var webSocketServer = new ws.Server(
            {
                server: httpServer,
                //path: app.path,
                maxPayload: config.maxPayload,
                perMessageDeflate: false
            });
        //incoming websocket connections will be handled by signalingServer
        this.signalingServer.addSocketServer(webSocketServer, (x) => true);


        //Setup https endpoint for wss://
        if (config.httpsConfig) {
            //load SSL files. If this crashes check the congig.json and make sure the files
            //are at the correct location
            let httpsServer = https.createServer({
                key: fs.readFileSync(config.httpsConfig.ssl_key_file),
                cert: fs.readFileSync(config.httpsConfig.ssl_cert_file)
            });

            let options = {
                port: config.httpsConfig.port,
                host: config.httpsConfig.host
            }
            httpsServer.listen(options, function () {
                console.log("secure websockets/https listening on ", httpsServer.address());
            });

            var webSocketSecure = new ws.Server({
                server: httpsServer,
                //path: app.path,
                maxPayload: config.maxPayload,
                perMessageDeflate: false
            });
            //incoming websocket connections will be handled by signalingServer
            this.signalingServer.addSocketServer(webSocketSecure, (x) => true);
        }
    }

}
