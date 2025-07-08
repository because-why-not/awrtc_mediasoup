import http from "http";
import https from "https";
import fs from "fs";
import ws from "ws";

import { WebsocketNetworkServer, DefaultPeerPool, ServerConfig } from "awrtc_signaling"
import { RelayController } from "./RelayController";
import { SoupServer } from "./soupserver";

export class SignalingServer {

    signalingServer: WebsocketNetworkServer;

    constructor() {
        this.signalingServer = new WebsocketNetworkServer();
    }

    public async init() {
        const soupServer = new SoupServer();
        await soupServer.init();


        let config = {
            "log_verbose": true,
            "adminToken": null,
            "httpConfig":
            {
                "port": 12776,
                "host": "::"
            },
            "httpsConfig":
            {
                "port": 12777,
                "host": "::",
                "ssl_key_file": "ssl.key",
                "ssl_cert_file": "ssl.crt"
            },
            "maxPayload":
                1048576,
            "apps": [
                {
                    "name": "Test",
                    "path": "/",
                    relay: true
                },
                {
                    "name": "ChatApp",
                    "path": "/chatapp"
                },
                {
                    "name": "CallApp",
                    "path": "/callapp"
                },
                {
                    "name": "ConferenceApp",
                    "path": "/conferenceapp",
                    "address_sharing": true
                },
                {
                    "name": "UnitTests",
                    "path": "/test"
                },
                {
                    "name": "UnitTestsAddressSharing",
                    "path": "/testshared",
                    "address_sharing": true
                }
            ]
        }
        config.apps.forEach((app) => {
            if (app.relay) {
                this.signalingServer.addPeerPool(app.path, new RelayController(app, soupServer));
            } else {
                this.signalingServer.addPeerPool(app.path, new DefaultPeerPool(app));
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
