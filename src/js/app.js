App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Games.json", function(games) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Games = TruffleContract(games);
      // Connect provider to interact with contract
      App.contracts.Games.setProvider(App.web3Provider);

      App.listenForEvents();

      App.listGames();

      App.listOfGames();

      App.getTrades();

      App.render();
    });
  },

  render: function() {
    var gameInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Games.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.gameCount();
    }).then(function(count) {
      $("#gameCount").html(count.toNumber());
      loader.hide();
      content.show();
    }); 
  },

  addGame : function() {
    var name = $("#gameName").val();
    var value = $("#gameValue").val();
    var imageUrl = $('#imageUrl').val();
    var description = $("#gameDescription").val();
    console.log(name, value);
    App.contracts.Games.deployed().then(function(instance){
      return instance.addGame(name, value, imageUrl, description, {from: App.account});
    }).then(function(result){
      console.log("done");
    }).catch(function(err){
      console.log(err);
    });
  },

  buyGame : function(obj) {
    var gameId = $(obj).attr('game-id');
    var gameName = $(obj).attr('game-name');
    App.contracts.Games.deployed().then(function(instance){
      instance.games(gameId).then(function(game){
        instance.buyGame(gameId, gameName, {value: web3.toWei(game[2], 'ether')});
      });
    }).catch(function(err){
      console.log(err);
    });
  },

  listGames : function() {
    var gameInstance;
    var card = $('#listGames');
    var gameTemplate = $('#gameTemplate');
    App.contracts.Games.deployed().then(function(instance){
      gameInstance = instance;
      return gameInstance.gameCount()
    }).then(function(count){
      console.log(count.toNumber());
      card.empty();
      for (var i=1 ; i <= count; i++){
        gameInstance.games(i).then(function(game){
          gameTemplate.find('.card-title').text(game[1]);
          gameTemplate.find('.mb-2').text(game[2] + " Eth");
          gameTemplate.find('.card-link').attr('game-id', game[0]);
          gameTemplate.find('.card-link').attr('game-name', game[1]);
          gameTemplate.find('.card-img').attr('src', game[3]);
          gameTemplate.find('.card-text').text(game[5].substring(0,200) + "...");
          card.append(gameTemplate.html());
        });
      }
    })
  },

  gameSearch : function() {
    var card = $('#listGames');
    var findGame = $('#gameSearch').val();
    var gameTemplate = $('#gameTemplate');
    var notFound = $("#notFound");

    App.contracts.Games.deployed().then(function(instance){
      gameInstance = instance;
      return gameInstance.gameCount()
    }).then(function(count){
      if (findGame != ""){
        card.empty();
        for (var i=1 ; i < count+1; i++){
          gameInstance.games(i).then(function(game){
            if(game[1].includes(findGame)){
              console.log(game[1], findGame);
              gameTemplate.find('.card-title').text(game[1]);
              gameTemplate.find('.mb-2').text(game[2] + " Eth");
              gameTemplate.find('.card-link').attr('game-id', game[0]);
              gameTemplate.find('.card-link').attr('game-name', game[1]);
              gameTemplate.find('.card-img').attr('src', game[3]);
              card.append(gameTemplate.html());
            }
          });
        }
      } else {
        card.empty();
        App.listGames();
      }
    })
  },

  listenForEvents : function() {
    App.contracts.Games.deployed().then(function(instance){
      instance.newGameAdd({},{
        fromBlock: 'latest'
      }).watch(function(error, event){
        console.log(event);
        //App.listGames();
      });
      instance.gameBought({},{
        fromBlock: 'latest'
      }).watch(function(error, event){
        //App.listOfGames();
      });
    });
  },

  listOfGames : function() {
    var gameInstance;
    var list = $("#gameList");
    var item = $("#item-teste");
    list.empty();
    App.contracts.Games.deployed().then(function(instance){
      gameInstance = instance;
      gameInstance.getGamesSize().then(function(size){
        for(var i=0;i<size; i++){
          gameInstance.getGames(i).then(function(result){
            console.log("aqui " + i);
            item.find(".list-group-item").text(result);
            list.append(item.html());
          });
        }
      });
    });
  },

  trade: function() {
    var address = $("#addressTrade").val();
    var game = $("#gameTrade").val();
    var value = $("#valueTrade").val();
    console.log(address, game, value);
    App.contracts.Games.deployed().then(function(instance){
      instance.initTrade(address, game, value, {from: App.account}).then(function(result){
        console.log("done");
      });
    });
  },

  getTrades: function() {
    var user = $("#userToTrade");
    var userAddress = $("#userTrade");
    var gameTrade = $("#gameTradeName");
    var gameVal = $("#gameVal");
    var accept = $("#accept");
    App.contracts.Games.deployed().then(function(instance){
      instance.getTrades({from: App.account}).then(function(result){
        user.show();     
        userAddress.text("User: " + result[0]);
        gameTrade.text(result[1]);
        gameVal.text(result[2]);
        accept.attr('value', result[2]);
        accept.attr('gameTradeName', result[1]);
        accept.attr('userTrade', result[0]);
      });
    });
  },

  acceptTrade: function(obj) {
    var val = $(obj).attr("value");
    var gameTrade = $(obj).attr("gameTradeName");
    var userTrade = $(obj).attr("userTrade");
    console.log(val, gameTrade, userTrade);
    App.contracts.Games.deployed().then(function(instance){
      instance.tradeGame(gameTrade, userTrade, {value: web3.toWei(val, 'ether')}).then(function(result){
        console.log(result);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
