import Vue from "vue";
import Vuex from "vuex";
import {createSettingsStore} from "./store-settings";
import storage from "./localStorage";

const appName = document.title;

Vue.use(Vuex);

function detectDesktopNotificationState() {
	if (!("Notification" in window)) {
		return "unsupported";
	} else if (Notification.permission === "granted") {
		return "granted";
	}

	return "blocked";
}

const store = new Vuex.Store({
	state: {
		appLoaded: false,
		activeChannel: null,
		currentUserVisibleError: null,
		desktopNotificationState: detectDesktopNotificationState(),
		isAutoCompleting: false,
		isConnected: false,
		networks: [],
		mentions: [],
		hasServiceWorker: false,
		pushNotificationState: "unsupported",
		serverConfiguration: null,
		sessions: [],
		sidebarOpen: false,
		sidebarDragging: false,
		userlistOpen: storage.get("thelounge.state.userlist") !== "false",
		versionData: null,
		versionStatus: "loading",
		versionDataExpired: false,
		serverHasSettings: false,
	},
	mutations: {
		appLoaded(state) {
			state.appLoaded = true;
		},
		activeChannel(state, channel) {
			state.activeChannel = channel;
		},
		currentUserVisibleError(state, error) {
			state.currentUserVisibleError = error;
		},
		refreshDesktopNotificationState(state) {
			state.desktopNotificationState = detectDesktopNotificationState();
		},
		isAutoCompleting(state, isAutoCompleting) {
			state.isAutoCompleting = isAutoCompleting;
		},
		isConnected(state, payload) {
			state.isConnected = payload;
		},
		networks(state, networks) {
			state.networks = networks;
		},
		mentions(state, mentions) {
			state.mentions = mentions;
		},
		removeNetwork(state, networkId) {
			state.networks.splice(
				store.state.networks.findIndex((n) => n.uuid === networkId),
				1
			);
		},
		sortNetworks(state, sortFn) {
			state.networks.sort(sortFn);
		},
		hasServiceWorker(state) {
			state.hasServiceWorker = true;
		},
		pushNotificationState(state, pushNotificationState) {
			state.pushNotificationState = pushNotificationState;
		},
		serverConfiguration(state, serverConfiguration) {
			state.serverConfiguration = serverConfiguration;
		},
		sessions(state, payload) {
			state.sessions = payload;
		},
		sidebarOpen(state, payload) {
			state.sidebarOpen = payload;
		},
		sidebarDragging(state, payload) {
			state.sidebarDragging = payload;
		},
		toggleSidebar(state) {
			state.sidebarOpen = !state.sidebarOpen;
		},
		toggleUserlist(state) {
			state.userlistOpen = !state.userlistOpen;
		},
		userlistOpen(state, payload) {
			state.userlistOpen = payload;
		},
		versionData(state, payload) {
			state.versionData = payload;
		},
		versionStatus(state, payload) {
			state.versionStatus = payload;
		},
		versionDataExpired(state, payload) {
			state.versionDataExpired = payload;
		},
		serverHasSettings(state, value) {
			state.serverHasSettings = value;
		},
	},
	getters: {
		findChannelOnCurrentNetwork: (state) => (name) => {
			name = name.toLowerCase();
			return state.activeChannel.network.channels.find((c) => c.name.toLowerCase() === name);
		},
		findChannel: (state) => (id) => {
			for (const network of state.networks) {
				for (const channel of network.channels) {
					if (channel.id === id) {
						return {network, channel};
					}
				}
			}

			return null;
		},
		findNetwork: (state) => (uuid) => {
			for (const network of state.networks) {
				if (network.uuid === uuid) {
					return network;
				}
			}

			return null;
		},
		highlightCount(state) {
			let highlightCount = 0;

			for (const network of state.networks) {
				for (const channel of network.channels) {
					highlightCount += channel.highlight;
				}
			}

			return highlightCount;
		},
		title(state, getters) {
			const alertEventCount = getters.highlightCount ? `(${getters.highlightCount}) ` : "";

			const channelname = state.activeChannel ? `${state.activeChannel.channel.name} — ` : "";

			return alertEventCount + channelname + appName;
		},
		initChannel: () => (channel) => {
			// TODO: This should be a mutation
			channel.pendingMessage = "";
			channel.inputHistoryPosition = 0;
			channel.inputHistory = [""];
			channel.historyLoading = false;
			channel.scrolledToBottom = true;
			channel.editTopic = false;

			channel.moreHistoryAvailable = channel.totalMessages > channel.messages.length;
			delete channel.totalMessages;

			if (channel.type === "channel") {
				channel.usersOutdated = true;
			}

			return channel;
		},
	},
});

// Settings module is registered dynamically because it benefits
// from a direct reference to the store
store.registerModule("settings", createSettingsStore(store));

export default store;
