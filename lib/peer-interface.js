
 //var redis = require("redis");
   var jayson = require('jayson');

    var peerUtils = require('./peer-utils')

   var web3utils = require('web3-utils');

   var accountConfig = require('../account.config.js').accounts;


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
           generateOffchainInvoice: async function(args, callback) {

            /* payspecData = {
               tokensAmountDue: 0,
               tokenAddress: @currency.eth_contract_address,
               description: ('Etherpunks.com Order #'+@order.id)
             }*/




             inputData = args[0]

             console.log('acct config', accountConfig)


             //web3 format address
             var serverRecipientAddress = web3utils.toChecksumAddress(accountConfig.recipient.address);
             var serverMsgSenderAddress = web3utils.toChecksumAddress(accountConfig.msgsender.address);

             var invoicesCount = await self.getNumberOfInvoices();
             if(invoicesCount == null) invoicesCount = 0;
             var nextInvoiceId = invoicesCount + 1; // need to check w mongo !!!

             console.log('next invoice id ', nextInvoiceId)

             invoiceInputs = {
               msgSenderAddress: serverMsgSenderAddress,
               recipientAddress: serverRecipientAddress,
               tokenAddress: web3utils.toChecksumAddress(inputData.tokenAddress),
               tokenAmount: inputData.tokenAmount,
               description: inputData.description,
               refNumber: nextInvoiceId
             }

             // get tha sha3 hash ...

             var uuid = await self.calculateInvoiceUUID(invoiceInputs);
             console.log('calculated uuid', uuid)
             invoiceInputs.uuid = uuid;


             var existingInvoice = await self.findInvoiceWithUUID(uuid)

             if(existingInvoice != null ){
               callback(null, {success:false, message: 'Payspec Error: Duplicate order UUID detected'});
               return
             }

             await self.saveInvoice(invoiceInputs);


             callback(null, {success:true, uuid: uuid});

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

     async saveInvoice(invoiceData)
     {
       var invoices = await  this.mongoInterface.insertOne('invoice', invoiceData )

       return true;
     },

     async findInvoiceWithUUID(uuid)
     {
       var invoice = await this.mongoInterface.findOne('invoice', {uuid:uuid} )

       console.log('FindOneWithUUID result ', invoice)

       return invoice;
     },

     async getNumberOfInvoices()
     {
       var invoices = await this.mongoInterface.findAll('invoice')

       console.log( 'found ', invoices.length, ' invoices.')

       return invoices.length;
     },


     async calculateInvoiceUUID( newInvoiceData  )
     {
        console.log('sha 3 inputs ', web3utils.toChecksumAddress(newInvoiceData.msgSenderAddress), newInvoiceData.refNumber, newInvoiceData.description, web3utils.toChecksumAddress(newInvoiceData.tokenAddress), newInvoiceData.tokenAmount, web3utils.toChecksumAddress(newInvoiceData.recipientAddress))

       var digest = web3utils.soliditySha3({t: 'address', v: web3utils.toChecksumAddress(newInvoiceData.msgSenderAddress)}, {t: 'uint256', v: newInvoiceData.refNumber }, {t: 'string', v: newInvoiceData.description }, {t: 'address', v: web3utils.toChecksumAddress(newInvoiceData.tokenAddress) }, {t: 'uint256', v: newInvoiceData.tokenAmount }, {t: 'address', v: web3utils.toChecksumAddress(newInvoiceData.recipientAddress) });

       var digestBytes32 = web3utils.hexToBytes(digest)
      // console.log('digestBytes32',digestBytes32)

       return digest;
     }



}
