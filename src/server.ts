import { RelayServerConfig } from "./RelayServerConfig";
import { SoupSignalingServer } from "./SoupSignalingServer";



const config: RelayServerConfig = require("../config.json") as RelayServerConfig;


const signalingServer = new SoupSignalingServer();
signalingServer.init(config)
  .catch(err => { console.error(err); });;
