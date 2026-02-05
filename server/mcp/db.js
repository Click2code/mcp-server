/**
 * Standardized Database Access Layer for MCP Tools
 *
 * Provides a uniform interface for all MCP tools to query PostgreSQL.
 * Tools should use this module instead of importing pg directly, ensuring
 * consistent connection pooling, error handling, and query logging.
 */

import { query as dbQuery, getClient } from '../db/connection.js';

/**
 * Execute a parameterized SQL query.
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<Object>} { rows, rowCount, fields }
 */
export async function query(text, params = []) {
  const result = await dbQuery(text, params);
  return {
    rows: result.rows,
    rowCount: result.rowCount,
    fields: result.fields?.map(f => f.name) || [],
  };
}

/**
 * Fetch a single row by primary key or unique column.
 * @param {string} table - Table name
 * @param {string} column - Column to match
 * @param {*} value - Value to match
 * @returns {Promise<Object|null>} Row or null
 */
export async function findOne(table, column, value) {
  const result = await dbQuery(
    `SELECT * FROM ${table} WHERE ${column} = $1 LIMIT 1`,
    [value]
  );
  return result.rows[0] || null;
}

/**
 * Fetch multiple rows with optional filtering.
 * @param {string} table - Table name
 * @param {Object} filters - Column-value pairs for WHERE clause
 * @param {Object} options - { limit, offset, orderBy, order }
 * @returns {Promise<Array<Object>>}
 */
export async function findMany(table, filters = {}, options = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  for (const [column, value] of Object.entries(filters)) {
    if (value === null) {
      conditions.push(`${column} IS NULL`);
    } else if (Array.isArray(value)) {
      conditions.push(`${column} = ANY($${paramIndex})`);
      params.push(value);
      paramIndex++;
    } else {
      conditions.push(`${column} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  let sql = `SELECT * FROM ${table}`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  if (options.orderBy) {
    sql += ` ORDER BY ${options.orderBy} ${options.order || 'ASC'}`;
  }
  if (options.limit) {
    sql += ` LIMIT ${parseInt(options.limit)}`;
  }
  if (options.offset) {
    sql += ` OFFSET ${parseInt(options.offset)}`;
  }

  const result = await dbQuery(sql, params);
  return result.rows;
}

/**
 * Insert a row and return it.
 * @param {string} table - Table name
 * @param {Object} data - Column-value pairs
 * @returns {Promise<Object>} Inserted row
 */
export async function insertOne(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  const result = await dbQuery(sql, values);
  return result.rows[0];
}

/**
 * Update rows matching a condition.
 * @param {string} table - Table name
 * @param {Object} data - Column-value pairs to update
 * @param {string} whereColumn - WHERE column
 * @param {*} whereValue - WHERE value
 * @returns {Promise<Object>} Updated row
 */
export async function updateOne(table, data, whereColumn, whereValue) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereColumn} = $${columns.length + 1} RETURNING *`;
  const result = await dbQuery(sql, [...values, whereValue]);
  return result.rows[0];
}

/**
 * Execute a raw query with array containment check (for TEXT[] columns).
 * @param {string} table
 * @param {string} arrayColumn - TEXT[] column name
 * @param {string} value - Value to check containment for
 * @returns {Promise<Array<Object>>}
 */
export async function findByArrayContains(table, arrayColumn, value) {
  const sql = `SELECT * FROM ${table} WHERE $1 = ANY(${arrayColumn})`;
  const result = await dbQuery(sql, [value]);
  return result.rows;
}

/**
 * Execute a raw query with array overlap check.
 * @param {string} table
 * @param {string} arrayColumn
 * @param {Array<string>} values
 * @returns {Promise<Array<Object>>}
 */
export async function findByArrayOverlap(table, arrayColumn, values) {
  const sql = `SELECT * FROM ${table} WHERE ${arrayColumn} && $1`;
  const result = await dbQuery(sql, [values]);
  return result.rows;
}

export default { query, findOne, findMany, insertOne, updateOne, findByArrayContains, findByArrayOverlap };
