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



function getVideoParameters() {
    return {
        mid: "1",
        codecs: [
            {
                mimeType: "video/VP8",
                payloadType: 120,
                clockRate: 90000,
                parameters: {
                    "max-fs": 12288,
                    "max-fr": 60,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 124,
                clockRate: 90000,
                parameters: {
                    apt: 120,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/VP9",
                payloadType: 121,
                clockRate: 90000,
                parameters: {
                    "max-fs": 12288,
                    "max-fr": 60,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 125,
                clockRate: 90000,
                parameters: {
                    apt: 121,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 126,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42e01f",
                    "level-asymmetry-allowed": 1,
                    "packetization-mode": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 127,
                clockRate: 90000,
                parameters: {
                    apt: 126,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 97,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42e01f",
                    "level-asymmetry-allowed": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 98,
                clockRate: 90000,
                parameters: {
                    apt: 97,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 105,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42001f",
                    "level-asymmetry-allowed": 1,
                    "packetization-mode": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 106,
                clockRate: 90000,
                parameters: {
                    apt: 105,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 103,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42001f",
                    "level-asymmetry-allowed": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 104,
                clockRate: 90000,
                parameters: {
                    apt: 103,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/AV1",
                payloadType: 99,
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 100,
                clockRate: 90000,
                parameters: {
                    apt: 99,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/ulpfec",
                payloadType: 123,
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/red",
                payloadType: 122,
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 119,
                clockRate: 90000,
                parameters: {
                    apt: 122,
                },
                rtcpFeedback: [],
            },
        ],
        headerExtensions: [
            {
                uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                id: 3,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
                id: 4,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:toffset",
                id: 5,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
                id: 6,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
                id: 7,
                encrypt: false,
                parameters: {},
            },
        ],
        encodings: [
            {
                ssrc: 3158150763,
                rtx: {
                    ssrc: 208047969,
                },
            },
        ],
        rtcp: {
            cname: "{ee382342-d7e1-4895-95ef-54175225f92b}",
            reducedSize: true,
            mux: true,
        },
    }
}


function getAudioParameters() {
    return {
        mid: "0",
        codecs: [
            {
                mimeType: "audio/opus",
                payloadType: 109,
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
                mimeType: "audio/G722",
                payloadType: 9,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },
            {
                mimeType: "audio/PCMU",
                payloadType: 0,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },
            {
                mimeType: "audio/PCMA",
                payloadType: 8,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },
            {
                mimeType: "audio/telephone-event",
                payloadType: 101,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },
        ],
        headerExtensions: [
            {
                uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
                id: 1,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:csrc-audio-level",
                id: 2,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                id: 3,
                encrypt: false,
                parameters: {},
            },
        ],
        encodings: [
            {
                ssrc: 657912582,
            },
        ],
        rtcp: {
            cname: "{ee382342-d7e1-4895-95ef-54175225f92b}",
            reducedSize: false,
            mux: true,
        },
    }
}

function getAllParameters() {
    return {
        codecs: [
            {
                mimeType: "audio/opus",
                payloadType: 109,
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
                mimeType: "audio/G722",
                payloadType: 9,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },
            {
                mimeType: "audio/PCMU",
                payloadType: 0,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },
            {
                mimeType: "audio/PCMA",
                payloadType: 8,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },
            {
                mimeType: "audio/telephone-event",
                payloadType: 101,
                clockRate: 8000,
                channels: 1,
                parameters: {},
                rtcpFeedback: [],
            },

            ///
            {
                mimeType: "video/VP8",
                payloadType: 120,
                clockRate: 90000,
                parameters: {
                    "max-fs": 12288,
                    "max-fr": 60,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 124,
                clockRate: 90000,
                parameters: {
                    apt: 120,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/VP9",
                payloadType: 121,
                clockRate: 90000,
                parameters: {
                    "max-fs": 12288,
                    "max-fr": 60,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 125,
                clockRate: 90000,
                parameters: {
                    apt: 121,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 126,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42e01f",
                    "level-asymmetry-allowed": 1,
                    "packetization-mode": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 127,
                clockRate: 90000,
                parameters: {
                    apt: 126,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 97,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42e01f",
                    "level-asymmetry-allowed": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 98,
                clockRate: 90000,
                parameters: {
                    apt: 97,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 105,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42001f",
                    "level-asymmetry-allowed": 1,
                    "packetization-mode": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 106,
                clockRate: 90000,
                parameters: {
                    apt: 105,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/H264",
                payloadType: 103,
                clockRate: 90000,
                parameters: {
                    "profile-level-id": "42001f",
                    "level-asymmetry-allowed": 1,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 104,
                clockRate: 90000,
                parameters: {
                    apt: 103,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/AV1",
                payloadType: 99,
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 100,
                clockRate: 90000,
                parameters: {
                    apt: 99,
                },
                rtcpFeedback: [],
            },
            {
                mimeType: "video/ulpfec",
                payloadType: 123,
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/red",
                payloadType: 122,
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
            {
                mimeType: "video/rtx",
                payloadType: 119,
                clockRate: 90000,
                parameters: {
                    apt: 122,
                },
                rtcpFeedback: [],
            },
        ],
        headerExtensions: [
            {
                uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
                id: 1,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:csrc-audio-level",
                id: 2,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                id: 3,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                id: 3,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
                id: 4,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:toffset",
                id: 5,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
                id: 6,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
                id: 7,
                encrypt: false,
                parameters: {},
            },
        ],
    }
}
function getMinRtpCapabilities() {
    return {
        codecs: [
            //removed all but opus
            {
                mimeType: "audio/opus",
                payloadType: 109,
                clockRate: 48000,
                channels: 2,
                parameters: {
                    maxplaybackrate: 48000,
                    stereo: 1,
                    useinbandfec: 1,
                },
                rtcpFeedback: [],
            },
            //removed all but vp8
            {
                mimeType: "video/VP8",
                payloadType: 120,
                clockRate: 90000,
                parameters: {
                    "max-fs": 12288,
                    "max-fr": 60,
                },
                rtcpFeedback: [
                    {
                        type: "nack",
                        parameter: "",
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
                        parameter: "",
                    },
                    {
                        type: "transport-cc",
                        parameter: "",
                    },
                ],
            },
        ],
        headerExtensions: [
            {
                uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
                id: 1,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:csrc-audio-level",
                id: 2,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                id: 3,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                id: 3,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
                id: 4,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "urn:ietf:params:rtp-hdrext:toffset",
                id: 5,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
                id: 6,
                encrypt: false,
                parameters: {},
            },
            {
                uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
                id: 7,
                encrypt: false,
                parameters: {},
            },
        ],
    }
}
