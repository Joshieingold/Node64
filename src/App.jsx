import "./App.css";
import NewShell from "./NEW/Shell/Shell";
import Shell from "./NEW/Shell/Shell";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const selectedTheme = atomWithStorage("dark", false);
export default function App() {
    const [theme, setTheme] = useAtom(selectedTheme);
    const possibleThemes = ["dark", "tokyo", "pink"];
    const getTheme = () => {
        switch (theme) {
            case "dark":
                return "DARK";
            case "tokyo":
                return "TOKYO";
            case "pink":
                return "PINK";
            default:
                return "DARK";
        }
    };
    const handleThemeSwitch = () => {
        let currentIndex = possibleThemes.indexOf(theme);
        if (currentIndex + 1 == possibleThemes.length) {
            currentIndex = 0;
            console.log("Hit case 1");
        } else {
            currentIndex++;
            console.log("Hit case 2");
        }
        console.log("hit");
        setTheme(possibleThemes[currentIndex]);
    };

    return (
        <div className={`app-wrapper ${getTheme()}`}>
            <NewShell themeSwitch={handleThemeSwitch} />
        </div>
    );
}
