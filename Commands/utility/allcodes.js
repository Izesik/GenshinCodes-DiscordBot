const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('activecodes')
		.setDescription('Shows all the currently active codes'),
	async execute(interaction) {
		
	},
};