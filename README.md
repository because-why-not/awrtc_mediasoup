# Introduction

This project connects awrtc-based apps (WebRTC Video Chat for Unity or awrtc for browser/Python) with a mediasoup server.

With the default configuration it can receive a video stream from one client and forwards it to multiple receivers, reducing load on the sender.

To use the server, replace your existing awrtc_signaling server with this one and use a URL ending in /relay.
Add _snd or _rec to the address to enable sending or receiving. For all other addresses, the server behaves like awrtc_signaling.

# Requirements:
* npm and nodejs (last tested version v20.19.2)

# Install

From bash / cmd:

    git clone https://github.com/because-why-not/awrtc_mediasoup.git
    cd awrtc_mediasoup
    npm install
    npm run build


# Configuration

Edit the file config.json:
* Update the "ip" field and set the "announcedIp" field if needed
  * If you test this within your own LAN/ WiFi: ip should be the LOCAL IP to listen on
  * If you use this on a server online with a public IP directly associated with the server: ip should be the PUBLIC IP to listen on
  * If you use this on a server online and behind a NAT: ip should be the LOCAL IP to listen on. Add another field "announcedIp" with the public IP or domain name you want the clients to connect to.
  * Note the server needs to know an exact IP address or domain for signaling. Just using 0.0.0.0 or :: is not possible.
* Update the ports under listenInfos (mediasoup WebRTC), httpConfig (signaling via ws) and httpsConfig (signaling via wss) to suit your needs
  * If behind a NAT or firewall remember to open the ports
  * if using port 80 and 443 on linux or mac make sure your user is allowed to access them
* For secure websockets to work properly update ssl_key_file / ssl_cert_file to your own domain name specific certificate

listenInfos example for local IP:

    "listenInfos": [
        {
            "protocol": "udp",
            "ip": "192.168.1.46",
            "port": 20000
        },
        {
            "protocol": "tcp",
            "ip": "192.168.1.46",
            "port": 20000
        }
    ]

listenInfos example for local IP + public IP behind a NAT:

    "listenInfos": [
        {
            "protocol": "udp",
            "ip": "192.168.1.46",
            "announcedIp": "201.20.1.13",
            "port": 20000
        },
        {
            "protocol": "tcp",
            "ip": "192.168.1.46",
            "announcedIp": "201.20.1.13",
            "port": 20000
        }
    ]


# Run

npm run start 

After that your server should be accessible via 
ws://yourdomain.com:YOUR_WS_PORT/relay
or wss://yourdomain.com:YOUR_WSS_PORT/relay 


# Testing via WebRTC Video Chat CallApp example

1. In the Unity Editor callscene select two CallApp objects and replace the signaling server with "ws://yourdomain.com:YOUR_WS_PORT/relay" (note the "/relay" at the end). 
2. Make sure to set NativeMediaConfig.UseDataChannels = false e.g. when using the CallApp.cs you can change it in the CreateMediaConfig method
3. Start the app. Tick video and audio for one app and connect to "address_snd". Press join.
4. The app will now connect to mediasoup and start uploading media
5. In a second app: Make sure audio and video are unticked. Enter "address_rec" and press join
6. The second app will now receive video from the first relayed via the server. 
7. You can join with additional apps on the receiver side. 


Known issues and pitfalls

* Outgoing connections from mediasoup to the client do not trigger the "onopen" event on datachannels causing the connection process to stall. Use NativeMediaConfig.UseDataChannels = false to workaround the issue. DataChannels can not be used.
* Mediasoup treats connections as unidirectional but awrtc as bidirectional with a shared configuration. As result sending video and receiving video needs two separate calls.
* Codecs are currently hard coded to VP8 for video and OPUS for audio. Edit rtphelper.ts to try other configurations.
  



