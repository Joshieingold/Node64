import { NavBar } from "../Navbar/NavBar";
import Compass from "/Compass.png";
import ShellPanel from "../ShellPanel/ShellPanel";
import "./Shell.css";
import TabBar from "../TabBar/TabBar";
import { useState } from "react";
import { Tab } from "../Modals";
import TabContent from "../TabContent/TabContent";
export default function NewShell() {
    // TAB MANAGEMENT //
    const [activeTab, setActiveTab] = useState(null);
    let [tabs, setTabs] = useState([]);
    const createBlankTab = (type) => {
        let newTab = new Tab();
        newTab.createDefault(type);
        setActiveTab(newTab);
        setTabs((prev) => [...prev, newTab]);
    };
    const killTab = (tabRef) => {
        setTabs((prev) => {
            const remaining = prev.filter((tab) => tab !== tabRef);
            if (activeTab === tabRef) {
                if (remaining.length > 0) {
                    setActiveTab(remaining[remaining.length - 1]);
                } else {
                    setActiveTab(null);
                }
            } else {
                if (remaining.length > 0) {
                    setActiveTab(remaining[0]);
                } else {
                    setActiveTab(null);
                }
            }
            return remaining;
        });
    };

    // DEFAULT CONSTRUCTIONS //
    const navItems = [
        {
            id: 1,
            label: "Analysis",
            clickFunc: () => createBlankTab("Analysis"),
        },
        {
            id: 2,
            label: "Repertoires",
            clickFunc: () => createBlankTab("Repertoire"),
        },
    ];
    const panelItems = [
        {
            id: 1,
            logo: Compass,
        },
    ];
    return (
        <div className="shell">
            <NavBar navItems={navItems} />
            <div className="shell-content">
                <ShellPanel panelItems={panelItems} />
                <div className="tab-data-wrapper">
                    <TabBar
                        tabArray={tabs}
                        setRef={setActiveTab}
                        activeRef={activeTab}
                        killRef={killTab}
                    />
                    <TabContent activeTabRef={activeTab} />
                </div>
            </div>
        </div>
    );
}
