"use client";
import { useState } from "react";
import SpaApp from "./spa/SpaApp";
import Splash from "../src/components/Splash";

export default function Page() {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <Splash onDone={() => setReady(true)} />}
      <div aria-hidden={!ready} className={ready ? "" : "opacity-0"}>
        <SpaApp />
      </div>
    </>
  );
}
