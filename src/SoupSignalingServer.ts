import http from "http";
import https from "https";
import fs from "fs";
import ws from "ws";
import url from "url";
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';

import { WebsocketNetworkServer, DefaultPeerPool, SLogger, TokenManager } from "awrtc_signaling"
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

        let tokenManager = new TokenManager(config.adminToken, config.log_verbose);
        if (tokenManager.isActive()) {
            logger.log("Admin token set in config.json. Connections will be blocked by default unless a valid user token is used.");
        } else {
            logger.log("No admin token set. The server allows all connections.");
        }

        //request handler that will deliver files from public directory
        //can be used like a simple http / https webserver
        //also needed for let's encrypt to get a free SSL certificate
        const serve = serveStatic("./public", {dotfiles: "allow"});


        function defaultRequest(req: http.IncomingMessage, res: http.ServerResponse) {
            logger.log(`Request received from IP: ${req.socket.remoteAddress}:${req.socket.remotePort} to url ${req.url}`);
            const parsedUrl = url.parse(req.url!, true);
            const pathname = parsedUrl.pathname;
            if (pathname === '/api/admin/regUserToken') {
                tokenManager.processRequest(req, res);
            } else {
                //res.setHeader("Access-Control-Allow-Origin", "*"); //allow access from anywhere
                const done = finalhandler(req, res);
                serve(req, res, done);
            }
        }


        let httpServer = http.createServer(defaultRequest);
        let options = {
            port: config.httpConfig.port,
            host: config.httpConfig.host
        }
        httpServer.listen(options, function () {
            console.log("listening on ", httpServer.address());
        });

        const webSocketServer = new ws.Server(
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
            }, defaultRequest);

            let options = {
                port: config.httpsConfig.port,
                host: config.httpsConfig.host
            }
            httpsServer.listen(options, function () {
                console.log("secure websockets/https listening on ", httpsServer.address());
            });

            const webSocketSecure = new ws.Server({
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
