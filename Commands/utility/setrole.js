const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, PermissionsBitField } = require('discord.js');
const config = require('../../config');

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
  
    // Check if the user has the necessary permissions (e.g., ADMINISTRATOR)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply('You do not have permission to use this command.');
    }

    // Retrieve the selected role from the interaction
    const role = interaction.options.getRole('role');
    config.announcementRole = role.id;


    interaction.reply(`Announcement role set to ${role.name}`);
  },
};