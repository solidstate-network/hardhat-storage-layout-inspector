// SPDX-License-Identifier: MIT
pragma solidity *;

contract SlotsZero {}

contract SlotsOne {
    uint256 one;
}

contract SlotsOneOffsetOne is SlotsOne layout at 1  {}

contract SlotsTwo is SlotsOne {
    uint256 two;
}

contract SlotsTwoOffsetOne is SlotsTwo layout at 1  {}

contract SlotsTwoOffsetTwo is SlotsTwo layout at 2  {}
