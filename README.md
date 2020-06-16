# binary-object

Encode json objects into a binary format.
Inspired by msgpack. With reduces memory usage.

[![npm Package Version](https://img.shields.io/npm/v/binary-object.svg?maxAge=3600)](https://www.npmjs.com/package/binary-object)

## Features
- Encode any value to binary format (and decode back)
- Memory-efficient

Wide range of javascript data type are supported:
- string
- number
- bigint
- boolean
- Buffer
- Array
- Map
- Set
- Date
- object
- symbol
- function
- undefined
- null

## Why not MsgPack?
MsgPack cannot reclaim the memory usage.

When I use MsgPack to encode ~211k objects, and write them to a file (via fs.writeSync, fs.appendFileSync or fs.createWriteStream), the node runs out of memory.

In the test, each object comes from LMDB, a sync-mode embedded database.
The key and value of each object packed and written to file separately.
It doesn't cause out of memory error if I load all the objects into memory, then pack them as a single array (then write to file) but this batching approach doesn't work for long stream of data.

I tried to use setTimeout to slow down the writing, and even explicitly call `process.gc()` but the problem persist.

## How this library works?
This library re-use the buffer when encoding across multiple calls.
Effective like the object pooling but for buffer.

The `encode()` function works similar to the `pack()` in msgpack;
the `decode()` function works similar to the `unpack()` in msgpack.

## Does this work?
**Not yet**.

`encode()` is basically implemented, with a known bug;

`decode()` is not implemented yet.

## LICENSE
[BSD-2-Clause](./LICENSE) (Free Open Sourced Software)
