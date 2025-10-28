import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const validationError = createError(`Validation Error: ${errorMessage}`, 400);
      next(validationError);
      return;
    }
    
    next();
  };
};

// Validation schemas
export const authSchemas = {
  signup: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

export const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional()
  })
};

export const budgetSchemas = {
  createMonthlyGoal: Joi.object({
    month: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
      'string.pattern.base': 'Month must be in YYYY-MM format',
      'any.required': 'Month is required'
    }),
    income: Joi.number().positive().required().messages({
      'number.positive': 'Income must be a positive number',
      'any.required': 'Income is required'
    }),
    expenses: Joi.array().items(
      Joi.object({
        category_id: Joi.string().required(),
        category_name: Joi.string().required(),
        expected_amount: Joi.number().min(0).required()
      })
    ).required()
  }),

  createTransaction: Joi.object({
    category_id: Joi.string().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().min(1).max(200).required(),
    date: Joi.date().iso().required()
  })
};
