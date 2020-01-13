

var mongoInitParam;

var mongoInterface = require('./lib/mongo-interface')

var peerInterface = require('./lib/peer-interface')


init();


async function init()
{
  console.log('hi')


  await mongoInterface.init(mongoInitParam)

  await peerInterface.init(mongoInterface) //initJSONRPCServer();
}
