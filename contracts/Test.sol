// SPDX-License-Identifier: UNLICENSED
pragma solidity *;

import { E, S } from './Types.sol';

contract Test layout at 1 {
    // slots 0-1
    S str;
    // slot 2
    mapping(address => bool) map;
    // slots 3-5
    uint128[5] array;
    // slot 6
    bool b0;
    bool b1;
    // slots 7-8
    bool[4][2] nestedArray;
}
