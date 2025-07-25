import { RelayServerConfig } from "./RelayServerConfig";
import { SoupSignalingServer } from "./SoupSignalingServer";



const config : RelayServerConfig = require("../config.json");

const signalingServer = new SoupSignalingServer();
signalingServer.init(config);
