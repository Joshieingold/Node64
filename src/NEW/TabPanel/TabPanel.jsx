import "./TabPanel.css";
import StockFishDock from "../TabPanelComponents/StockfishDock/StockfishDock";
import NotationPanel from "../TabPanelComponents/NotationPanel/NotationPanel";
import PgnDetails from "../TabPanelComponents/PgnDetails/PgnDetails";
import SaveButton from "../TabPanelComponents/SaveButton/SaveButton";
import { openCpuPanel } from "../TabPanelComponents/CpuAnalysis/openCpuPanel";
import { useState } from "react";

export default function TabPanel({ activeTabRef }) {
    const [hidden, setHidden] = useState(true);
    const [activeLabel, setActiveLabel] = useState("Notation");

    const panelContent = [
        {
            label: "🗈",
            type: "panelContent",
            component: <NotationPanel tabDoc={activeTabRef} />,
        },
        {
            label: "🛈",
            type: "panelContent",
            component: <PgnDetails />,
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
            <StockFishDock activeTabRef={activeTabRef} />
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
            <div
                className={`panel-popover-content ${hidden ? "hidden" : ""}`}
            ></div>
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
