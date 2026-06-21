"use client";

type StepperProps = {
  stepIndex: number;
  className?: string;
};

const Stepper = ({ stepIndex, className }: StepperProps) => {
  const steps = ["w-1/3", "w-2/3", "w-full"];
  const completedSteps = ["w-0", "w-1/3", "w-2/3"];
  const step = steps[stepIndex];
  const completedStep = completedSteps[stepIndex];
  return (
    <div className={`w-full h-1 ${className}`}>
      <div
        className={`${completedStep} h-full bg-blue-800 absolute top-0`}
      ></div>
      <div className={`${step} h-full bg-blue-950`}></div>
    </div>
  );
};

export default Stepper;
