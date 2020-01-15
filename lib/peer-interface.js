
 //var redis = require("redis");
   var jayson = require('jayson');



   var web3utils = require('web3-utils');

   var accountConfig = require('../secrets.config.js').secrets.accounts;

   var contractHelper = require('./util/contract-helper')


    const expirationBlocks = 1000;// 4 hours

module.exports =  {




  async init(   mongoInterface, web3, environment )
  {

        var self = this

        console.log('init peer interface')
        this.mongoInterface=mongoInterface;
        this.web3=web3;
        this.environment = environment;

        this.pollEthereumNetwork()
        this.initJSONRPCServer();

        setInterval(function(){self.pollEthereumNetwork()},60*1000)
  },


  async update()
  {


    var self = this;



  },


  /*
    update eth block number
    update status of all invoices that are unexpired (less than 1000 blocks [4 hours] old)
  */
  async pollEthereumNetwork()
  {

    var self = this;

    var ethBlockNumber = await new Promise(function (fulfilled,error) {
       self.web3.eth.getBlockNumber(function(err, result)
        {
          if(err){error(err);return}
          console.log('eth block number ', result )
          fulfilled(result);
          return;
        });
     });

     //this is not overwriting but adding more and more ...
    await self.mongoInterface.upsertOne('ethBlockNumber',  {}, {value: ethBlockNumber  } )

    console.log('got eth block',  ethBlockNumber )


    //var ethBlockNumberPreExpiry = ethBlockNumber - 1000 ;

    var invoices =  await self.mongoInterface.findAll('invoice'  )

    var pendingInvoices = []

    for(var i=0;i<invoices.length;i++)
    {
    //  console.log(invoices[i].ethBlockExpiresAt , ethBlockNumber - expirationBlocks ,invoices[i].paid)
      if(  (invoices[i].ethBlockExpiresAt > (ethBlockNumber - expirationBlocks))  && (invoices[i].paid == false) )
      {
        pendingInvoices.push( invoices[i] );

      }
    }

    console.log('got pending invoices', pendingInvoices)
    for(var i=0;i<pendingInvoices.length;i++)
    {
      self.pollInvoiceStatus(pendingInvoices[i])
    }


  },


  async pollInvoiceStatus(invoiceData)
  {
    var self = this;

    var contract  =  contractHelper.getPayspecContract(self.web3,self.environment );


    var invoicePaidStatus = await new Promise(function (fulfilled,error) {

       contract.methods.invoiceWasPaid(invoiceData.uuid).call( function(err, result)
        {
          if(err){error(err);return}
          console.log('invoce was paid? ', result )
          fulfilled(result);
          return;
        });


     });

     console.log('got invoice paid sts',invoicePaidStatus)

     if(invoicePaidStatus == true)
     {
       invoiceData.paid = true;
       self.updateInvoiceData(invoiceData)
     }

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
             var serverRecipientAddress = accountConfig.recipient.address;
             var serverMsgSenderAddress = accountConfig.msgsender.address;

             var invoicesCount = await self.getNumberOfInvoices();
             if(invoicesCount == null) invoicesCount = 0;
             var nextInvoiceId = invoicesCount + 1; // need to check w mongo !!!

             console.log('next invoice id ', nextInvoiceId)

             var ethBlockNumber = await self.getEthBlockNumber()

             if(!(ethBlockNumber > 0))
             {
               callback(null, {success:false, message: 'Payspec Error: No connection to Ethereum'});
               return
             }

             invoiceInputs = {
               msgSenderAddress: web3utils.toChecksumAddress(serverMsgSenderAddress),
               recipientAddress: web3utils.toChecksumAddress(serverRecipientAddress),
               tokenAddress: web3utils.toChecksumAddress(inputData.tokenAddress),
               amountDue: inputData.amountDue,
               description: inputData.description,
               refNumber: nextInvoiceId,
               ethBlockExpiresAt: ethBlockNumber + expirationBlocks,  //consider making this non zero, get eth block
               paid: false
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

             var savedInvoice = await self.findInvoiceWithUUID(uuid)
             if(savedInvoice == null ){
               callback(null, {success:false, message: 'Payspec Error: Could not save Invoice'});
               return
             }
              console.log('saved invoice: ', savedInvoice)

             callback(null, {success:true, uuid: uuid});

           },

           setInvoicePaidCallbackURL: async function(args, callback)
           {
             var callbackURL = args[0].url
             console.log('got ', callbackURL )
             var invoices = await self.mongoInterface.insertOne('merchantServerInvoicePaidCallbackURL',  {value: callbackURL  } )


              callback(null, {success: true, url: callbackURL });
           },


           getInvoiceOfUUID: async function(args, callback) {


             var uuid = args[0]

              //returns all cached data and the url!  To give to the client.

              var existingInvoice = await self.findInvoiceWithUUID(uuid)

              result = {success:true, invoice: existingInvoice}

               callback(null, result);

           },




         });

         server.http().listen(7071);
          console.log('listening on JSONRPC server localhost:7071')

     },

     async updateInvoiceData(invoiceData)
     {
       var invoices = await  this.mongoInterface.upsertOne('invoice', {uuid: invoiceData.uuid}, invoiceData )
       return true;
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

     //set from jsonrpc

     async getEthBlockNumber()
     {
       var obj = await this.mongoInterface.findOne('ethBlockNumber'  )
       return obj.value;
     },

     async getInvoiceCallbackURL()
     {
       var obj = await this.mongoInterface.findOne('merchantServerInvoicePaidCallbackURL'  )
       return obj.value;
     },

     async getNumberOfInvoices()
     {
       var invoices = await this.mongoInterface.findAll('invoice')

       console.log( 'found ', invoices.length, ' invoices.')

       return invoices.length;
     },


     async calculateInvoiceUUID( newInvoiceData  )
     {
        console.log('sha 3 inputs ', web3utils.toChecksumAddress(newInvoiceData.msgSenderAddress), newInvoiceData.refNumber, newInvoiceData.description, web3utils.toChecksumAddress(newInvoiceData.tokenAddress), newInvoiceData.amountDue, web3utils.toChecksumAddress(newInvoiceData.recipientAddress), newInvoiceData.ethBlockExpiresAt)

       var digest = web3utils.soliditySha3({t: 'uint256', v: newInvoiceData.refNumber }, {t: 'string', v: newInvoiceData.description }, {t: 'address', v: web3utils.toChecksumAddress(newInvoiceData.tokenAddress) }, {t: 'uint256', v: newInvoiceData.amountDue }, {t: 'address', v: web3utils.toChecksumAddress(newInvoiceData.recipientAddress)}, {t: 'uint256', v: newInvoiceData.ethBlockExpiresAt } );

       var digestBytes32 = web3utils.hexToBytes(digest)
      // console.log('digestBytes32',digestBytes32)

       return digest;
     }



}
