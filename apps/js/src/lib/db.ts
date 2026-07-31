import { Pool, types } from "pg";

// pg hands BIGINT and NUMERIC back as strings to protect precision it cannot represent;
// every id, rupiah and rating here sits well inside 2^53, and Go sends them as numbers
types.setTypeParser(types.builtins.INT8, Number);
types.setTypeParser(types.builtins.NUMERIC, Number);

// pg reads PG* from the environment
export const pool: Pool = new Pool();
