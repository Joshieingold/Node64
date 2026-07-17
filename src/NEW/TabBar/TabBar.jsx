import "./TabBar.css";
export default function TabBar({ tabArray, setRef, activeRef, killRef }) {
    return (
        <div className="tab-bar">
            {tabArray.map((tabRef) => (
                <div
                    key={tabRef.id}
                    className={`tab ${activeRef.id === tabRef.id ? "active-tab" : ""}`}
                    onClick={() => setRef(tabRef)}
                >
                    <div className="tab-title">{tabRef.title}</div>
                    <div
                        onClick={() => killRef(tabRef)}
                        className="close-button"
                    >
                        ×
                    </div>
                </div>
            ))}
        </div>
    );
}
