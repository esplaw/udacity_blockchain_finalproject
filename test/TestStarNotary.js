const StarNotary = artifacts.require("StarNotary");

let instance;
let accounts;

contract('StarNotary', async (accs) => {
    accounts = accs;
    instance = await StarNotary.deployed();
  });

  it('can Create a Star', async() => {
    let tokenId = 1;
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]});
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
  });

  it('lets user1 put up their star for sale', async() => {
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.toWei(.01, "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice)
  });

  it('lets user1 get the funds after the sale', async() => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.toWei(.01, "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: starPrice});
    let balanceOfUser1AfterTransaction = web3.eth.getBalance(user1);
    assert.equal(balanceOfUser1BeforeTransaction.add(starPrice).toNumber(), balanceOfUser1AfterTransaction.toNumber());
  });

  it('lets user2 buy a star, if it is put up for sale', async() => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.toWei(.01, "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: starPrice});
    assert.equal(await instance.ownerOf.call(starId), user2);
  });

  it('lets user2 buy a star and decreases its balance in ether', async() => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.toWei(.01, "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: starPrice, gasPrice:0});
    const balanceAfterUser2BuysStar = web3.eth.getBalance(user2);
    assert.equal(balanceOfUser2BeforeTransaction.sub(balanceAfterUser2BuysStar), starPrice);
  });

  it('token name and symbol are available', async () => {
    assert.equal(await instance.name.call(), 'Tobis Notray Star Token');
    assert.equal(await instance.symbol.call(), 'TNST');
  });

  it('lookup starname by token id', async () => {
    let user = accounts[0];
    let starId = 6;
    await instance.createStar('A brightly shining star', starId, {from: user});
    let result = await instance.lookUptokenIdToStarInfo(starId);
    assert.equal(result[0], 'A brightly shining star');
    assert.equal(result[1], user);
  });

  it('lookup all stars', async() => {
    let tokenId = 7;
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]});
    let tokenIds = await instance.lookUpStarInfoTokens();
    assert.equal(tokenIds.length, 7);
    assert.equal(tokenIds[6], 7);
  });

  it('transfer star from user1 to user2', async() => {
    let tokenId = 8;
    let user1 = accounts[1];
    let user2 = accounts[2];

    await instance.createStar('Awesome Star!', tokenId, {from: user1});

    // should be user 1
    let result = await instance.lookUptokenIdToStarInfo(tokenId);
    assert.equal(result[1], user1);

    await instance.transferStar(tokenId, user2, { from: user1 });

    // should be user 2 after transfer
    result = await instance.lookUptokenIdToStarInfo(tokenId);
    assert.equal(result[1], user2);
  });

  it('exchange stars between user1 and user2', async() => {
    let user1 = accounts[0];
    let tokenUser1 = 9;

    let user2 = accounts[1];
    let tokenUser2 = 10;

    await instance.createStar('Star User 1', tokenUser1, {from: user1});
    await instance.createStar('Star User 2', tokenUser2, {from: user2});

    // owners without exchange
    let lookUpTokenUser1 = await instance.lookUptokenIdToStarInfo(tokenUser1);
    let lookUpTokenUser2 = await instance.lookUptokenIdToStarInfo(tokenUser2);
    assert.equal(lookUpTokenUser1[1], user1);
    assert.equal(lookUpTokenUser2[1], user2);

    // set star for sale
    await instance.putStarUpForSale(tokenUser2, 1, {from: user2});

    // exchange get token from user2 and execute an exchange with user1 token
    await instance.exchangeStars(tokenUser2, tokenUser1, {from: user1});

    // owners with exchange
    lookUpTokenUser1 = await instance.lookUptokenIdToStarInfo(tokenUser1);
    lookUpTokenUser2 = await instance.lookUptokenIdToStarInfo(tokenUser2);
    assert.equal(lookUpTokenUser1[1], user2);
    assert.equal(lookUpTokenUser2[1], user1);

  });