"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
beforeAll(async () => {
    // Setup test database or use existing connection
});
afterAll(async () => {
    // Clean up database connection
    if (database_1.pool) {
        await database_1.pool.end();
    }
});
//# sourceMappingURL=setup.js.map