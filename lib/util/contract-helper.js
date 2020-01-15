

var tokenContractJSON = require('../../app/assets/contracts/_0xBitcoinToken.json');

var payspecContractJSON = require('../../app/assets/contracts/PaySpec.json');


var deployedContractInfo = require('../../app/assets/contracts/DeployedContractInfo.json');



module.exports =  {

  getTokenContract(web3,env_type)
  {
    var contract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress(env_type));
    return contract;
  },

  getPayspecContract(web3,env_type)
  {
    var contract =  new web3.eth.Contract(payspecContractJSON.abi,this.getPayspecContractAddress(env_type));
    return contract;
  },




       getTokenContractAddress(env_type)
       {
         if(env_type == 'test')
         {
           return deployedContractInfo.networks.testnet.contracts._0xbitcointoken.blockchain_address;
         }else if(env_type == 'staging'){
           return deployedContractInfo.networks.staging.contracts._0xbitcointoken.blockchain_address;
         }else if(env_type == 'production'){
           return deployedContractInfo.networks.mainnet.contracts._0xbitcointoken.blockchain_address;
         }
         console.error('no pool env set', env_type)
       },




       getPayspecContractAddress(env_type)
       {
         if(env_type == 'test')
         {
           return deployedContractInfo.networks.testnet.contracts.payspec.blockchain_address;
         }else if(env_type == 'staging'){
           return deployedContractInfo.networks.staging.contracts.payspec.blockchain_address;
         }else if(env_type == 'production'){
           return deployedContractInfo.networks.mainnet.contracts.payspec.blockchain_address;
         }
         console.error('no env set', env_type)
       },



}
