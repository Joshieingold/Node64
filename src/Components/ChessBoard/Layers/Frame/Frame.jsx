import "./Frame.css";
export default function Frame({ isFlipped, children, ref, width = 45 }) {
    const FILES = "ABCDEFGH";
    const RANKS = "87654321";
    return (
        <div className="frame" style={{ width: `${width}rem` }} ref={ref}>
            <div className="spacer-file" />
            <div className="inside-frame">
                <div
                    className={`spacer-rank rank-wrap ${isFlipped ? "flip-rank" : ""}`}
                >
                    {RANKS.split("").map((char, index) => (
                        <div key={index} className="engraving">
                            {char}
                        </div>
                    ))}
                </div>
                <div className="content-container">{children}</div>
                <div className="spacer-rank" />
            </div>
            <div
                className={`spacer-file file-wrap ${isFlipped ? "flip-file" : ""}`}
            >
                {FILES.split("").map((char, index) => (
                    <div key={index} className="engraving">
                        {char}
                    </div>
                ))}
            </div>
        </div>
    );
}
