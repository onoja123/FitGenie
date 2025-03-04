import Joi from 'joi';

export default class ProfileValidator {


  static validateId(id: any): Joi.ValidationResult{
    const schema = Joi.object().keys({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    })
    return schema.validate(id);
  }
  
  static updateProfile(data: any): Joi.ValidationResult {
    const schema = Joi.object().keys({
      fullname: Joi.string().required()
    });
    return schema.validate(data);
  }

  static updateProfileImage(data: any): Joi.ValidationResult {
    const schema = Joi.object().keys({
      image: Joi.string().optional(),
    });
    return schema.validate(data);
  }
  
}