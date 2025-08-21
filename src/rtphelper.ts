import { RtpCapabilities, RtpCodecCapability } from "mediasoup/types";

//what most WebRTC implementation default to. Opus + VP8
export const rtpMinimal: RtpCapabilities = {
    codecs: [
        {
            kind: "audio",
            mimeType: "audio/opus",
            preferredPayloadType: 109,
            clockRate: 48000,
            channels: 2,
            parameters: {
                maxplaybackrate: 48000,
                stereo: 1,
                useinbandfec: 1,
            },
            rtcpFeedback: [],
        },
        {
            kind: "video",
            mimeType: "video/VP8",
            preferredPayloadType: 120,
            clockRate: 90000,
            parameters: {
                "max-fs": 12288,
                "max-fr": 60,
            },
            rtcpFeedback: [
                {
                    type: "nack",
                },
                {
                    type: "nack",
                    parameter: "pli",
                },
                {
                    type: "ccm",
                    parameter: "fir",
                },
                {
                    type: "goog-remb",
                },
                {
                    type: "transport-cc",
                },
            ],
        },
    ],
    headerExtensions: [
        {
            kind: "audio",
            uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
            preferredId: 1,
        },
        {
            kind: "audio",
            uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
            preferredId: 3,
        },
        {
            kind: "video",
            uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
            preferredId: 3,
        },
        {
            kind: "video",
            uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
            preferredId: 4,
        },
        {
            kind: "video",
            uri: "urn:ietf:params:rtp-hdrext:toffset",
            preferredId: 5,
        },
        {
            kind: "video",
            uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
            preferredId: 7,
        },
    ],
};


export const serverMinCodecs: RtpCodecCapability[] =
    [
        {
            kind: "audio",
            mimeType: "audio/opus",
            clockRate: 48000,
            channels: 2
        },
        {
            "kind": "video",
            "mimeType": "video/VP8",
            "clockRate": 90000,
            "rtcpFeedback":
                [
                    { "type": "nack" },
                    { "type": "nack", "parameter": "pli" },
                    { "type": "ccm", "parameter": "fir" },
                    { "type": "goog-remb" },
                    { "type": "transport-cc" }
                ]
        },
    ];

