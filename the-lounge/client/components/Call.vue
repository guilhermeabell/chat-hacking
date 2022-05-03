<template>
	<div id="chat-container" class="window" :data-current-channel="channel.name" lang="">
		<div
			id="chat"
			:class="{
				'hide-motd': !$store.state.settings.motd,
				'colored-nicks': $store.state.settings.coloredNicks,
				'time-seconds': $store.state.settings.showSeconds,
				'time-12h': $store.state.settings.use12hClock,
			}"
		>
			<div
				:id="'chan-' + channel.id"
				class="chat-view"
				:data-type="channel.type"
				:aria-label="channel.name"
				role="tabpanel"
			>
				<div class="header">
					<SidebarToggle />
					<span class="title">{{ channel.name }}</span>
				</div>
				<div class="chat-content">
					<div class="chat chat-call">
						<div
							style="display: flex; flex-direction: column; width: 100%; height: 100%"
						>
							<div style="padding: 0.5rem; flex: 1">
								<div
									id="contentIt"
									style="width: 100%; height: 100%; border: 3px solid #ccc"
								></div>
							</div>

							<div style="padding: 0.5rem; text-align: center">
								<button>Open my mic</button>
								&nbsp; &nbsp;
								<button>share screen</button>
							</div>
						</div>
					</div>
					<div class="userlist">
						<div class="names">
							<div class="user-mode normal"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import socket from "../js/socket";
import eventbus from "../js/eventbus";
import SidebarToggle from "./SidebarToggle.vue";
import ListBans from "./Special/ListBans.vue";
import ListInvites from "./Special/ListInvites.vue";
import ListChannels from "./Special/ListChannels.vue";
import ListIgnored from "./Special/ListIgnored.vue";
import store from "../js/store";
import {router} from "../js/router";

const peers = {};
const mediaPeerElements = {};
let localMediaStream = null;
let offerPeerId = null;

function clearPeer(callId) {
	for (const peerId in peers) {
		peers[peerId].close();
		delete peers[peerId];
	}

	for (const peerId in mediaPeerElements) {
		mediaPeerElements[peerId].remove();
		delete mediaPeerElements[peerId];
	}

	if (localMediaStream) {
		localMediaStream.close();
		localMediaStream = null;
	}

	if (callId) {
		socket.emit("leave-call", callId);
	}
}

socket.on("disconnect", () => {
	clearPeer();
});

socket.on("add-peer", async ({callId, peerId, shouldCreateOffer}) => {
	if (peers[peerId]) {
		return;
	}

	const peerConnection = new RTCPeerConnection({
		iceServers: [
			{
				urls: "turn:54.207.78.192:3478",
				username: "ligeiro",
				credential: "123",
			},
		],
	});

	peers[peerId] = peerConnection;

	peerConnection.onicecandidate = (ev) => {
		if (!ev.candidate) {
			return;
		}

		socket.emit("relay-ice-candidate", {
			callId,
			peerId,
			candidate: {
				sdpMLineIndex: ev.candidate.sdpMLineIndex,
				candidate: ev.candidate.candidate,
			},
		});
	};

	peerConnection.ontrack = (ev) => {
		if (mediaPeerElements[peerId]) {
			return;
		}

		const audioElement = document.createElement("video");

		audioElement.style = {border: "1px solid red"};
		audioElement.autoplay = true;
		audioElement.muted = false;

		audioElement.setAttribute("autoplay", "");
		audioElement.setAttribute("muted", "");
		audioElement.setAttribute("playsinline", "");

		mediaPeerElements[peerId] = audioElement;
		audioElement.srcObject = ev.streams[0];

		document.querySelector("#contentIt").appendChild(audioElement);
		audioElement.srcObject = new MediaStream(ev.streams[0]);
	};

	const localTracks = localMediaStream.getTracks();
	for (let localTrack in localTracks) {
		peerConnection.addTrack(localTracks[localTrack], localMediaStream);
	}

	if (!shouldCreateOffer) {
		return;
	}

	offerPeerId = peerId;

	const localDescription = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(localDescription);

	socket.emit("relay-session-description", {
		callId,
		peerId,
		sessionDescription: localDescription,
	});
});

socket.on("peer-session-description", async (config) => {
	const peer = peers[config.peerId];
	const remote = config.sessionDescription;

	if (config.peerId === offerPeerId) {
		if (remote.type !== "offer") {
			const desc = new RTCSessionDescription(remote);
			await peer.setRemoteDescription(desc);

			const localDescription = await peer.createAnswer();
			await peer.setLocalDescription(localDescription);
		}

		return;
	}

	const desc = new RTCSessionDescription(remote);
	await peer.setRemoteDescription(desc);

	const localDescription = await peer.createAnswer();
	await peer.setLocalDescription(localDescription);

	socket.emit("relay-session-description", {
		callId: config.callId,
		peerId: config.peerId,
		sessionDescription: localDescription,
	});
});

socket.on("peer-ice-candidate", async (config) => {
	const peer = peers[config.peerId];
	await peer.addIceCandidate(config.candidate);
});

socket.on("remove-peer", ({peerId}) => {
	mediaPeerElements[peerId].remove();
	delete mediaPeerElements[peerId];

	peers[peerId].close();
	delete peers[peerId];
});

async function setupLocalMedia() {
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: true,
		video: {width: 1280, height: 720},
	});
	const audioElement = document.createElement("video");

	audioElement.autoplay = true;
	audioElement.muted = true;

	audioElement.setAttribute("autoplay", "");
	audioElement.setAttribute("playsinline", "");

	document.querySelector("#contentIt").appendChild(audioElement);

	audioElement.srcObject = stream;
	localMediaStream = new MediaStream(stream);
}

export default {
	name: "Call",
	components: {
		SidebarToggle,
	},
	props: {
		network: Object,
		channel: Object,
	},
	computed: {},
	watch: {
		channel() {},
	},
	mounted() {
		const {nick} = this.network;

		const channelName = this.channel.name;
		const networkName = this.network.name;

		const callId = `${networkName}_${channelName}`;

		setupLocalMedia().then(() => {
			socket.emit("call", {callId, nick, channelName});
			socket.once("call-started", ({users, callId}) => {
				if (!this.isMounted) {
					clearPeer(callId);
					return;
				}

				this.channel.call = {id: callId, users};
			});

			this.isMounted = true;
		});
	},

	unmounted() {
		this.isMounted = false;
		clearPeer(this.channel.call.id);
	},

	methods: {
		toggleMic() {
			console.log("TOGGLE");
		},
	},
};
</script>
