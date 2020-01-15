

var mongoInitParam;

var mongoInterface = require('./lib/mongo-interface')

var peerInterface = require('./lib/peer-interface')

var webServer = require('./lib/web-server')

var accounts = require('./secrets.config.js').secrets.accounts;

var web3Config = require('./secrets.config.js').secrets.web3;


var Web3 = require('web3')

var web3 = new Web3()


var environment = 'production';

if( process.argv[2] == "test" )
{
  environment = 'test'
}


init();


async function init()
{
  console.log(web3Config)


  web3.setProvider(web3Config.mainnetURL)
  if( environment == "test" )
  {
    web3.setProvider(web3Config.ropstenURL)
  }





  await mongoInterface.init(mongoInitParam)


  await peerInterface.init(mongoInterface,web3,environment) //initJSONRPCServer();


  await webServer.init(false ,  peerInterface)
}
