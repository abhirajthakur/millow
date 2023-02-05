//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    address public lender;
    address public inspector;
    address payable public seller;

    modifier onlyBuyer(uint256 _nftId) {
        require(msg.sender == buyer[_nftId], "Only buyer can call this method");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    // nftId => boolean
    mapping(uint256 => bool) public isListed;
    // nftId => price
    mapping(uint256 => uint256) public purchasePrice;
    // nftId => escrow amount
    mapping(uint256 => uint256) public escrowAmount;
    // nftId => buyer's address
    mapping(uint256 => address) public buyer;
    // nftId => has inpection passed
    mapping(uint256 => bool) public inspectionPassed;
    // nftId => address approving the sale or not
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(
        address _nftAddress,
        address _lender,
        address _inspector,
        address payable _seller
    ) {
        nftAddress = _nftAddress;
        lender = _lender;
        inspector = _inspector;
        seller = _seller;
    }

    function list(
        uint256 _nftId,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        // Transfer NFT from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftId);
        isListed[_nftId] = true;
        purchasePrice[_nftId] = _purchasePrice;
        escrowAmount[_nftId] = _escrowAmount;
        buyer[_nftId] = _buyer;
    }

    function updateInspection(
        uint256 _nftId,
        bool _passed
    ) public onlyInspector {
        inspectionPassed[_nftId] = _passed;
    }

    // Put payment under contract
    // only buyer can call this method
    function depositEarnest(uint256 _nftId) public payable onlyBuyer(_nftId) {
        require(msg.value >= escrowAmount[_nftId]);
    }

    function approveSale(uint256 _nftId) public {
        approval[_nftId][msg.sender] = true;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function finalizeSale(uint256 _nftId) public {
        // require the inpection to be passed
        require(inspectionPassed[_nftId]);
        // require the approval of buyer, seller and lender
        require(approval[_nftId][buyer[_nftId]]);
        require(approval[_nftId][seller]);
        require(approval[_nftId][lender]);
        // require the funds to be of correct amount
        require(address(this).balance >= purchasePrice[_nftId]);

        isListed[_nftId] = false;

        // transfer funds to seller
        (bool success, ) = seller.call{value: address(this).balance}("");
        require(success);

        // transfer nft from contract to the buyer
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftId], _nftId);
    }

    receive() external payable {}
}
