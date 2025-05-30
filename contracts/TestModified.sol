// SPDX-License-Identifier: UNLICENSED
pragma solidity *;

import { E, S } from './Types.sol';

contract TestModified {
    // slots 0-1
    S str;
    // slot 2
    mapping(address => bool) map_renamed;
    // slots 3-5
    bytes16[5] array;
    // slot 6
    bool b0;
    // slots 7-8
    bool[4][2] nestedArray;
    // slot 9
    uint256 u;
}
