"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import Map, { Layer, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { FaUserCircle } from "react-icons/fa";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic2luZ3VsYXJpdHlsYWIiLCJhIjoiY2x6b2JmZGNhMHY0eTJrcXcxOGp0eDluNiJ9.tOMt_XF278-jrGovF9MsAw";

interface BuildingInfo {
  id: string;
  name?: string;
  height?: number;
  baseHeight?: number;
  iso3166_1?: string;
  iso3166_2?: string;
}

const MapComponent: React.FC = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(
    null
  );
  const [previousBuildingId, setPreviousBuildingId] = useState<string | null>(
    null
  );
  const [extrusionHeight, setExtrusionHeight] = useState<number>(0);
  const [highlightColor, setHighlightColor] = useState<string>("#00ff00");
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const handleBuildingClick = useCallback(
    (event: any) => {
      const features = event.features;

      if (features.length > 0) {
        const firstFeature = features[0];
        const featureId = firstFeature.id;

        if (featureId !== undefined && featureId !== null) {
          const buildingInfo: BuildingInfo = {
            id: featureId.toString(),
            name: firstFeature.properties.name || "Здание",
            height: firstFeature.properties.height || 0,
            baseHeight: firstFeature.properties.baseHeight || 0,
            iso3166_1: firstFeature.properties.iso_3166_1 || "Неизвестен",
            iso3166_2: firstFeature.properties.iso_3166_2 || "Неизвестен",
          };

          console.log(buildingInfo);
          setSelectedBuilding(buildingInfo);
          setExtrusionHeight(buildingInfo.height || 0);

          if (mapRef.current) {
            // Reset previous building color if it exists
            if (previousBuildingId) {
              mapRef.current.setFeatureState(
                {
                  source: "3d-buildings-source",
                  sourceLayer: "building",
                  id: previousBuildingId,
                },
                { color: "#aaa" }
              );
            }

            // Highlight the new building
            mapRef.current.setFeatureState(
              {
                source: "3d-buildings-source",
                sourceLayer: "building",
                id: featureId,
              },
              { color: highlightColor }
            );
          }

          setPreviousBuildingId(featureId.toString()); // Update the previous building ID
        } else {
          console.error("Feature ID is undefined or null");
        }
      }
    },
    [highlightColor, previousBuildingId]
  );

  const increaseHeight = () => {
    if (selectedBuilding) {
      setExtrusionHeight((prevHeight) => prevHeight + 50);
    }
  };

  const changeBuildingColor = () => {
    setHighlightColor(highlightColor === "#00ff00" ? "#ff0000" : "#00ff00");
  };

  useEffect(() => {
    if (mapRef.current && selectedBuilding) {
      // Apply feature state for the selected building
      mapRef.current.setFeatureState(
        {
          source: "3d-buildings-source",
          sourceLayer: "building",
          id: selectedBuilding.id,
        },
        { color: highlightColor }
      );
    }
  }, [selectedBuilding, highlightColor]);

  return (
    <div className="w-full h-screen relative">
      <Map
        initialViewState={{
          latitude: 37.7749,
          longitude: -122.4194,
          zoom: 15,
          pitch: 45,
          bearing: -17.6,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/outdoors-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleBuildingClick}
        interactiveLayerIds={["3d-buildings"]}
        ref={(map) => {
          if (map) {
            mapRef.current = map.getMap() as mapboxgl.Map;
          }
        }}
      >
        <Source
          id="3d-buildings-source"
          type="vector"
          url="mapbox://mapbox.mapbox-streets-v8"
          generateId={true}
        >
          <Layer
            id="3d-buildings"
            source-layer="building"
            filter={["==", "extrude", "true"]}
            type="fill-extrusion"
            minzoom={15}
            paint={{
              "fill-extrusion-color": [
                "case",
                ["==", ["feature-state", "color"], highlightColor],
                highlightColor,
                "#aaa",
              ],
              "fill-extrusion-height": [
                "case",
                ["==", ["feature-state", "color"], highlightColor],
                extrusionHeight,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "case",
                ["==", ["feature-state", "color"], highlightColor],
                selectedBuilding?.baseHeight || 0,
                ["get", "baseHeight"],
              ],
              "fill-extrusion-opacity": 0.6,
            }}
          />
        </Source>
      </Map>

      {/* User icon with menu */}
      <div className="absolute top-4 right-4">
        <Popover>
          <PopoverTrigger>
            <FaUserCircle className="text-4xl text-gray-700 cursor-pointer" />
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-4 bg-white rounded-lg shadow-lg">
              <ul>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">
                  Profile
                </li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">
                  Settings
                </li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Logout</li>
              </ul>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Information window for selected building */}
      {selectedBuilding && (
        <div className="absolute top-4 left-4 p-4 bg-white rounded shadow-lg z-10">
          <h2 className="text-xl font-bold">{selectedBuilding.name}</h2>
          <p>
            <strong>ISO Country Code:</strong> {selectedBuilding.iso3166_1}
          </p>
          <p>
            <strong>Region:</strong> {selectedBuilding.iso3166_2}
          </p>
          <p>
            <strong>Height:</strong> {extrusionHeight} m
          </p>
        </div>
      )}

      {/* Bottom action menu */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white shadow-lg flex justify-around items-center">
        <Button
          onClick={increaseHeight}
          className="flex flex-col items-center text-gray-700"
        >
          <span className="text-white">Increase Height</span>
        </Button>

        <Button
          onClick={changeBuildingColor}
          className="flex flex-col items-center text-gray-700"
        >
          <span className="text-white">Change Color</span>
        </Button>
      </div>
    </div>
  );
};

export default MapComponent;
