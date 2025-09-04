import Joi from 'joi';

const email = Joi.string().email().required();
const password = Joi.string().min(6).required();

export const SigninSchema = Joi.object({
  email,
  password,
}).required();
