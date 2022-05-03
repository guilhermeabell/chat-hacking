"use strict";

const _ = require("lodash");
const log = require("./log");
const colors = require("chalk");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Auth = require("./plugins/auth");
const Client = require("./client");
const Helper = require("./helper");
const WebPush = require("./plugins/webpush");

class ClientManager {
	constructor() {
		this.clients = [];
	}

	init(identHandler, sockets) {
		this.sockets = sockets;
		this.identHandler = identHandler;
		this.webPush = new WebPush();
	}

	async findClient(userName) {
		return {
			name: userName,
			password: "",
			log: true,
			sessions: {},
			clientSettings: {
				advanced: false,
				autocomplete: true,
				nickPostfix: "",
				coloredNicks: true,
				highlights: "",
				highlightExceptions: "",
				awayMessage: "",
				links: true,
				motd: true,
				notifyAllMessages: false,
				showSeconds: false,
				use12hClock: false,
				statusMessages: "condensed",
				theme: "default",
				media: true,
				removeImageMetadata: true,
				userStyles: "",
			},
			browser: {},
			networks: [
				{
					uuid: "932c8f5c-c60e-40b5-ac13-3c199baaaf8b",
					awayMessage: "",
					nick: userName,
					name: "ligeiro.club",
					host: "localhost",
					port: 6667,
					tls: false,
					userDisconnected: false,
					rejectUnauthorized: false,
					password: "",
					username: userName,
					realname: userName,
					leaveMessage: "",
					sasl: "",
					saslAccount: "",
					saslPassword: "",
					commands: [],
					ignoreList: [],
					channels: [{name: "#umpordez", key: ""}],
				},
			],
		};
	}

	async login(client, user, password) {
		return true;
	}

	async addUser(name, password, enableLog) {}

	async saveUser(client) {}
	async removeUser(name) {}
}

module.exports = ClientManager;
