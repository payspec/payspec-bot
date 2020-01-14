
const $ = require('jquery');
import Vue from 'vue';

var ethUrlParser = require('eth-url-parser')

var QRCode = require('qrcode')


import ContractInterface from './contract-interface'

var invoiceData;
var payInvoiceInput;
var submitInvoiceInput;

var ethereumHelper;
var invoiceUUID;

var approveTokensInput;


export default class InvoiceRenderer {



    async init( ethHelper, params )
    {
      ethereumHelper = ethHelper;
      this.params = params;

      invoiceUUID = params.uuid;
      //initEthContainer()




    }

    update()
    {

    }

    async fetchOffchainInvoiceWithUUID(uuid)
    {
      var result = await new Promise((resolve, reject) => {
        $.ajax({
          url: '/invoice_data/'+uuid,
          beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
          type: 'GET',
          success: function(data) {
            console.log('got ajax response', data )

            resolve( data)
          },
          error: function(error) {
            reject(error)
          },
        })
      })

      return result.invoice

    }

    async onWeb3Connected() //from eth helper callback
    {
      console.log(' on web3 !!')

      var self = this;



        this.initInvoiceDataTable()

        Vue.set(payInvoiceInput, 'web3connected', true)
          Vue.set(submitInvoiceInput, 'web3connected', true)


        await this.loadInvoiceData( self )

        setInterval(function(){  self.loadInvoiceData(self)  }, 10000);


    }

    async initInvoiceDataTable()
    {
      var self = this;

      var web3 = ethereumHelper.getWeb3Instance();

      var env = ethereumHelper.getEnvironmentName();

      var paySpecContract = ContractInterface.getPaySpecContract(web3,env)


      invoiceData = new Vue({
          el: '#invoice-data',
          data: {
             invoiceUUID: invoiceUUID,
             invoiceExists: false,
             description: '',
             referenceNumber: '',
             recipientAddress: '',
             tokenAddress: '',
             tokenAmount: '',
             onChain: false,
             paidStatus: false,
          },
          methods: {
                keyUp: function (event) {
                   //Vue.set(createInvoiceInput, 'showAvailability', false)
                },
                inputChange: function (event) {
                  console.log('input change',  this.inputName, event)

                //  self.checkNameAvailability( this.inputName );
                },
                updated() {
                  console.log('on update')

                },
                onSubmitNewInvoice: function (event){
                  console.log('pay invoice ', this.invoiceUUID)
                  //self.claimName( this.inputName )



                  self.payInvoice( this.invoiceUUID )
                }
            }
        })


          approveTokensInput = new Vue({
              el: '#approve-tokens-input',
              data: {
                 contractAddress: paySpecContract.address,
                 tokenAddress: '',
                 amount: 0,
                 paidStatus: false,
              },
              methods: {
                    keyUp: function (event) {
                       //Vue.set(createInvoiceInput, 'showAvailability', false)
                    },
                    inputChange: function (event) {
                      console.log('input change',  this.inputName, event)

                    //  self.checkNameAvailability( this.inputName );
                    },
                    onSubmit: function (event){
                      console.log('pay invoice ', this.invoiceUUID)
                      //self.claimName( this.inputName )

                      self.approveTokens(  this.tokenAddress ,this.contractAddress, this.amount  )
                    }
                }
            })



            submitInvoiceInput = new Vue({
                el: '#submit-invoice-input',
                data: {
                   invoiceUUID: invoiceUUID,
                   paidStatus: false,
                   onChain:false,
                   web3connected: false
                },
                methods: {
                      keyUp: function (event) {
                         //Vue.set(createInvoiceInput, 'showAvailability', false)
                      },
                      inputChange: function (event) {
                        console.log('input change',  this.inputName, event)

                      //  self.checkNameAvailability( this.inputName );
                      },
                      onSubmit: function (event){
                        console.log('pay invoice ', this.invoiceUUID)
                        //self.claimName( this.inputName )

                        self.createAndPayInvoice( this.invoiceUUID )
                      }
                  }
              })


                payInvoiceInput = new Vue({
                    el: '#pay-invoice-input',
                    data: {
                       invoiceUUID: invoiceUUID,
                       paidStatus: false,
                       onChain:false,

                       web3connected: false
                    },
                    methods: {
                          keyUp: function (event) {
                             //Vue.set(createInvoiceInput, 'showAvailability', false)
                          },
                          inputChange: function (event) {
                            console.log('input change',  this.inputName, event)

                          //  self.checkNameAvailability( this.inputName );
                          },
                          onSubmit: function (event){
                            console.log('pay invoice ', this.invoiceUUID)
                            //self.claimName( this.inputName )



                            self.payInvoice( this.invoiceUUID )
                          }
                      }
                  })

    }

    async loadInvoiceData( self )
    {

      var web3 = ethereumHelper.getWeb3Instance();

      var env = ethereumHelper.getEnvironmentName();


      var paySpecContract = ContractInterface.getPaySpecContract(web3,env)

      console.log('load invoice data')
      console.log(invoiceUUID)
      console.log( paySpecContract )

  //    console.log( paySpecContract.getDescription(invoiceUUID).call()  )


      let onchainInvoiceExists = await new Promise(resolve => {
        paySpecContract.invoiceExists(invoiceUUID,  function(error,response){
            console.log('res', response )
            console.log('error', error)
           resolve( response  );
           })
      });


      if(onchainInvoiceExists)
      {



        console.log('invoice exists??')



        let amountDue = await new Promise(resolve => {
          paySpecContract.getAmountDue(invoiceUUID,  function(error,response){
              console.log('res', response )
              console.log('error', error)
             resolve( response.toNumber() );
             })
        });
          Vue.set(invoiceData, 'tokenAmount', amountDue )

          let tokenAddress = await new Promise(resolve => {
            paySpecContract.getTokenAddress(invoiceUUID,  function(error,response){
                console.log('res', response )
                console.log('error', error)
               resolve( response );
               })
          });

          Vue.set(invoiceData, 'tokenAddress', tokenAddress )
          Vue.set(approveTokensInput, 'tokenAddress', tokenAddress )



          let recipientAddress = await new Promise(resolve => {
            paySpecContract.getRecipientAddress(invoiceUUID,  function(error,response){
                console.log('res', response )
                console.log('error', error)
               resolve( response );
               })
          });

          Vue.set(invoiceData, 'recipientAddress', recipientAddress )


        let descrip = await new Promise(resolve => {
          paySpecContract.getDescription(invoiceUUID,  function(error,response){
              console.log('res', response )
              console.log('error', error)
             resolve( response );
             })
        });

        Vue.set(invoiceData, 'description', descrip )

        let refNumber = await new Promise(resolve => {
          paySpecContract.getRefNumber(invoiceUUID,  function(error,response){
              console.log('res', response )
              console.log('error', error)
             resolve( response.toNumber() );
             })
        });
          Vue.set(invoiceData, 'referenceNumber', refNumber )

          let wasPaid = await new Promise(resolve => {
            paySpecContract.invoiceWasPaid(invoiceUUID,  function(error,response){
                console.log('res', response )
                console.log('error', error)
               resolve( response  );
               })
          });



            Vue.set(invoiceData, 'paidStatus', wasPaid )

            Vue.set(approveTokensInput, 'paidStatus', wasPaid )

            Vue.set(submitInvoiceInput, 'paidStatus', wasPaid )
            Vue.set(payInvoiceInput, 'paidStatus', wasPaid )



            Vue.set(invoiceData, 'onChain', true  )

            Vue.set(submitInvoiceInput, 'onChain', true )
            Vue.set(payInvoiceInput, 'onChain', true )





      }else{
        //try to get it from the mongo db offchain
          var invoice = await this.fetchOffchainInvoiceWithUUID(invoiceUUID)
          console.log('fetched' , invoice)

          var offchainInvoiceExists = (invoice != null);


          Vue.set(invoiceData, 'tokenAmount', invoice.amountDue )

          Vue.set(invoiceData, 'tokenAddress', invoice.tokenAddress )
          Vue.set(approveTokensInput, 'tokenAddress', invoice.tokenAddress )

          Vue.set(invoiceData, 'recipientAddress', invoice.recipientAddress )

          Vue.set(invoiceData, 'description', invoice.description )

          Vue.set(invoiceData, 'referenceNumber', invoice.refNumber )

          var wasPaid = false;  //not on chain so cant be paid





          Vue.set(invoiceData, 'paidStatus', wasPaid )

          Vue.set(approveTokensInput, 'paidStatus', wasPaid )

          Vue.set(payInvoiceInput, 'paidStatus', wasPaid )
          Vue.set(submitInvoiceInput, 'paidStatus', wasPaid )

          Vue.set(invoiceData, 'onChain', false )

          Vue.set(payInvoiceInput, 'onChain', false )
          Vue.set(submitInvoiceInput, 'onChain', false )


      }

      console.log('invoice exists?', onchainInvoiceExists || offchainInvoiceExists)

      Vue.set(invoiceData, 'invoiceExists', onchainInvoiceExists || offchainInvoiceExists )



          Vue.nextTick(function () {
              // do something cool
              console.log('vue next tick ')

              self.generateQRCode()
            })


    }

    async generateQRCode() //from eth helper callback
    {


      var web3 = ethereumHelper.getWeb3Instance();

      var env = ethereumHelper.getEnvironmentName()


      var paySpecContract = ContractInterface.getPaySpecContract(web3,env)



      var paySpecContractAddress = paySpecContract.address;
  //    var invoiceUUID = this.params.uuid;



      //https://github.com/soldair/node-qrcode
      var options = {
        scale: 8
      }

      //ethereum:<contract_address>/approve?address=<spender>&uint256=<amount>

     //https://ethereum-magicians.org/t/tools-for-implementing-eip-681-and-eip-831/1320


      //example erc20 transfer ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1

      //http://localhost:8080/invoice.html?uuid=0x0
      var invoiceuuid = 0x0;


      var ethUrlBuildData = {
        scheme: 'ethereum',
        prefix: 'call', //? Is this correct for EIP618 ?
        target_address: paySpecContractAddress,
        function_name:  'payInvoice',
        parameters: { 'bytes32' : invoiceUUID}
      }

      var encodedData = ethUrlParser.build(ethUrlBuildData )


      console.log( ' creating QR code with: ', encodedData)
      //encodeddata = 'ethereum:0xb6ed7644c69416d67b522e20bc294a9a9b405b31/approve?address=0xb6ed7644c69416d67b522e20bc294a9a9b405b31&uint256=100'

      var qrcodecanvas = document.getElementById('qr-code-canvas')


      QRCode.toCanvas(qrcodecanvas, encodedData, options, function (error) {
        if (error) console.error(error)
        console.log('success!');
      })

    }

    async createAndPayInvoice(  invoiceUUID )
    {

      console.log('create and pay invoice ', invoiceUUID)

      var invoice = await this.fetchOffchainInvoiceWithUUID(invoiceUUID)


      var web3 = ethereumHelper.getWeb3Instance();

      var env = ethereumHelper.getEnvironmentName()

      console.log('env ',env)

      var connectedAddress = ethereumHelper.getConnectedAccountAddress()

      var paySpecContract = ContractInterface.getPaySpecContract(web3,env)


       var currentEthBlock = await ethereumHelper.getCurrentEthBlockNumber()

    //   var ethBlockExpiresAt = currentEthBlock + 2000
      //web3.eth.defaultAccount = web3.eth.accounts[0]
       //personal.unlockAccount(web3.eth.defaultAccount)


      // await web3.eth.enable();
//createAndPayInvoice(uint256 refNumber, string memory description,  address token, uint256 amountDue, address payTo, uint256 ethBlockExpiresAt )
  console.log('send data', invoice.refNumber, invoice.description, invoice.tokenAddress, invoice.amountDue, invoice.recipientAddress, invoice.ethBlockExpiresAt)
      var response =  await new Promise(function (result,error) {
         paySpecContract.createAndPayInvoice.sendTransaction(invoice.refNumber, invoice.description, invoice.tokenAddress, invoice.amountDue, invoice.recipientAddress, invoice.ethBlockExpiresAt, function(err,res){
            if(err){ return error(err)}

            result(res);
         })
       });


    }



        async payInvoice(  invoiceUUID )
        {

          console.log('pay invoice ', invoiceUUID)



          var web3 = ethereumHelper.getWeb3Instance();

          var env = ethereumHelper.getEnvironmentName()

          console.log('env ',env)

          var connectedAddress = ethereumHelper.getConnectedAccountAddress()

          var paySpecContract = ContractInterface.getPaySpecContract(web3,env)


          //web3.eth.defaultAccount = web3.eth.accounts[0]
           //personal.unlockAccount(web3.eth.defaultAccount)


          // await web3.eth.enable();

          var response =  await new Promise(function (result,error) {
             paySpecContract.payInvoice.sendTransaction(invoiceUUID, function(err,res){
                if(err){ return error(err)}

                result(res);
             })
           });


        }

        async approveTokens( tokenAddress, contractAddress , amount  )
        {



          var web3 = ethereumHelper.getWeb3Instance();

          var env = ethereumHelper.getEnvironmentName()

          console.log('env ',env)

          var connectedAddress = ethereumHelper.getConnectedAccountAddress()

          // paySpecContract = ContractInterface.getPaySpecContract(web3,env)
          var tokenContract = ContractInterface.getTokenContract(web3,env, tokenAddress);

          //web3.eth.defaultAccount = web3.eth.accounts[0]
           //personal.unlockAccount(web3.eth.defaultAccount)


          // await web3.eth.enable();

          var response =  await new Promise(function (result,error) {
             tokenContract.approve.sendTransaction(contractAddress,amount, function(err,res){
                if(err){ return error(err)}

                result(res);
             })
           });


        }


}
