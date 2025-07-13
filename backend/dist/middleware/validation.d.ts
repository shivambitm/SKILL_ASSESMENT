import { Request, Response, NextFunction } from "express";
import Joi from "joi";
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authSchemas: {
    register: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
};
export declare const skillSchemas: {
    create: Joi.ObjectSchema<any>;
    update: Joi.ObjectSchema<any>;
};
export declare const questionSchemas: {
    create: Joi.ObjectSchema<any>;
    update: Joi.ObjectSchema<any>;
};
export declare const quizSchemas: {
    submitAnswer: Joi.ObjectSchema<any>;
    completeQuiz: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=validation.d.ts.map