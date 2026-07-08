import { useState, useEffect } from "react";
import "./RepertoirePage.css";

export default function RepertoirePage({ data }) {
    const [, setVersion] = useState(0);
    const update = () => setVersion((v) => v + 1);

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
