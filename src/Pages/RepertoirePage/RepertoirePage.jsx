import { useState, useEffect } from "react";
import "./RepertoirePage.css";
import RepertoireDocument from "../../DataClasses/RepertoireDocument";

export default function RepertoirePage({ data }) {
    const [, setVersion] = useState(0);
    const update = () => setVersion((v) => v + 1);
    console.log(JSON.stringify(new RepertoireDocument(data)));

    useEffect(() => {
        data.onChange = update;
        return () => {
            if (data.onChange === update) data.onChange = null;
        };
    });

    return (
        <div>
            <div>Empty for now</div>
        </div>
    );
}
