"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Skill Assessment & Reporting Portal API",
            version: "1.0.0",
            description: "API documentation for Skill Assessment & Reporting Portal",
        },
        servers: [
            {
                url: "http://localhost:5002/api",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT token here. Click 'Authorize' and use: Bearer <your_token>. You can get a token by logging in via the /auth/login endpoint.",
                },
            },
        },
    },
    apis: ["./src/routes/*.ts"], // Adjust path if your routes are elsewhere
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
function setupSwagger(app) {
    app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
}
//# sourceMappingURL=swagger.js.map