import React from 'react';

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                    isCompleted ? 'bg-ease-green text-white' : isActive ? 'bg-ease-blue text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <p className={`mt-2 text-xs text-center font-semibold ${isActive ? 'text-ease-blue' : 'text-gray-500'}`}>{step}</p>
              </div>
              {stepNumber < steps.length && (
                <div className={`flex-1 h-1 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-ease-green' : 'bg-gray-200'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};