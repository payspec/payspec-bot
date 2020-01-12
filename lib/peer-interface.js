
 //var redis = require("redis");
   var jayson = require('jayson');

    var peerUtils = require('./peer-utils')


module.exports =  {


  async init(   mongoInterface )
  {

    this.mongoInterface=mongoInterface;


      this.initJSONRPCServer();
  },


  async update()
  {


    var self = this;

    //setTimeout(function(){self.processQueuedShares()},0)

  },





 /*

   async getMinerData(minerEthAddress)
   {
     if(minerEthAddress)
     {
       var minerData  = await this.mongoInterface.findOne("miner_data_downcase", {minerEthAddress: minerEthAddress.toString().toLowerCase() } );

       if(minerData  == null)
       {
         return this.getDefaultMinerData(minerEthAddress)
       }

        return  (minerData ) ;
     }

      return null;

   },
   */





  async initJSONRPCServer()
     {

       var self = this;


         // create a server
         var server = jayson.server({
           ping: function(args, callback) {

               callback(null, 'pong');

           },

           //implement me
           createOffchainInvoice: function(args, callback) {

               callback(null, 'pong');

           },

           getInvoiceOfUUID: function(args, callback) {

              //returns all cached data and the url!  To give to the client.

              result = {
                url:"none"
              }

               callback(null, result);

           },




         });

         server.http().listen(7071);
          console.log('listening on JSONRPC server localhost:7071')

     },



}
