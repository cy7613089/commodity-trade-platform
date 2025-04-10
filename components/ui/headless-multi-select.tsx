"use client"

import { Fragment, useState, useEffect } from 'react'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { Combobox, Transition } from '@headlessui/react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface Option {
  value: string;
  label: string;
}

interface HeadlessMultiSelectProps {
  options: Option[];
  value: string[]; // Array of selected values
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function HeadlessMultiSelect({
  options,
  value: selectedValues, // Rename prop for clarity internally
  onChange,
  placeholder = "选择选项...",
  className,
  disabled = false,
}: HeadlessMultiSelectProps) {
  const [query, setQuery] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([])

  // Sync selectedOptions with the value prop from the form
  useEffect(() => {
    const newSelectedOptions = selectedValues
      .map(val => options.find(opt => opt.value === val))
      .filter((opt): opt is Option => !!opt); // Type guard to filter out undefined
    setSelectedOptions(newSelectedOptions);
  }, [selectedValues, options]);

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.label
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        )

  const handleSelect = (newlySelectedOptions: Option[]) => {
    // Extract values and call the onChange prop provided by react-hook-form
    onChange(newlySelectedOptions.map(opt => opt.value));
    // Internal state update is handled by useEffect based on the prop change
  }

  const handleRemove = (optionToRemove: Option) => {
    const newSelectedOptions = selectedOptions.filter(opt => opt.value !== optionToRemove.value);
    handleSelect(newSelectedOptions);
  }

  return (
    <Combobox value={selectedOptions} onChange={handleSelect} multiple disabled={disabled} name="headless-multiselect">
      <div className={cn("relative", className)}>
        {/* Combobox Input, Button, and Selected Badges Container */}
        <div className={cn(
          "relative w-full min-h-10 h-auto flex items-center flex-wrap gap-1 p-2 pr-10", // Added flex, flex-wrap, gap, padding
          "cursor-default overflow-hidden rounded-md border border-input bg-background text-left shadow-sm", 
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm",
          disabled ? "cursor-not-allowed opacity-50" : ""
        )}>
          {/* Display selected items as badges */}
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="flex items-center whitespace-nowrap"
            >
              {option.label}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 flex-shrink-0 rounded-full outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening the combobox
                    handleRemove(option);
                  }}
                  aria-label={`Remove ${option.label}`}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          
          {/* Combobox Input - takes remaining space */}
          <Combobox.Input
            className={cn(
              "flex-grow border-none text-sm leading-5 text-foreground focus:ring-0 bg-transparent outline-none p-0", // Use flex-grow, remove padding/border
              "placeholder:text-muted-foreground"
            )}
            placeholder={selectedOptions.length === 0 ? placeholder : ''}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            value={query}
            disabled={disabled}
          />
          
          {/* Combobox Button remains absolutely positioned */}
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        
        {/* Options List */}
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                无匹配选项。
              </div>
            ) : (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  className={({ active }: { active: boolean }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${ 
                      active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                    }`
                  }
                  value={option} // Pass the whole option object
                >
                  {({ selected, active }: { selected: boolean, active: boolean }) => ( // Type selected and active
                    <>
                      <span
                        className={`block truncate ${ 
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${ 
                            active ? 'text-accent-foreground' : 'text-primary'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  )
} 