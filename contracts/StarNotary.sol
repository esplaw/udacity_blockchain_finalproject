pragma solidity >=0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';

// StarNotary Contract declaration inheritance the ERC721 openzeppelin implementation
contract StarNotary is ERC721 {

    string public constant name = "Star Notary Token";
    string public constant symbol = "SNT";
    uint8 public constant decimals = 3;

    struct Star {
        string name;
    }
    
    uint256[] tokenIds;
    mapping(uint256 => Star) public tokenIdToStarInfo;
    mapping(uint256 => uint256) public starsForSale;

    function createStar(string memory _name, uint256 _tokenId) public {
        Star memory newStar = Star(_name);

        tokenIdToStarInfo[_tokenId] = newStar;
        tokenIds.push(_tokenId);

        _mint(msg.sender, _tokenId);
    }

    function lookUptokenIdToStarInfo(uint256 _tokenId) public view returns (string memory _name, address _owner, bool _forsale){
        Star memory star = tokenIdToStarInfo[_tokenId];
        _name = star.name;
        _owner = ownerOf(_tokenId);
        _forsale = starsForSale[_tokenId] != 0;
    }

    function lookUpStarInfoTokens() public view returns (uint256[] memory _tokenIds) {
        _tokenIds = tokenIds;
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender);

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable {
        require(starsForSale[_tokenId] > 0);

        uint256 starCost = starsForSale[_tokenId];
        address starOwner = ownerOf(_tokenId);
        require(msg.value >= starCost);

        _transferFrom(msg.sender, starOwner, _tokenId);

        /* starOwner.transfer(starCost); */

        if(msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }
        starsForSale[_tokenId] = 0;
      }

    function transferStar(uint256 _tokenId, address _to) public {
        require(ownerOf(_tokenId) == msg.sender);

        address starOwner = ownerOf(_tokenId);
        _transferFrom(starOwner, _to, _tokenId);
    }

    function exchangeStars(uint256 _tokenId, uint256 _exchangeTokenId) public {
        // Sender must be owner of token to exchange
        require(ownerOf(_exchangeTokenId) == msg.sender);

        // token must be available for sale
        require(starsForSale[_tokenId] > 0);

        // transfer exchange token to token owner
        _transferFrom(msg.sender, ownerOf(_tokenId), _exchangeTokenId);

        // transfer token to sender
        _transferFrom(ownerOf(_tokenId), msg.sender, _tokenId);
        starsForSale[_tokenId] = 0;
    }
}