import { RelayServerConfig } from "./RelayServerConfig";
import { SoupSignalingServer } from "./SoupSignalingServer";



let config : RelayServerConfig = require("../config.json");

let signalingServer = new SoupSignalingServer();
signalingServer.init(config);
