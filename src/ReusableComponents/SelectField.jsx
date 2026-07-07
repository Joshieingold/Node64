import Field from "./Field";
export default function SelectField({ label, id, value, onChange, options }) {
    return (
        <Field label={label} id={id}>
            <select
                id={id}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" />
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </Field>
    );
}
