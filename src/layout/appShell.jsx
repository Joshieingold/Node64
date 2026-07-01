import { useState, useRef, useEffect } from "react";

import Explorer from "../panels/Explorer";
import Board from "../panels/Board";
import Engine from "../panels/Engine";
import Notation from "../panels/Notation";

import "../styles/layout.css";
import "../styles/bars.css";
import "../styles/panels.css";

export default function AppShell() {
    const [leftWidth, setLeftWidth] = useState(240);
    const [rightWidth, setRightWidth] = useState(300);
    const [evalHeight, setEvalHeight] = useState(100);

    const drag = useRef(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const startLeft = useRef(0);
    const startRight = useRef(0);
    const startEval = useRef(0);

    // =========================
    // START DRAG
    // =========================

    const startDrag = (type, e) => {
        drag.current = type;
        startX.current = e.clientX;
        startY.current = e.clientY;

        startLeft.current = leftWidth;
        startRight.current = rightWidth;
        startEval.current = evalHeight;
    };

    // =========================
    // GLOBAL MOVE
    // =========================

    useEffect(() => {
        const onMove = (e) => {
            if (!drag.current) return;

            const dx = e.clientX - startX.current;
            const dy = e.clientY - startY.current;

            if (drag.current === "left") {
                setLeftWidth(
                    Math.max(160, Math.min(startLeft.current + dx, 500)),
                );
            }

            if (drag.current === "right") {
                setRightWidth(
                    Math.max(220, Math.min(startRight.current - dx, 500)),
                );
            }

            if (drag.current === "eval") {
                setEvalHeight(
                    Math.max(120, Math.min(startEval.current + dy, 600)),
                );
            }
        };

        const stop = () => {
            drag.current = null;
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", stop);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", stop);
        };
    }, []);

    return (
        <div className="shell">
            <div className="topbar">Node64</div>

            <div className="workspace">
                <div className="main">
                    {/* LEFT */}
                    <div className="left" style={{ width: leftWidth }}>
                        <Explorer />
                    </div>

                    <div
                        className="splitter vertical"
                        onMouseDown={(e) => startDrag("left", e)}
                    />

                    {/* CENTER */}
                    <div className="center">
                        <Board />
                    </div>

                    <div
                        className="splitter vertical"
                        onMouseDown={(e) => startDrag("right", e)}
                    />

                    {/* RIGHT */}
                    <div className="right" style={{ width: rightWidth }}>
                        <div className="eval" style={{ height: evalHeight }}>
                            <Engine />
                        </div>

                        <div
                            className="splitter horizontal"
                            onMouseDown={(e) => startDrag("eval", e)}
                        />

                        <div className="notation">
                            <Notation />
                        </div>
                    </div>
                </div>
            </div>

            <div className="status">Ready</div>
        </div>
    );
}
