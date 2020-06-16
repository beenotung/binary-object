# binary-object

Encode json objects into a binary format.
Inspired by msgpack. With reduces memory usage.

[![npm Package Version](https://img.shields.io/npm/v/binary-object.svg?maxAge=3600)](https://www.npmjs.com/package/binary-object)

## Features
- Encode any value to binary format (and decode back)
- Memory-efficient
- Support varies input/output type:
  - Buffer
  - File
  - Stream

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

## Why not [MsgPack](https://github.com/msgpack/msgpack-node)?
MsgPack cannot reclaim the memory usage.

When I use MsgPack to encode ~211k objects, and write them to a file (via fs.writeSync, fs.appendFileSync or fs.createWriteStream), the node runs out of memory.

In the test, each object comes from LMDB, a sync-mode embedded database.
The key and value of each object packed and written to file separately.
It doesn't cause out of memory error if I load all the objects into memory, then pack them as a single array (then write to file) but this batching approach doesn't work for long stream of data.

I tried to use setTimeout to slow down the writing, and even explicitly call `process.gc()` but the problem persist.

## Why not [BON](https://github.com/bon-org/bon-js)?
BON does not support parsing from file / stream.

The current implementation of BON requires the binary data to be passed into the `decode()` or `decode_all()` function in complete.

Also, the data schema of BON does not specify the length of list and string, which is compact in turns of the resulting binary data.
However, lacking this information means the decoding process cannot be preciously fetch the right amount of bytes from the file / readable stream.

As a result, BON cannot support continuous decoding from a large file / long stream.

## How this library works?
This library re-use the buffer when encoding across multiple calls.
Effective like the object pooling but for buffer.

Also, the length of each data chunk is deterministic from the header (data type and length).
Therefore, the decoder knows exactly how many bytes should be read to process.

In addition, a generator function `decode_all()`

The `encode/1` function works similar to the `pack/1` in msgpack;
the `decode/1` function works similar to the `unpack/1` in msgpack.

## Does this work?
**Not yet**.

`encode/1` is basically implemented, with a known bug;

`decode/1` is not implemented yet.

Generic input/output pipe is not supported yet.
It currently only works on buffer.

## LICENSE
[BSD-2-Clause](./LICENSE) (Free Open Sourced Software)
