"use client";
import { useState } from "react";
import SpaApp from "./spa/SpaApp";
import SplashMobile from "../src/components/SplashMobile";

export default function Page() {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <SplashMobile onDone={() => setReady(true)} />}
      <div aria-hidden={!ready} className={ready ? "" : "opacity-0"}>
        <SpaApp />
      </div>
    </>
  );
}
