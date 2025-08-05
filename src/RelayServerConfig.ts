import { AppConfig, ServerConfig } from "awrtc_signaling";
import { TransportListenInfo } from "mediasoup/types";

export interface RelayAppConfig extends AppConfig {
  relay?: boolean;
}

export interface RelayServerConfig extends Omit<ServerConfig, 'apps'> {
  apps: RelayAppConfig[];
  announcedAddressFromDomain?: string;
  listenInfos: TransportListenInfo[]
}