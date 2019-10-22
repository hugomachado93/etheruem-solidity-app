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
    console.log(name, value);
    App.contracts.Games.deployed().then(function(instance){
      return instance.addGame(name, value, imageUrl, {from: App.account});
    }).then(function(result){
      console.log("done");
    }).catch(function(err){
      console.log(err);
    });
  },

  buyGame : function(obj) {
    var gameId = $(obj).attr('game-id');
    console.log(gameId);
    App.contracts.Games.deployed().then(function(instance){
      instance.games(gameId).then(function(game){
        instance.buyGame(gameId, {value: web3.toWei(game[2], 'ether'), from: App.account});
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
          gameTemplate.find('.card-text').text(game[2] + " Eth");
          gameTemplate.find('.btn-primary').attr('game-id', game[0]);
          gameTemplate.find('.card-img-top').attr('src', game[3]);
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
              gameTemplate.find('.card-text').text(game[2] + ",00");
              gameTemplate.find('.btn-primary').attr('game-id', game[0]);
              gameTemplate.find('.img').attr('src', game[3]);
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
        App.listGames();
      });
      instance.gameBought({},{
        fromBlock: 'latest'
      }).watch(function(error, event){
        //App.listOfGames();
      });
    });
  },

  listOfGames : function() {
    var list = $("#gameList");
    var item = $("#item-teste");
    App.contracts.Games.deployed().then(function(instance){
      instance.getGames().then(function(result){
        list.empty();
        for(var i=0;i<result.length; i++){
          item.find(".list-group-item").text(result[i]);
          list.append(item.html());
        }
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
