const pg = require("pg");
const uuid = require("uuid");
const bcrypt = require("bcrypt");

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://postgres:@localhost/the_acme_store"
);

const createTables = async () => {
  let SQL = `
    
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS products CASCADE;
            DROP TABLE IF EXISTS favorites CASCADE;
    
            CREATE TABLE IF NOT EXISTS users(
                id UUID PRIMARY KEY,
                username VARCHAR(64) NOT NULL UNIQUE,
                password VARCHAR(128) NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS products(
                id UUID PRIMARY KEY,
                name VARCHAR(64) NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS favorites(
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) NOT NULL,
                product_id UUID REFERENCES products(id) NOT NULL,
                CONSTRAINT unique_user_id_product_id UNIQUE (user_id, product_id)
            );
        `;

  await client.query(SQL);
};

const createUser = async ({ username, password }) => {
  const hashPassword = await bcrypt.hash(password, 5);

  const SQL = `
          INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
        `;
  const response = await client.query(SQL, [uuid.v4(), username, hashPassword]);
  return response.rows[0];
};

const createProduct = async ({ name }) => {
  const SQL = `
          INSERT INTO products(id, name) VALUES($1, $2) RETURNING *
        `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

const createUserProduct = async ({ user_id, product_id }) => {
  const SQL = `
          INSERT INTO favorites(id, user_id, product_id) 
          VALUES($1, $2, $3) 
          RETURNING *
        `;
  const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `
      SELECT *
      FROM users
        `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async () => {
  const SQL = `
      SELECT *
      FROM products
        `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchUserProducts = async ({ id }) => {
  const SQL = `
         SELECT users.username as user_name, 
           products.name as product_name,
           favorites.id as user_product_id,
           favorites.user_id as user_id,
           favorites.product_id as product_id
         FROM favorites
         INNER JOIN 
           users on users.id = favorites.user_id
         INNER JOIN
           products on products.id = favorites.product_id   
         WHERE 
           favorites.user_id = $1;`;

  const response = await client.query(SQL, [id]);

  return response.rows;
};

const destroyUserProduct = async ({ user_product_id, user_id }) => {
  const SQL = `
            DELETE FROM favorites
            WHERE id = $1 AND user_id=$2
        `;
  await client.query(SQL, [user_product_id, user_id]);
};

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  createUserProduct,
  fetchUsers,
  fetchProducts,
  fetchUserProducts,
  destroyUserProduct,
};
