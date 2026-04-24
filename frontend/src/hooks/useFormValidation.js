import { useState, useCallback } from 'react';

const validators = {
  required: (value) => (!value || (typeof value === 'string' && !value.trim())) ? 'This field is required' : null,
  email: (value) => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email address' : null,
  minLength: (min) => (value) => value && value.length < min ? `Must be at least ${min} characters` : null,
  maxLength: (max) => (value) => value && value.length > max ? `Must be at most ${max} characters` : null,
  number: (value) => value && isNaN(Number(value)) ? 'Must be a number' : null,
  positive: (value) => value && Number(value) <= 0 ? 'Must be a positive number' : null,
  password: (value) => {
    if (!value) return null;
    if (value.length < 8) return 'Must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
    if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
    if (!/[0-9]/.test(value)) return 'Must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Must contain a special character';
    return null;
  },
  match: (fieldName, fieldLabel) => (value, formData) =>
    value !== formData[fieldName] ? `Must match ${fieldLabel}` : null,
};

function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;
    for (const rule of rules) {
      const error = typeof rule === 'function' ? rule(value, values) : null;
      if (error) return error;
    }
    return null;
  }, [validationRules, values]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, [validateField]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    const allTouched = {};
    for (const name in validationRules) {
      allTouched[name] = true;
      const error = validateField(name, values[name]);
      if (error) { newErrors[name] = error; isValid = false; }
    }
    setErrors(newErrors);
    setTouched(allTouched);
    return isValid;
  }, [validationRules, values, validateField]);

  const reset = useCallback((newValues) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  return { values, errors, touched, handleChange, handleBlur, validateAll, reset, setFieldValue, setValues };
}

export { validators };
export default useFormValidation;
