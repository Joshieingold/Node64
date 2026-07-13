import "./ExplorerButton.css";
export default function ExplorerButton({ content, clickFunction }) {
    return (
        <div className="explorer-button" onClick={clickFunction}>
            {content}
        </div>
    );
}
