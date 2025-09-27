/**
 * Lightweight request body validator (no external deps)
 * Usage:
 *   const schema = {
 *     deviceId: { type: 'string', min: 1, max: 200 },
 *     exportType: { type: 'enum', values: ['photo_book','calendar','poster','cards'] },
 *     memoryIds: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'string', min: 1, max: 200 } },
 *     settings: { type: 'object', optional: true }
 *   };
 *   router.post('/create', validateBody(schema), handler)
 */

function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function validateValue(key, spec, value, path) {
  const p = path ? `${path}.${key}` : key;
  if (value === undefined || value === null) {
    if (spec.optional) return null;
    return `${p} is required`;
  }
  switch (spec.type) {
    case 'string': {
      if (typeof value !== 'string') return `${p} must be a string`;
      if (spec.min && value.length < spec.min) return `${p} must be at least ${spec.min} chars`;
      if (spec.max && value.length > spec.max) return `${p} must be at most ${spec.max} chars`;
      if (spec.pattern && !(new RegExp(spec.pattern)).test(value)) return `${p} has invalid format`;
      return null;
    }
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) return `${p} must be a number`;
      if (spec.int && !Number.isInteger(value)) return `${p} must be an integer`;
      if (spec.min !== undefined && value < spec.min) return `${p} must be >= ${spec.min}`;
      if (spec.max !== undefined && value > spec.max) return `${p} must be <= ${spec.max}`;
      if (spec.oneOf && !spec.oneOf.includes(value)) return `${p} must be one of ${spec.oneOf.join(',')}`;
      return null;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') return `${p} must be a boolean`;
      return null;
    }
    case 'enum': {
      if (!spec.values || !Array.isArray(spec.values)) return `${p} schema invalid`;
      if (!spec.values.includes(value)) return `${p} must be one of ${spec.values.join(',')}`;
      return null;
    }
    case 'array': {
      if (!Array.isArray(value)) return `${p} must be an array`;
      if (spec.minItems && value.length < spec.minItems) return `${p} must have at least ${spec.minItems} items`;
      if (spec.maxItems && value.length > spec.maxItems) return `${p} must have at most ${spec.maxItems} items`;
      if (spec.items) {
        for (let i = 0; i < value.length; i++) {
          const err = validateValue(`[${i}]`, spec.items, value[i], p);
          if (err) return err;
        }
      }
      return null;
    }
    case 'object': {
      if (!isObject(value)) return `${p} must be an object`;
      if (spec.properties && isObject(spec.properties)) {
        for (const [k, v] of Object.entries(spec.properties)) {
          const err = validateValue(k, v, value[k], p);
          if (err) return err;
        }
      }
      return null;
    }
    default:
      return `${p} has unknown type`;
  }
}

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const errors = [];
      const body = req.body || {};
      for (const [key, spec] of Object.entries(schema || {})) {
        const err = validateValue(key, spec, body[key], '');
        if (err) errors.push(err);
      }
      if (errors.length) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid request body',
          code: 'VALIDATION_FAILED',
          details: errors
        });
      }
      req.validatedBody = body;
      return next();
    } catch (e) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Validation error',
        code: 'VALIDATION_EXCEPTION'
      });
    }
  };
}

export default validateBody;

