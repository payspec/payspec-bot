
 //var redis = require("redis");
   var jayson = require('jayson');

    var peerUtils = require('./peer-utils')

   var web3utils = require('web3-utils');

   var accountConfig = require('../account.config').accounts;


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
           generateOffchainInvoice: function(args, callback) {

            /* payspecData = {
               tokensAmountDue: 0,
               tokenAddress: @currency.eth_contract_address,
               description: ('Etherpunks.com Order #'+@order.id)
             }*/


             inputData = args[0]

             var serverEthAddress = accountConfig.accounts.recipient.address;
             var nextInvoiceId = 0; // need to check w mongo !!! 

             invoiceInputs = {
               msgSenderAddress: serverEthAddress,
               recipientAddress: serverEthAddress,
               tokenAddress: inputData.tokenAddress,
               tokenAmount: inputData.tokenAmount,
               description: inputData.description,
               refNumber: nextInvoiceId
             }

             // get tha sha3 hash ...

             var uuid = self.calculateInvoiceUUID(invoiceInputs)


               callback(null, {uuid: uuid});

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


     async calculateInvoiceUUID( newInvoiceData  )
     {
        console.log('sha 3 inputs ', newInvoiceData.msgSenderAddress, newInvoiceData.refNumber, newInvoiceData.description, newInvoiceData.tokenAddress, newInvoiceData.tokenAmount, newInvoiceData.recipientAddress)

       var digest = web3utils.soliditySha3({t: 'address', v: newInvoiceData.msgSenderAddress}, {t: 'uint256', v: newInvoiceData.refNumber }, {t: 'string', v: newInvoiceData.description }, {t: 'address', v: newInvoiceData.tokenAddress }, {t: 'uint256', v: newInvoiceData.tokenAmount }, {t: 'address', v: newInvoiceData.recipientAddress });

       var digestBytes32 = web3utils.hexToBytes(digest)
       console.log('digestBytes32',digestBytes32)

       return digest;
     }



}
