# binary-object

Encode json objects into a binary format.
Inspired by msgpack. With reduces memory usage.

[![npm Package Version](https://img.shields.io/npm/v/binary-object.svg?maxAge=3600)](https://www.npmjs.com/package/binary-object)

## Features
- Encode any value to binary format (and decode back)
- Memory-efficient
- Auto detect object schema to make the binary format more compact (optional)
- This library is highly composable, it can be extended/reused to support different encoding schema and intput/output channel

- Support varies encode/decode pipes:
  - [x] Binary Object
  - [x] Binary JSON
  - [x] Object Schema (store object keys only once, similar to csv, but nested)
  - [x] Msgpack

- Support varies input/output channel:
  - [ ] Buffer
  - [x] File
  - [ ] Stream (e.g. fs / net stream)
  - [x] Callback (for producer / consumer pattern)
  - [x] Array (for in-memory mock test)

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

In addition, a few generator method help to decode the binary data iteratively:
- `iterateSchemaFile()`
- `iterateBinaryFile()`

The `encode/1` function works similar to the `pack/1` in msgpack;
the `decode/1` function works similar to the `unpack/1` in msgpack.

## Does this work?
The correctness is tested and passed.

The benchmarking is not done.

## Combination & Performance
266430 sample json data:
843M

**high-speed**:
data > binary-json > file
(843M)

**space-efficient**:
data > schema > binary-object > file
(622M)


fast, and a bit space-efficient:
data > schema > binary-json > file
(833M)

fairly-fast, fairly-space-efficient:
data > schema > msgpack > file
(739M)

## LICENSE
[BSD-2-Clause](./LICENSE) (Free Open Sourced Software)
