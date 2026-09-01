import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({ className, ...props }: SliderPrimitive.Root.Props<readonly number[]>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("flex w-full touch-none items-center py-2 select-none", className)}
      {...props}
    >
      <SliderPrimitive.Control data-slot="slider-control" className="flex w-full items-center">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full rounded-full bg-muted"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="absolute h-full rounded-full bg-primary"
          />
          <SliderPrimitive.Thumb
            index={0}
            aria-label="Minimum value"
            data-slot="slider-thumb"
            className="flex h-5 w-4 items-center justify-center rounded-md border border-primary bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <span aria-hidden="true" className="flex h-2.5 items-stretch gap-px">
              <span className="w-px rounded-full bg-primary" />
              <span className="w-px rounded-full bg-primary" />
              <span className="w-px rounded-full bg-primary" />
            </span>
          </SliderPrimitive.Thumb>
          <SliderPrimitive.Thumb
            index={1}
            aria-label="Maximum value"
            data-slot="slider-thumb"
            className="flex h-5 w-4 items-center justify-center rounded-md border border-primary bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <span aria-hidden="true" className="flex h-2.5 items-stretch gap-px">
              <span className="w-px rounded-full bg-primary" />
              <span className="w-px rounded-full bg-primary" />
              <span className="w-px rounded-full bg-primary" />
            </span>
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
