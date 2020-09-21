import { Sink, Source } from '../pipe'
import DB, { Database } from 'better-sqlite3'
import {
  AbstractUniqueValueSink,
  AbstractUniqueValueSource,
  Dict,
  Key,
  UniqueValueWriteLog,
} from './abstract-unique-value'
import { jsonSample } from '../../test/sample-object'

function dropTable(db: Database, table: string) {
  db.exec(`drop table if exists "${table}"`)
}

function createTable(db: Database, table: string) {
  db.exec(`
create table if not exists "${table}" (
  id integer primary key,
  line text
)`)
}

function toSink(db: Database, table: string): Sink<string> {
  dropTable(db, table)
  createTable(db, table)
  let insert = db.prepare(`insert into "${table}" (line) values (?)`)
  return {
    write: db.transaction((data: string) => {
      insert.run(data)
    }),
    writeBatch: db.transaction((data: string[]) => {
      for (let datum of data) {
        insert.run(datum)
      }
    }),
    close() {},
  }
}

function toLinesKeys(db: Database, table: string): Dict<string, Key> {
  dropTable(db, table)
  createTable(db, table)
  let has = db
    .prepare(`select count(id) from "${table}" where line = ?`)
    .pluck()
  let get = db
    .prepare(`select id from "${table}" where line = ? limit 1`)
    .pluck()
  let set = db.prepare(`insert into "${table}" (id,line) values (?,?)`)
  let count = db.prepare(`select count(id) from "${table}"`).pluck()
  return {
    has: db.transaction((line: string): boolean => {
      let count = has.get(line)
      return count > 0
    }),
    get: db.transaction(
      (line: string): Key => {
        return get.get(line)
      },
    ),
    set: db.transaction((line: string, id: Key) => {
      set.run(id, line)
    }),
    count: db.transaction((): number => {
      return count.get()
    }),
  }
}

function toWriteLog(db: Database, table: string): UniqueValueWriteLog {
  dropTable(db, table)
  createTable(db, table)
  let getKey = db
    .prepare(`select id from "${table}" where line = ? limit 1`)
    .pluck()
  let insert = db.prepare(`insert into "${table}" (line) values (?)`)
  let count = db.prepare(`select count(id) from "${table}"`).pluck()
  return {
    getKey: db.transaction((line: string): Key | null => {
      return +getKey.get(line) || null
    }),
    write: db.transaction(
      (line: string): Key => {
        return +insert.run(line).lastInsertRowid
      },
    ),
    count: db.transaction((): number => {
      return +count.get()
    }),
  }
}

export class UniqueValueSqliteSink extends AbstractUniqueValueSink {
  constructor(public db: Database, public table: string) {
    super(toWriteLog(db, table))
  }

  static fromFile(file: string): UniqueValueSqliteSink {
    let db = DB(file)
    return new UniqueValueSqliteSink(db, 'sink')
  }
}

function toLines(db: Database, table: string): Dict<Key, string> {
  type K = Key
  type V = string
  let has = db.prepare(`select count(id) from "${table}" where id = ?`).pluck()
  let get = db.prepare(`select line from "${table}" where id = ?`).pluck()
  let count = db.prepare(`select count(id) from "${table}"`).pluck()
  return {
    has: db.transaction((key: Key): boolean => {
      return has.get(key) > 0
    }),
    get: db.transaction((key: Key): string | undefined => {
      let line = get.get(key)
      return line
    }),
    set(key: K, value: V) {
      throw new Error('unsupported operation')
    },
    count: () => {
      // return count
      return count.get()
    },
  }
}

export class UniqueValueSqliteSource extends AbstractUniqueValueSource {
  constructor(public db: Database, public table: string) {
    super(toLines(db, table))
  }

  static fromFile(file: string): UniqueValueSqliteSource {
    let db = DB(file)
    return new UniqueValueSqliteSource(db, 'sink')
  }
}

function test() {
  let file = 'data/sqlite3.db'
  let sink = UniqueValueSqliteSink.fromFile(file)
  for (let sample of jsonSample) {
    // sink.write(sample)
  }
  sink.write('Hello')
  sink.write(123)
  sink.close()
  let source = UniqueValueSqliteSource.fromFile(file)
  for (let item of source.iterator()) {
    console.log({ item })
  }
}

test()
