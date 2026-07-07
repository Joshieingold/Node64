export default function FileNameField({ data }) {
    const handleChange = (e) => {
        data.fileName = e.target.value;
        data.notify();
    };
    return (
        <input
            type="text"
            value={data.fileName ?? ""}
            onChange={handleChange}
        />
    );
}
