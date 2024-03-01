const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, PermissionsBitField } = require('discord.js');
const config = require('../../config');
const bot = require('../../bot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setrole')
    .setDescription('Set the announcement role')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Select the announcement role')
        .setRequired(true)
    ),
  async execute(interaction) {
  
  
  },
};