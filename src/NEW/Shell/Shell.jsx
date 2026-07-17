import { NavBar } from "../Navbar/NavBar";
import Compass from "/Compass.png";
import ShellPanel from "../ShellPanel/ShellPanel";
import "./Shell.css";
export default function NewShell() {
    const navItems = [
        {
            id: 1,
            label: "Analysis",
            clickFunc: () => console.log("hello analysis"),
        },
        {
            id: 2,
            label: "Repertoires",
            clickFunc: () => console.log("hello repertoire"),
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
                <div className="help">hello</div>
            </div>
        </div>
    );
}
