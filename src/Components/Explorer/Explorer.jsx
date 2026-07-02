import "./Explorer.css";
export default function Explorer() {
    return (
        <div className="explorer">
            <div className="panel-title">Explorer</div>
            <div className="panel-items">
                <div className="explorer-folder">
                    <div>{"> "}Analysis</div>
                </div>
                <div className="explorer-folder">
                    <div>{"> "}Repertoires</div>
                </div>
                <div className="explorer-folder">
                    <div>{"> "}Databases</div>
                </div>
            </div>
        </div>
    );
}
