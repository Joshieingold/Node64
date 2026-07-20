import "./TabPanel.css";
import { useState } from "react";

export default function TabPanel({ tabs, extraControls, actions, defaultTab }) {
    const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key);

    return (
        <div className="tab-panel">
            <div className="tab-panel-controls">
                {extraControls}
                {tabs.map((tab) => (
                    <div
                        key={tab.key}
                        className={`panel-option ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </div>
                ))}
                {actions?.map((action) => (
                    <div
                        key={action.key}
                        className="panel-option"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </div>
                ))}
            </div>
            <div className="tab-panel-content">
                {tabs.map((tab) => (
                    <div
                        key={tab.key}
                        className={`panel-view ${activeTab === tab.key ? "" : "hidden"}`}
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
