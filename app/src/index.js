// Import the page's CSS. Webpack will know what to do with it.
import 'app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import StarNotaryArtifact from '../../build/contracts/StarNotary.json'

// StarNotary is our usable abstraction, which we'll use through the code below.
const StarNotary = contract(StarNotaryArtifact);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
let accounts;
let account;

const createStar = async () => {
  const instance = await StarNotary.deployed();
  const name = document.getElementById("starName").value;
  const id = document.getElementById("starId").value;
  await instance.createStar(name, id, {from: account});
  App.setStatus("New Star Owner is " + account + ".");
  App.starTokenModified();
};

const lookUptokenIdToStarInfo = async () => {
  const instance = await StarNotary.deployed();
  const id = document.getElementById("lookupStarId").value;
  const result = await instance.lookUptokenIdToStarInfo(id);
  const text = document.getElementById('lookupStarName');
  text.value = result[0];
};

const starTokenModified = async () => {
  let template = $('#hidden-card-template').html();
  $('#cardcontainer').empty();

  const instance = await StarNotary.deployed();
  const tokenIds = await instance.lookUpStarInfoTokens();
  tokenIds.forEach(async function(id){
    const result = await instance.lookUptokenIdToStarInfo(id);
    const name = result[0];
    const owner = result[1];
    const isForSale = !result[2] && owner === account;
    const isBuyable = result[2] && owner !== account;


    const card = $(template).clone();

    const elementStarName = $(card).find('.cardstarname');
    const elementTokenId = $(card).find('.cardtokenid');
    const elementStarOwner = $(card).find('.cardstarowner');
    const elementBtnForSale = $(card).find('.cardbtnforsale');
    const elementBtnBuyable = $(card).find('.cardbtnbuy');

    const elementTransfer = $(card).find('.cardtransfer');
    const elementBtnTransfer = $(card).find('.cardbtntransfer');

    const elementExchange = $(card).find('.cardexchange');
    const elementBtnExchange = $(card).find('.cardbtnexchange');

    elementStarName.html(name);
    elementTokenId.html('Token Id: ' + id);

    if(owner === account) {
      elementStarOwner.html('Owner: Yes, its mine.');
    } else {
      elementStarOwner.html('Owner: ' + owner);
    }

    elementBtnForSale.attr('onclick', 'App.putStarUpForSale(' + id + ')');
    elementBtnBuyable.attr('onclick', 'App.buyStar(' + id + ')');
    elementBtnTransfer.attr('onclick', 'App.transferStar(' + id + ', this)');
    elementBtnExchange.attr('onclick', 'App.exchangeStars(' + id + ', this)');

    if(!isForSale) {
      elementBtnForSale.hide();
      elementTransfer.hide();
    }

    if(!isBuyable) {
      elementBtnBuyable.hide();
      elementExchange.hide();
    }

    $('#cardcontainer').append(card);
  });
};

const putStarUpForSale = async (tokenId) => {
  const instance = await StarNotary.deployed();
  await instance.putStarUpForSale(tokenId, 1, { from: account });
  App.starTokenModified();
};

const buyStar = async (tokenId) => {
  const instance = await StarNotary.deployed();
  await instance.buyStar(tokenId, { from: account, value: 1 });
  App.starTokenModified();
};

const transferStar = async (tokenId, transferTo) => {
  const instance = await StarNotary.deployed();
  await instance.transferStar(tokenId, transferTo, { from: account });
  App.starTokenModified();
};

const exchangeStars = async (tokenId, exchangeTokenId) => {
  const instance = await StarNotary.deployed();
  await instance.exchangeStars(tokenId, exchangeTokenId, { from: account });
  App.starTokenModified();
};

const App = {
  start: function () {
    const self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    StarNotary.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.');
        return
      }

      if (accs.length === 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return
      }

      accounts = accs;
      account = accounts[0];
    })
  },

  setStatus: function (message) {
    const status = document.getElementById('status');
    status.innerHTML = message
  },

  createStar: function () {
    createStar();
  },

  lookUptokenIdToStarInfo: function () {
    lookUptokenIdToStarInfo();
  },

  putStarUpForSale: function (tokenId) {
    putStarUpForSale(tokenId);
  },

  buyStar: function (tokenId) {
    buyStar(tokenId);
  },

  transferStar: function (tokenId, element) {
    const transferTo = $(element).parent().find( '.cardtransferto' ).val();
    transferStar(tokenId, transferTo);
  },

  exchangeStars: function (tokenId, element) {
    const exchangeTokenId = $(element).parent().find( '.cardexchangetoken' ).val();
    exchangeStars(tokenId, exchangeTokenId);
  },

  starTokenModified: function () {
    starTokenModified();
  }

};

window.App = App;

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(
      'Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 MetaCoin,' +
      ' ensure you\'ve configured that source properly.' +
      ' If using MetaMask, see the following link.' +
      ' Feel free to delete this warning. :)' +
      ' http://truffleframework.com/tutorials/truffle-and-metamask'
    );
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
      ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
      ' Consider switching to Metamask for development.' +
      ' More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
  }

  App.start();
  App.starTokenModified();

  /**
   * Reload Stars on account change
   */
  window.ethereum.on('accountsChanged', function (accounts) {
    App.start();
    App.starTokenModified();
  });
});