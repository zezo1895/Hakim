// src/pages/Home.jsx
import Hero       from "../sections/Hero";
import StatsBar   from "../sections/StatsBar";
import Sectors    from "../sections/Sectors";
import ImpactStats from "../sections/ImpactStats";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Sectors />
      <ImpactStats />
    </>
  );
}