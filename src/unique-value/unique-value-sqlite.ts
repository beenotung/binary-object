import DB, { Database } from 'better-sqlite3'
import { Sink } from '../pipe'
import {
  AbstractUniqueValueSink,
  AbstractUniqueValueSource,
  Dict,
  Key,
  UniqueValueWriteLog,
} from './abstract-unique-value'

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
  const insert = db.prepare(`insert into "${table}" (line) values (?)`)
  return {
    write: db.transaction((data: string) => {
      insert.run(data)
    }),
    writeBatch: db.transaction((data: string[]) => {
      for (const datum of data) {
        insert.run(datum)
      }
    }),
    close() {
      // TODO close the DB?
    },
  }
}

function toLinesKeys(db: Database, table: string): Dict<string, Key> {
  dropTable(db, table)
  createTable(db, table)
  const has = db
    .prepare(`select count(id) from "${table}" where line = ?`)
    .pluck()
  const get = db
    .prepare(`select id from "${table}" where line = ? limit 1`)
    .pluck()
  const set = db.prepare(`insert into "${table}" (id,line) values (?,?)`)
  const count = db.prepare(`select count(id) from "${table}"`).pluck()
  return {
    has: db.transaction((line: string): boolean => {
      const count = has.get(line)
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
  const getKey = db
    .prepare(`select id from "${table}" where line = ? limit 1`)
    .pluck()
  const insert = db.prepare(`insert into "${table}" (line) values (?)`)
  const count = db.prepare(`select count(id) from "${table}"`).pluck()
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
    const db = DB(file)
    return new UniqueValueSqliteSink(db, 'sink')
  }
}

function toLines(db: Database, table: string): Dict<Key, string> {
  type K = Key
  type V = string
  const has = db
    .prepare(`select count(id) from "${table}" where id = ?`)
    .pluck()
  const get = db.prepare(`select line from "${table}" where id = ?`).pluck()
  const count = db.prepare(`select count(id) from "${table}"`).pluck()
  return {
    has: db.transaction((key: Key): boolean => {
      return has.get(key) > 0
    }),
    get: db.transaction((key: Key): string | undefined => {
      const line = get.get(key)
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
    const db = DB(file)
    return new UniqueValueSqliteSource(db, 'sink')
  }
}

function test() {
  const file = 'data/sqlite3.db'
  const sink = UniqueValueSqliteSink.fromFile(file)
  sink.write('Hello')
  sink.write(123)
  sink.close()
  const source = UniqueValueSqliteSource.fromFile(file)
  for (const item of source.iterator()) {
    console.log({ item })
  }
}

if (typeof process !== 'undefined' && process.argv[1] === __filename) {
  test()
}
