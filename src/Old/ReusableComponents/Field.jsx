export default function Field({ label, id, children }) {
    return (
        <div className="input-block top-down-block">
            <label htmlFor={id}>{label}</label>
            {children}
        </div>
    );
}
