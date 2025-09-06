"use client";
import { useState } from "react";
import SpaApp from "./spa/SpaApp";
import Splash from "../src/components/Splash";

export default function Page() {
  const [splashDone, setSplashDone] = useState(false);
  
  return (
    <>
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
      <div style={{ opacity: splashDone ? 1 : 0 }}>
        <SpaApp />
      </div>
    </>
  );
}

