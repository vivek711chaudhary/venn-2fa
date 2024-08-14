import request from "supertest";
import { app, server } from "../src/app";

describe("App", () => {
    afterAll(async () => {
        await server.close();
    });

    describe("GET /version", () => {
        it("should basic version information", async () => {
            // Arrange
            //
            const { name, version } = require("../package.json");

            // Act
            //
            const response = await request(app).get("/version");

            // Assert
            //
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ name, version });
        });
    });

    describe("/detect/:detectorName", () => {
        it("validates the incoming request", async () => {
            // Arrange
            //
            const badRequest = {};

            // Act
            //
            const response = await request(app)
                .post("/detect/hello-detector")
                .send(badRequest);

            // Assert
            //
            expect(response.status).toBe(200);
        });
    });
});
