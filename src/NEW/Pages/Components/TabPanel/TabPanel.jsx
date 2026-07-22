import "./TabPanel.css";
import StockfishDock from "./Components/StockfishDock/StockfishDock";
import NotationPanel from "./Components/NotationPanel/NotationPanel";
import PgnDetails from "./Components/PgnDetails/PgnDetails";
import SaveButton from "./Components/SaveButton/SaveButton";
import { openCpuPanel } from "./Components/CpuAnalysis/openCpuPanel";
import { useState } from "react";
import OpeningExplorer from "./Components/OpeningExplorer/OpeningExplorer";

export default function TabPanel({ activeTabRef }) {
    const [hidden, setHidden] = useState(true);
    const [activeLabel, setActiveLabel] = useState("🗈");

    const panelContent = [
        {
            label: "🗈",
            type: "panelContent",
            component: <NotationPanel tabDoc={activeTabRef} />,
        },
        {
            label: "🛈",
            type: "panelContent",
            component: <PgnDetails tabDocument={activeTabRef} />,
        },
        { label: "🖫", type: "button", component: <SaveButton /> },
        {
            label: "🖳",
            type: "tab",
            func: () => openCpuPanel(activeTabRef.chessData),
        },
    ];

    const handleClick = (item) => {
        if (item.type === "button" && item.func) {
            item.func();
        } else if (item.type === "tab" && item.func) {
            item.func();
            setActiveLabel(item.label);
        } else {
            setActiveLabel(item.label);
        }
    };

    return (
        <div className="tab-panel">
            <StockfishDock activeTabRef={activeTabRef} />
            <div className="panel-button-wrapper">
                {panelContent.map((item) => (
                    <div
                        key={item.label}
                        className={`panel-button ${activeLabel == item.label ? "active-button" : ""}`}
                        onClick={() => handleClick(item)}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
            <div className="panel-main-content">
                <PanelMainContent
                    data={panelContent}
                    activeLabel={activeLabel}
                />
            </div>
            <div className={`panel-popover-content ${hidden ? "hidden" : ""}`}>
                <OpeningExplorer tabData={activeTabRef} />
            </div>
            <div className="panel-popover-button-wrapper">
                <div
                    className="pop-over-button"
                    onClick={() => setHidden((prev) => !prev)}
                >
                    🕮
                </div>
            </div>
        </div>
    );
}

function PanelMainContent({ data, activeLabel }) {
    const active = data.find(
        (item) => item.label === activeLabel && item.type === "panelContent",
    );
    return active ? active.component : null;
}
