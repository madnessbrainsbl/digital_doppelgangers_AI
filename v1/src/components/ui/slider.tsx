import * as React from "react"
import { cn } from "../../lib/utils"

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value = [0], onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(event.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <div
        ref={ref}
        className={cn("relative w-full", className)}
        {...props}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(value[0] - min) / (max - min) * 100}%, #e5e7eb ${(value[0] - min) / (max - min) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider } 