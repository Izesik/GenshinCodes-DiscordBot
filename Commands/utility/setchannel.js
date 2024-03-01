const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, PermissionsBitField } = require('discord.js');
const config = require('../../config');
const bot = require('../../bot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set the channel you want Genshin Codes to post in!')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Select the channel')
        .setRequired(true)
    ),
  async execute(interaction) {
  
  },
};