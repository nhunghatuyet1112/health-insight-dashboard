import { useId } from "react";

/** Native radios preserve form submission, arrow-key navigation and edit defaults. */
export function RatingScale({
  name,
  label,
  defaultValue = 3,
  disabled = false,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="rating-scale" disabled={disabled}>
      <legend>{label}</legend>
      <div>
        {[1, 2, 3, 4, 5].map(value => (
          <label key={value} htmlFor={`${id}-${value}`}>
            <input id={`${id}-${value}`} type="radio" name={name} value={value}
              defaultChecked={defaultValue === value} required />
            <span>{value}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
