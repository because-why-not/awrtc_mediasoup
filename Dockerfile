FROM node:22
RUN \
	set -x \
	&& apt-get update \
	&& apt-get install -y net-tools build-essential python3 python3-pip valgrind
WORKDIR /awrtc_mediasoup
COPY ./. ./.
RUN npm install
RUN npm run build
CMD ["npm", "start"]
EXPOSE 80 443