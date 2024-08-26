import MapComponent from "../components/MapComponent";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold p-1">Mapbox 3D Buildings</h1>
      <MapComponent />
    </div>
  );
}
