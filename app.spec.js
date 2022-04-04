const request = require("supertest");
const { app, wordCounts } = require("./app");

describe("Test the root path", () => {
  it("It should return 200 on GET", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Hello");
  });
});

describe("Test the api/justify path", () => {
  beforeEach(() => {
    for (const key of Object.keys(wordCounts)) {
      delete wordCounts[key];
    }
  });

  it("should respond a 401 without a token", async () => {
    const response = await request(app).post("/api/justify");
    expect(response.statusCode).toBe(401);
  });

  it("should respond a 401 with a malformed token", async () => {
    const response = await request(app)
      .post("/api/justify")
      .set("Authorization", "jfhjkdshfjk");
    expect(response.statusCode).toBe(401);
  });

  it("should respond a 401 with an unknown token", async () => {
    const response = await request(app)
      .post("/api/justify")
      .set("Authorization", "Bearer jfhjkdshfjk");
    expect(response.statusCode).toBe(401);
  });

  it("should respond a 402 if the user as exhaust its quota", async () => {
    const token = "zblouf";
    wordCounts[token] = 80000;

    const response = await request(app)
      .post("/api/justify")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/plain")
      .send("toto");
    expect(response.statusCode).toBe(402);
  });

  it("should respond a 200 with a valid token and input", async () => {
    const token = "zblouf";
    wordCounts[token] = 0;

    const response = await request(app)
      .post("/api/justify")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/plain")
      .send("toto");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("toto");
  });

  it("should justify at 80 characters", async () => {
    const token = "zblouf";
    wordCounts[token] = 0;
    const text =
      "Lounge in doorway. Chase little red dot someday it will be mine! milk the cow or make plans to dominate world and then take a nap get poop stuck in paws jumping out of litter box and run around the house scream meowing and smearing hot cat mud all over. Intently stare at the same spot i like cats because they are fat and fluffy cats are cute but pelt around the house and up and down stairs chasing phantoms kitty poochy for meow fish i must find my red catnip";

    const response = await request(app)
      .post("/api/justify")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/plain")
      .send(text);

    expect(response.text).toBe(
      "Lounge in doorway. Chase little red dot someday it will be mine! milk the cow or\n" +
        " make plans to dominate world and then take a nap get poop stuck in paws jumping\n" +
        " out of litter box and run around the house scream meowing and smearing hot cat \n" +
        "mud all over. Intently stare at the same spot i like cats because they are fat a\n" +
        "nd fluffy cats are cute but pelt around the house and up and down stairs chasing\n" +
        " phantoms kitty poochy for meow fish i must find my red catnip"
    );
  });
});
