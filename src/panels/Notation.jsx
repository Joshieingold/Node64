import "./Notation.css";
import { useState } from "react";
export default function Notation() {
    const [selectedNode, setSelectedNode] = useState("");
    return (
        <div className="notation">
            <div className="notation-line">
                <div className="move-number">1.</div>
                <div className="move">e4</div>
                <div className="move">e5</div>
            </div>
            <div className="notation-line">
                <div className="move-number">2.</div>
                <div className="move">Nf3</div>
                <div className="move">Nc6</div>
            </div>
            <div className="notation-line">
                <div className="move-number">3.</div>
                <div className="move">d4</div>
                <div className="move active">exd4</div>
            </div>
        </div>
    );
}
