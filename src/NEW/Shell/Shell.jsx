import { NavBar } from "./Components/Navbar/NavBar";
// PNGS
import Compass from "/Compass.png";
import DbLogo from "/Database.png";
// COMPONENETS
import ShellPanel from "./Components/ShellPanel/ShellPanel";
import "./Shell.css";
import TabBar from "./Components/TabBar/TabBar";
import { useState } from "react";
import { Tab } from "../Documents/TabManager.jsx";
import TabContent from "./Components/TabContent/TabContent";
import Explorer from "./Components/ShellPanel/Componenets/Explorer/Explorer";
export default function NewShell() {
    // TAB MANAGEMENT //
    const [activeTab, setActiveTab] = useState(null);
    const [databaseConnection, setDatabaseConnection] = useState(null);
    let [tabs, setTabs] = useState([]);
    const createBlankTab = (type) => {
        let newTab = new Tab();
        newTab.createDefault(type);
        newTab.databaseRef = databaseConnection;
        setActiveTab(newTab);
        setTabs((prev) => [...prev, newTab]);
    };
    const createAnalysisTabFromFile = (path) => {
        let newTab = new Tab();
        newTab.createDefault("Analysis");
        newTab.databaseRef = databaseConnection;
        newTab.chessDocument.loadPgn(path);
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
    const explorerRefs = {
        analysis_callback: createAnalysisTabFromFile,
    };

    const panelItems = [
        {
            id: 1,
            logo: Compass,
            content: <Explorer callbackObj={explorerRefs} />,
            toolTip: "File Explorer",
        },
        { id: 2, logo: DbLogo, toolTip: "Database Connections" },
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
                    <TabContent
                        activeTabRef={activeTab}
                        explorerObj={explorerRefs}
                    />
                </div>
            </div>
        </div>
    );
}
