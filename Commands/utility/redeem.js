const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('redeem')
		.setDescription('Learn how to redeem Genshin promo codes'),
	async execute(interaction) {
		
	},
};