import { createDB, TableSchema } from 'better-sqlite3-schema'
import {
  makeSqliteSinkOptions,
  makeSqliteSourceOptions,
  SqliteValueSink,
  SqliteValueSource,
} from '../src/sqlite'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'
const file = 'db.sqlite3'

describe('sqlite TestSuit', () => {
  const db = createDB({ file, mode: 'overwrite' })
  const schema: TableSchema = {
    table: 'data',
    autoCreateTable: true,
    fields: {
      id: 'integer primary key',
      // value: 'json',
    },
    refFields: ['value'],
  }
  testSuit(
    jsonSample,
    () =>
      new SqliteValueSink({
        ...makeSqliteSinkOptions(db, schema, { autoClose: false }),
      }),
    () =>
      new SqliteValueSource({
        ...makeSqliteSourceOptions(db, schema, { autoClose: false }),
      }),
  )
  afterAll(() => db.close())
})
