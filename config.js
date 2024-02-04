const roles = {};

function getRole(serverId) {
  return roles[serverId];
}

function setRole(serverId, roleId) {
  roles[serverId] = roleId;
}

module.exports = {
  getRole,
  setRole,
};
