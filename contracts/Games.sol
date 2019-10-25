pragma solidity ^0.5.8;
contract Games {

    address owner;

    constructor () public {
        owner = msg.sender;
    }

    struct Game {
        uint id;
        string name;
        uint value;
        string imageData;
        address payable gameOwner;
        string description;
    }

    struct User {
        uint id;
        address addr;
        uint[] gameOwnedId;
        string[] gameOwnedName;
        Trade[] trades;
    }

    struct Trade {
        address payable userTrade;
        string gameName;
        uint val;
    }


    event newGameAdd(
        string game
    );

    event gameBought(
        string game
    );

    event gameTraded();

    mapping(uint => Game) public games;
    mapping(address => User) public users;
    mapping(bytes32 => bool) public gameList;

    uint public gameCount;
    uint public userCount;

    function addGame(string memory _name, uint _value, string memory _data, string memory _description) public {
        bytes32 nameHahsing = keccak256(abi.encode(_name));
        require(!gameList[nameHahsing], "Game already exists");

        gameCount++;
        games[gameCount] = Game(gameCount, _name, _value, _data, msg.sender, _description);
        gameList[nameHahsing] = true;
        emit newGameAdd(_name);
    }

    function buyGame(uint _gameId, string memory _name) public payable {
        require(msg.value >= games[_gameId].value, "Not enough money");

        games[_gameId].gameOwner.transfer(msg.value);

        userCount++;
        users[msg.sender].id = userCount;
        users[msg.sender].addr = msg.sender;
        users[msg.sender].gameOwnedId.push(_gameId);
        users[msg.sender].gameOwnedName.push(_name);

        emit gameBought(games[_gameId].name);

    }

    function getGames(uint _index) public view returns (string memory) {
        return users[msg.sender].gameOwnedName[_index];
    }

    function getGamesSize() public view returns (uint) {
        return users[msg.sender].gameOwnedId.length;
    }

    function initTrade(address addr, string memory gameName, uint valor) public {
        require(msg.sender != addr, "User cant trade with himself");
        users[addr].trades.push(Trade(msg.sender, gameName, valor));
    }

    function getTrades() public view returns (address, string memory, uint) {
        if(users[msg.sender].trades[0].userTrade == address(0)){
            return (address(0), "", 0);
        }
        return (users[msg.sender].trades[0].userTrade, users[msg.sender].trades[0].gameName, users[msg.sender].trades[0].val);
    }

    function tradeGame(string memory _gameName, address addr) public payable {
        require(msg.sender != addr, "User cant trade with himself");

        uint len = users[addr].gameOwnedId.length;

        for(uint i = 0;i < len; i++){
            if(keccak256(abi.encodePacked(users[addr].gameOwnedName[i])) == keccak256(abi.encodePacked(_gameName))) {
                users[msg.sender].gameOwnedId.push(users[addr].gameOwnedId[i]);
                users[msg.sender].gameOwnedName.push(users[addr].gameOwnedName[i]);
                delete users[addr].gameOwnedId[i];
                delete users[addr].gameOwnedName[i];
                users[msg.sender].trades[0].userTrade.transfer(msg.value);
            }
        }

        delete users[msg.sender].trades;

        emit gameTraded();
    }

}