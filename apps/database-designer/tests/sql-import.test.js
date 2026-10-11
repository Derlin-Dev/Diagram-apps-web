const test = require('node:test');
const assert = require('node:assert/strict');
const { parseSQL } = require('../js/sql-import.js');
const { generateSQL } = require('../js/sql.js');

let n = 5000;
const makeId = (prefix) => prefix + n++;

test('importa CREATE TABLE MySQL con claves inline/de tabla, UNIQUE y acciones FK', () => {
  const { tables, relations, warnings } = parseSQL(`
    CREATE TABLE \`users\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB;
    CREATE TABLE \`orders\` (
      \`id\` INT PRIMARY KEY,
      \`user_id\` INT NOT NULL,
      CONSTRAINT \`fk_orders_user\` FOREIGN KEY (\`user_id\`)
        REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    );
    INSERT INTO orders VALUES (1, 1);
  `, makeId);
  assert.deepEqual(tables.map((table) => table.name), ['users', 'orders']);
  assert.equal(tables[0].fields.find((field) => field.name === 'id').ai, true);
  assert.equal(tables[0].fields.find((field) => field.name === 'email').uq, true);
  assert.equal(relations.length, 1);
  assert.equal(relations[0].onDelete, 'CASCADE');
  assert.equal(relations[0].onUpdate, 'RESTRICT');
  assert.equal(relations[0].type, '1:N');
  assert.equal(tables[1].fields.find((field) => field.name === 'user_id').fk, true);
  assert.ok(warnings.some((warning) => warning.includes('no soportada') || warning.includes('no soportada: INSERT')));
});

test('importa PostgreSQL con serial, esquema calificado y referencias inline SET NULL', () => {
  const { tables, relations, warnings } = parseSQL(`
    CREATE TABLE public.users (
      id SERIAL PRIMARY KEY,
      email CHARACTER VARYING(255) UNIQUE
    );
    CREATE TABLE public.profiles (
      id INTEGER PRIMARY KEY,
      user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE
    );
  `, makeId);
  assert.equal(tables[0].fields[0].ai, true);
  assert.equal(tables[0].fields[1].uq, true);
  assert.equal(relations.length, 1);
  assert.equal(relations[0].onDelete, 'SET NULL');
  assert.equal(tables[1].fields.find((field) => field.name === 'user_id').nn, false);
  assert.ok(warnings.some((warning) => warning.includes('TIMESTAMP')));
});

test('importa SQLite, ignora comentarios y avisa de sentencias/constraints no soportadas', () => {
  const { tables, relations, warnings } = parseSQL(`
    -- comment with semicolon ; and CREATE TABLE ignored
    CREATE TABLE [parents] (
      [id] INTEGER PRIMARY KEY AUTOINCREMENT,
      [code] TEXT UNIQUE
    );
    CREATE TABLE "children" (
      "id" INTEGER PRIMARY KEY,
      "parent_id" INTEGER NOT NULL,
      FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE,
      CHECK ("parent_id" > 0)
    );
    CREATE INDEX children_parent_idx ON children(parent_id);
  `, makeId);
  assert.equal(tables.length, 2);
  assert.equal(tables[0].fields[0].ai, true);
  assert.equal(relations.length, 1);
  assert.equal(relations[0].onDelete, 'CASCADE');
  assert.ok(warnings.some((warning) => warning.includes('CHECK')));
  assert.ok(warnings.some((warning) => warning.includes('CREATE INDEX')));
});

test('importa SQL rodeado por fences Markdown y comentarios', () => {
  const { tables, relations, warnings } = parseSQL(`
    -- Agrega una tabla para generar SQL.
    \`\`\`sql
    CREATE TABLE users (
      id CHAR(36) PRIMARY KEY,
      role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER'
    );
    CREATE TABLE addresses (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      CONSTRAINT fk_addresses_users
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX idx_addresses_user ON addresses(user_id);
    \`\`\`
  `, makeId);
  assert.deepEqual(tables.map((table) => table.name), ['users', 'addresses']);
  assert.equal(relations.length, 1);
  assert.equal(relations[0].onDelete, 'CASCADE');
  assert.equal(relations[0].onUpdate, 'CASCADE');
  assert.ok(warnings.some((warning) => warning.includes('CREATE INDEX')));
});

test('reporta FKs compuestas omitidas y falla si no hay CREATE TABLE válido', () => {
  const result = parseSQL(`
    CREATE TABLE parent (a INT, b INT, PRIMARY KEY (a, b));
    CREATE TABLE child (a INT, b INT, FOREIGN KEY (a, b) REFERENCES parent (a, b));
  `, makeId);
  assert.equal(result.relations.length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes('compuesta')));
  assert.throws(() => parseSQL('DROP TABLE users;', makeId), /No se encontraron/);
  assert.throws(() => parseSQL('', makeId), /vacío/);
});

test('reimporta el DDL exportado por la aplicación en los tres dialectos', () => {
  const model = {
    tables: [
      { id: 't1', name: 'customers', x: 0, y: 0, color: '#1684e8', junction: null, fields: [
        { id: 'f1', name: 'id', type: 'INT', pk: true, nn: true, ai: false, uq: false, fk: false },
      ] },
      { id: 't2', name: 'orders', x: 0, y: 0, color: '#07865f', junction: null, fields: [
        { id: 'f2', name: 'id', type: 'INT', pk: true, nn: true, ai: false, uq: false, fk: false },
        { id: 'f3', name: 'customer_id', type: 'INT', pk: false, nn: true, ai: false, uq: false, fk: true },
      ] },
    ],
    relations: [{
      id: 'r1', type: '1:N', sourceTable: 't1', sourceField: 'f1',
      targetTable: 't2', targetField: 'f3', onDelete: 'CASCADE', onUpdate: 'NO ACTION',
      created: false, uqAdded: false, group: null,
    }],
  };
  for (const dialect of ['mysql', 'postgres', 'sqlite']) {
    const imported = parseSQL(generateSQL(model, dialect), makeId);
    assert.equal(imported.tables.length, 2, `${dialect}: table count`);
    assert.equal(imported.relations.length, 1, `${dialect}: relation count`);
    assert.equal(imported.relations[0].onDelete, 'CASCADE', `${dialect}: ON DELETE`);
  }
});

test('importa valores DEFAULT literales y CURRENT_TIMESTAMP con escape de comillas', () => {
  const { tables, warnings } = parseSQL(`
    CREATE TABLE settings (
      name VARCHAR(255) NOT NULL DEFAULT 'O''Reilly',
      retries INT DEFAULT 3,
      enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expression_value INT DEFAULT (1 + 2)
    );
  `, makeId);
  const fields = Object.fromEntries(tables[0].fields.map((field) => [field.name, field]));
  assert.equal(fields.name.defaultValue, "O'Reilly");
  assert.equal(fields.retries.defaultValue, '3');
  assert.equal(fields.enabled.defaultValue, 'true');
  assert.equal(fields.created_at.defaultValue, 'CURRENT_TIMESTAMP');
  assert.equal(fields.expression_value.defaultValue, null);
  assert.ok(warnings.some((warning) => warning.includes('expresión no soportada')));
});

test('el tipo DECIMAL del editor no genera advertencia de normalización', () => {
  const { tables, warnings } = parseSQL(
    'CREATE TABLE invoices (id INT PRIMARY KEY, total DECIMAL(10,2) NOT NULL);',
    makeId
  );
  assert.equal(tables[0].fields.find((field) => field.name === 'total').type, 'DECIMAL(10,2)');
  assert.deepEqual(warnings, []);
});
