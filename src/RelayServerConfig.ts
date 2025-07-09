import { AppConfig, ServerConfig } from "awrtc_signaling";

export interface RelayAppConfig extends AppConfig {
  relay?: boolean;
}

export interface RelayServerConfig extends Omit<ServerConfig, 'apps'> {
  apps: RelayAppConfig[];
}