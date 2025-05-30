// SPDX-License-Identifier: UNLICENSED
pragma solidity *;

enum E {
    ONE,
    TWO
}

struct S {
    address a;
    E e;
    bytes16 b;
}

contract Test {
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
