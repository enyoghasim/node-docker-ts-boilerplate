import { UseBefore, BadRequestError } from 'routing-controllers';
import type { Request, Response, NextFunction } from 'express';
import { Schema, ValidationOptions } from 'joi';

type Source = 'body' | 'query' | 'params' | 'headers';

function makeJoiMiddleware(
  schema: Schema,
  from: Source,
  options?: ValidationOptions
) {
  const defaultOptions: ValidationOptions = {
    abortEarly: false,
    stripUnknown: true,
    convert: true, // coerce types when possible (e.g., "123" -> number)
  };

  return (req: Request, _res: Response, next: NextFunction) => {
    const toValidate = req[from];

    const { value, error } = schema.validate(toValidate, {
      ...defaultOptions,
      ...options,
    });

    if (error) {
      // 400 Bad Request with details
      return next(new BadRequestError(error.message));
    }

    // Replace with sanitized/stripped value
    (req as any)[from] = value;
    return next();
  };
}

export function JoiValidate(
  schema: Schema,
  from: Source = 'body',
  options?: ValidationOptions
): MethodDecorator {
  return UseBefore(makeJoiMiddleware(schema, from, options)) as MethodDecorator;
}

/** Convenience variants */
export const JoiBody = (schema: Schema, options?: ValidationOptions) =>
  JoiValidate(schema, 'body', options);

export const JoiQuery = (schema: Schema, options?: ValidationOptions) =>
  JoiValidate(schema, 'query', options);

export const JoiParams = (schema: Schema, options?: ValidationOptions) =>
  JoiValidate(schema, 'params', options);

export const JoiHeaders = (schema: Schema, options?: ValidationOptions) =>
  JoiValidate(schema, 'headers', options);
