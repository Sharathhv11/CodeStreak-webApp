import request from "supertest";
import app from "./../server.js";

describe("Health API", () => {
  test("GET /health should return status ok", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
  });
});