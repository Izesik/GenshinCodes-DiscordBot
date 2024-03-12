const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, PermissionsBitField } = require('discord.js');

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