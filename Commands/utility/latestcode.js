const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('latestcode')
		.setDescription('Shows the latest code'),
	async execute(interaction) {
		
	},
};