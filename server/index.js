const {
  client,
  createTables,
  createUser,
  createProduct,
  createUserProduct,
  fetchUsers,
  fetchProducts,
  fetchUserProducts,
  destroyUserProduct,
} = require("./db");

const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`I am listening on port number ${PORT}`);
});

const init = async () => {
  await client.connect();
  console.log("connected to database");

  const response = await createTables();
  console.log("Created Tables");

  const [Max, Gryphon, Kalu, Hero, CT, Bn, OC, Br] = await Promise.all([
    createUser({ username: "Max", password: "oldDog" }),
    createUser({ username: "Gryphon", password: "youngDog" }),
    createUser({ username: "Kalu", password: "goodDog" }),
    createUser({ username: "Hero", password: "fastDog" }),

    createProduct({ name: "chew toy" }),
    createProduct({ name: "Bone" }),
    createProduct({ name: "Obstacle Course" }),
    createProduct({ name: "Brush" }),
  ]);

  console.log(await fetchUsers());
  console.log(await fetchProducts());

  const [
    products1,
    products2,
    products3,
    products4,
    products5,
    products6,
    products7,
  ] = await Promise.all([
    createUserProduct({
      user_id: Max.id,
      product_id: CT.id,
    }),
    createUserProduct({
      user_id: Gryphon.id,
      product_id: Bn.id,
    }),
    createUserProduct({
      user_id: Gryphon.id,
      product_id: OC.id,
    }),
    createUserProduct({
      user_id: Gryphon.id,
      product_id: Br.id,
    }),
    createUserProduct({
      user_id: Kalu.id,
      product_id: Br.id,
    }),
    createUserProduct({
      user_id: Kalu.id,
      product_id: OC.id,
    }),
    createUserProduct({
      user_id: Kalu.id,
      product_id: Bn.id,
    }),
  ]);

  console.log("Sending just named parameter");
  console.log(await fetchUserProducts({ id: Max.id }));
  console.log("Testing sending Max");
  console.log(await fetchUserProducts(Max));

  console.log(await fetchUserProducts({ id: Gryphon.id }));
  console.log(await fetchUserProducts({ id: Kalu.id }));

  await destroyUserProduct({
    user_product_id: products7.id,
    user_id: products7.user_id,
  });
};

init();

// Express API

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/userproducts", async (req, res, next) => {
  try {
    res.send(await fetchUserProducts({ id: req.params.id }));
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/users/:user_id/userproducts/:id", async (req, res, next) => {
  try {
    res.status(201).send(
      await createUserProduct({
        user_id: req.params.user_id,
        product_id: req.params.id,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/users/:user_id/userProducts/:id", async (req, res, next) => {
  try {
    await destroyUserProduct({
      user_id: req.params.user_id,
      user_product_id: req.params.id,
    });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message || err });
});
