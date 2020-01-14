var accounts = {

  //ethereum address where money from paid invoices will be deposited
  recipient: {
    address: '0xf3243bAbF74Ead828ac656877137Df705868fD66'
  },

  //ethereum account that will execute onchain Ethereum methods
  msgsender: {
    address: '0xf3243bAbF74Ead828ac656877137Df705868fD66',
    privateKey: '00000'
  },




}

var web3 = {
  ropstenURL: 'https://ropsten.infura.io/v3/xxx';
  mainnetURL: 'https://mainnet.infura.io/v3/xxx';

}

exports = {accounts:accounts, web3: web3}
//exports.accounts = accounts
