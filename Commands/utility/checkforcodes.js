const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkcodes')
		.setDescription('See if there are any new Genshin Impact promo codes!'),
	async execute(interaction) {
		
	},
};