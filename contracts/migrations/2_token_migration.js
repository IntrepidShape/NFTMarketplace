const DSToken = artifacts.require("DSToken");

module.exports = function (deployer) {
  deployer.deploy(DSToken);
};
