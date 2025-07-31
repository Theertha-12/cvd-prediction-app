import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';

const RiskForm = ({ onSubmit, initialData, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Initialize form with initialData when it changes
  useEffect(() => {
    reset(initialData || {});
  }, [initialData, reset]);

  const submitForm = async (data) => {
    console.log('🔍 Raw form data from react-hook-form:', data);
    
    // Convert string values to numbers for numeric fields
    const processedData = {
      sex: parseInt(data.sex), // Convert to number
      age: parseInt(data.age),
      cigsPerDay: parseInt(data.cigsPerDay),
      totChol: parseFloat(data.totChol),
      sysBP: parseFloat(data.sysBP),
      diaBP: parseFloat(data.diaBP),
      glucose: parseFloat(data.glucose)
    };
    
    console.log('🔍 Processed form data being sent to parent:', processedData);
    
    // Just pass the data to parent - don't make API call here
    onSubmit(processedData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cardiovascular Risk Assessment</h2>
      <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="0"
                  {...register('sex', { required: 'Sex is required' })}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">Female</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="1"
                  {...register('sex', { required: 'Sex is required' })}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">Male</span>
              </label>
            </div>
            {errors.sex && <p className="mt-1 text-sm text-red-500">{errors.sex.message}</p>}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              id="age"
              type="number"
              {...register('age', {
                required: 'Age is required',
                min: { value: 18, message: 'Minimum age is 18' },
                max: { value: 120, message: 'Maximum age is 120' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="Years"
            />
            {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
          </div>

          <div>
            <label htmlFor="cigsPerDay" className="block text-sm font-medium text-gray-700 mb-1">
              Cigarettes per Day
            </label>
            <input
              id="cigsPerDay"
              type="number"
              {...register('cigsPerDay', {
                required: 'This field is required',
                min: { value: 0, message: 'Must be 0 or more' },
                max: { value: 100, message: 'Maximum is 100' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="Number of cigarettes"
            />
            {errors.cigsPerDay && <p className="mt-1 text-sm text-red-500">{errors.cigsPerDay.message}</p>}
          </div>

          <div>
            <label htmlFor="totChol" className="block text-sm font-medium text-gray-700 mb-1">
              Total Cholesterol
            </label>
            <input
              id="totChol"
              type="number"
              step="0.1"
              {...register('totChol', {
                required: 'Cholesterol level is required',
                min: { value: 100, message: 'Minimum is 100 mg/dL' },
                max: { value: 600, message: 'Maximum is 600 mg/dL' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="mg/dL"
            />
            {errors.totChol && <p className="mt-1 text-sm text-red-500">{errors.totChol.message}</p>}
          </div>

          <div>
            <label htmlFor="sysBP" className="block text-sm font-medium text-gray-700 mb-1">
              Systolic BP
            </label>
            <input
              id="sysBP"
              type="number"
              step="0.1"
              {...register('sysBP', {
                required: 'Systolic BP is required',
                min: { value: 80, message: 'Minimum is 80 mmHg' },
                max: { value: 300, message: 'Maximum is 300 mmHg' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="mmHg"
            />
            {errors.sysBP && <p className="mt-1 text-sm text-red-500">{errors.sysBP.message}</p>}
          </div>

          <div>
            <label htmlFor="diaBP" className="block text-sm font-medium text-gray-700 mb-1">
              Diastolic BP
            </label>
            <input
              id="diaBP"
              type="number"
              step="0.1"
              {...register('diaBP', {
                required: 'Diastolic BP is required',
                min: { value: 40, message: 'Minimum is 40 mmHg' },
                max: { value: 200, message: 'Maximum is 200 mmHg' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="mmHg"
            />
            {errors.diaBP && <p className="mt-1 text-sm text-red-500">{errors.diaBP.message}</p>}
          </div>

          <div>
            <label htmlFor="glucose" className="block text-sm font-medium text-gray-700 mb-1">
              Glucose Level
            </label>
            <input
              id="glucose"
              type="number"
              step="0.1"
              {...register('glucose', {
                required: 'Glucose level is required',
                min: { value: 50, message: 'Minimum is 50 mg/dL' },
                max: { value: 500, message: 'Maximum is 500 mg/dL' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="mg/dL"
            />
            {errors.glucose && <p className="mt-1 text-sm text-red-500">{errors.glucose.message}</p>}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => reset()}
            className="mr-4 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-70"
          >
            {isSubmitting ? 'Calculating...' : 'Calculate Risk'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default RiskForm;