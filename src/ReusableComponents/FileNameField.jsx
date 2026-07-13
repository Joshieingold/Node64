export default function FileNameField({ data }) {
    const handleChange = (e) => {
        data.fileData.fileName = e.target.value;
        data.notify();
    };
    return (
        <input
            type="text"
            value={data.fileData.fileName ?? ""}
            onChange={handleChange}
        />
    );
}
