// SPDX-License-Identifier: MIT
// Pragma
pragma solidity ^0.8.7; //0.8.8

//Imports
import "./PriceConverter.sol";

// Errors
error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 10 * 1e18;

    //Modifiers
    modifier onlyOwner() {
        // require(msg.sender==i_owner, "NOT ACCESSIBLE!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _; //to execute remaining code
    }

    address[] private s_senders;
    // to keep track of s_senders and their funds
    mapping(address => uint256) private s_addressToAmtSent;

    address private immutable i_owner;
    AggregatorV3Interface public s_priceFeed;

    // Constructor
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    //when sender sends money accidentally without using fund fn
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    // fn to collect fund
    // function fund() public payable {
    //     require(
    //         msg.value.getConversionRate(priceFeed) >= 50,
    //         "Not sufficient!"
    //     );
    //     s_senders.push(msg.sender);
    //     s_s_s_addressToAmtSent[msg.sender] += msg.value;
    // }
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmtSent[msg.sender] += msg.value;
        s_senders.push(msg.sender);
        // console.log("Your fund has been accepted");
    }

    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < s_senders.length; i++) {
            address senderAddress = s_senders[i];
            s_addressToAmtSent[senderAddress] = 0;
        }

        s_senders = new address[](0); //resetting the s_senders array
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "CALL FAILED!");
    }

    function cheaperwithdraw() public onlyOwner {
        address[] memory senders = s_senders;

        for (uint256 i = 0; i < senders.length; i++) {
            address senderAddress = senders[i];
            s_addressToAmtSent[senderAddress] = 0; // for mapping we can't store it in memory
        }

        s_senders = new address[](0); //resetting the s_senders array
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "CALL FAILED!");
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_senders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmtSent[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
