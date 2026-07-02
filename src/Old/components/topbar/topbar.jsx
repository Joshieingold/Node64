import "./topbar.css";
export default function TopBar() {
    return (
        <div className="topbar">
            <h3>Node64</h3>
            <div className="action-container">
                <div className="action">Repertoire</div>
                <div className="action">Analysis</div>
                <div className="action">Train</div>
            </div>
        </div>
    );
}
