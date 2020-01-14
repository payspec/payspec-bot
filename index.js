

var mongoInitParam;

var mongoInterface = require('./lib/mongo-interface')

var peerInterface = require('./lib/peer-interface')

var webServer = require('./lib/web-server')

init();


async function init()
{
  console.log('hi')


  await mongoInterface.init(mongoInitParam)



  await peerInterface.init(mongoInterface) //initJSONRPCServer();


  await webServer.init(false ,peerInterface)
}
