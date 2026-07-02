import "./Explorer.css";
export default function Explorer() {
    return (
        <div className="explorer">
            <h3 className="extension-title">Explorer</h3>
            <div className="explorer-content">
                <div className="explorer-folder">{">"} Repertoires</div>
                <div className="explorer-folder">{">"} Studies</div>
                <div className="explorer-folder">{">"} Analysis</div>
                <div className="explorer-folder">{">"} Databases</div>
            </div>
        </div>
    );
}
