import "./SFToggle.css";
import { useState } from "react";

export default function SFToggle({ data }) {
    const [doAnalysis, setDoAnalysis] = useState(true);
    return (
        <div className="sf-toggle">
            <div className="toggler"></div>
            <div className="evaluation">0</div>
        </div>
    );
}
