import Field from "./Field";

export default function TextField({
    label,
    id,
    value,
    onChange,
    type = "text",
}) {
    return (
        <Field label={label} id={id}>
            <input
                type={type}
                id={id}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                {...(type === "number" ? { min: 1 } : {})}
            />
        </Field>
    );
}
