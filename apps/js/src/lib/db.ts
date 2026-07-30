import { Pool } from "pg";

// pg reads PG* from the environment
export const pool: Pool = new Pool();
