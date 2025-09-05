import Joi from 'joi';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const email = Joi.string().email().required();
const password = Joi.string().min(6).required();
const name = Joi.string().min(2).max(120);

const phone = Joi.string()
  .custom((value, helpers) => {
    // Ensure value is a string
    if (typeof value !== 'string') {
      return helpers.error('string.base');
    }

    // Enforce leading + (international format)
    if (!value.startsWith('+')) {
      return helpers.error('any.invalid');
    }

    // parsePhoneNumberFromString requires the number to include the country code
    const phoneNumber = parsePhoneNumberFromString(value);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return helpers.error('any.invalid');
    }

    return value;
  }, 'Phone number validation')
  .messages({
    'string.base': 'Phone number must be a string',
    'any.invalid':
      'Phone number must be a valid international number in E.164 format (e.g. +14155552671)',
  });

export const SigninSchema = Joi.object({
  email,
  password,
}).required();

export const SignupSchema = Joi.object({
  firstname: name.required(),
  lastname: name.required(),
  email,
  password,
  phone: phone.required(),
}).required();

export const OauthValidator = Joi.object({
  code: Joi.string().required().messages({
    'string.empty': 'Authorization code is required',
  }),
}).required();
