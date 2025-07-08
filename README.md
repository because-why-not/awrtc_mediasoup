Tested with:
node --version
v18.19.1

and these specific versions (other versions do break!):
"mediasoup-client": "^3.9.1",
"@epicgames-ps/mediasoup-sdp-bridge": "^1.0.5",

file:
minisoup/node_modules/@epicgames-ps/mediasoup-sdp-bridge/lib/index.js

was hacked to uncomment line 182 to 200


run via:
npm run start

then open http://localhost:3000
or test via chromium's fake camera/microphone:
chromium ---no-sandbox -use-fake-device-for-media-stream http://localhost:3000