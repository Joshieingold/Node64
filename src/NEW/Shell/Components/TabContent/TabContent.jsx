import "./TabContent.css";
export default function TabContent({ activeTabRef }) {
    return (
        <div
            className={`tab-content ${activeTabRef == null || activeTabRef == undefined ? "full-hidden" : ""}`}
        >
            <h1>{activeTabRef?.id}</h1>
        </div>
    );
}
