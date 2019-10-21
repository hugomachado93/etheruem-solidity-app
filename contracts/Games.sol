pragma solidity ^0.5.8;
contract Games {

    struct Game {
        uint id;
        string name;
        uint value;
        string imageData;
        address payable gameOwner;
    }

    struct User {
        uint id;
        address addr;
        string gameOwned;
        uint gameOwnedId;
    }


    event newGameAdd(
        string game
    );

    mapping(uint => Game) public games;
    mapping(address => User) public users;
    mapping(bytes32 => bool) public gameList;

    uint public gameCount;
    uint public userCount;

    function addGame(string memory _name, uint _value, string memory _data) public {
        bytes32 nameHahsing = keccak256(abi.encode(_name));
        require(!gameList[nameHahsing], "Game already exists");

        gameCount++;
        games[gameCount] = Game(gameCount, _name, _value, _data, msg.sender);
        gameList[nameHahsing] = true;
        emit newGameAdd(_name);
    }

    function buyGame(uint _gameId) public payable {
        require(msg.value >= games[_gameId].value, "Not enough money");
        require(users[msg.sender].gameOwnedId != _gameId, "You already have this game");

        games[_gameId].gameOwner.transfer(msg.value);
        userCount++;
        users[msg.sender] = User(userCount, msg.sender, games[_gameId].name, _gameId);
    }

    function gameOwned(address addr) public view {
        return;
    }

}