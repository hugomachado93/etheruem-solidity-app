var Games = artifacts.require("./Games.sol");

module.exports = function(deployer) {
  deployer.deploy(Games);
};