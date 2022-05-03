<template>
	<Call v-if="activeChannel" :network="activeChannel.network" :channel="activeChannel.channel" />
</template>

<script>
// Temporary component for routing channels and lobbies
import Call from "./Call.vue";

export default {
	name: "RoutedChat",
	components: {Call},
	computed: {
		activeChannel() {
			const chanId = parseInt(this.$route.params.id, 10);
			const channel = this.$store.getters.findChannel(chanId);
			return channel;
		},
	},
	watch: {
		activeChannel() {
			this.setActiveChannel();
		},
	},
	mounted() {
		this.setActiveChannel();
	},
	methods: {
		setActiveChannel() {
			this.$store.commit("activeChannel", this.activeChannel);
		},
	},
};
</script>
