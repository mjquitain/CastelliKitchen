import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

const mockBucket = {
    name: "test-bucket",
    file: () => ({
        save: async () => { },
        makePublic: async () => { },
        name: "mock-file",
        createWriteStream: () => ({
            on: () => { },
            end: () => { },
        }),
    }),
    getFiles: async () => [[]],
};

jest.unstable_mockModule("../../src/config/firebase.js", () => ({
    bucket: mockBucket,
}));

const { default: app } = await import("../../src/app.js");

describe("Integration: mealdb proxy routes", () => {
    /** @type {any} */
    let fetchMock;

    beforeEach(() => {
        fetchMock = jest.fn();
        global.fetch = /** @type {any} */ (fetchMock);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("filters meals by ingredient", async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ meals: [{ idMeal: "1", strMeal: "Chicken Soup" }] }),
        });

        const response = await request(app).get("/api/v1/mealdb/filter").query({ ingredient: "chicken" });

        expect(response.status).toBe(200);
        expect(response.body.meals).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("searches meals by name", async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ meals: [{ idMeal: "2", strMeal: "Adobo" }] }),
        });

        const response = await request(app).get("/api/v1/mealdb/search").query({ s: "adobo" });

        expect(response.status).toBe(200);
        expect(response.body.meals[0].strMeal).toBe("Adobo");
    });

    it("looks up meal by id", async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ meals: [{ idMeal: "52772", strMeal: "Teriyaki Chicken" }] }),
        });

        const response = await request(app).get("/api/v1/mealdb/lookup/52772");

        expect(response.status).toBe(200);
        expect(response.body.meals[0].idMeal).toBe("52772");
    });

    it("returns 500 when mealdb fetch fails", async () => {
        fetchMock.mockRejectedValueOnce(new Error("Network error"));

        const response = await request(app).get("/api/v1/mealdb/search").query({ s: "chicken" });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Failed to search meals");
    });
});