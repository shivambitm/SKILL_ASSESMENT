import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
// @ts-ignore
// If using TypeScript, install types: npm i --save-dev @types/swagger-ui-express @types/swagger-jsdoc
import { Express } from "express";

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
          description:
            "Enter your JWT token here. Click 'Authorize' and use: Bearer <your_token>. You can get a token by logging in via the /auth/login endpoint.",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // Adjust path if your routes are elsewhere
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
