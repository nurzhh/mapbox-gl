"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import Map, { Layer, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { FaUserCircle } from "react-icons/fa";
import mapboxgl from "mapbox-gl";

// Токен Mapbox для доступа к сервисам Mapbox
const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic2luZ3VsYXJpdHlsYWIiLCJhIjoiY2x6b2JmZGNhMHY0eTJrcXcxOGp0eDluNiJ9.tOMt_XF278-jrGovF9MsAw";

// Интерфейс для информации о здании
interface BuildingInfo {
  id: string;
  name?: string;
  height?: number;
  baseHeight?: number;
  iso3166_1?: string;
  iso3166_2?: string;
}

const MapComponent: React.FC = () => {
  // Состояние для выбранного здания
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(
    null
  );
  // Состояние для ID предыдущего здания для сброса цвета
  const [previousBuildingId, setPreviousBuildingId] = useState<string | null>(
    null
  );
  // Состояние для высоты экструзии
  const [extrusionHeight, setExtrusionHeight] = useState<number>(0);
  // Состояние для цвета подсветки здания
  const [highlightColor, setHighlightColor] = useState<string>("#00ff00");
  // Ссылка на карту
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Обработчик клика по зданию
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

          // Обновление состояния выбранного здания
          setSelectedBuilding(buildingInfo);
          setExtrusionHeight(buildingInfo.height || 0);

          if (mapRef.current) {
            // Сброс цвета предыдущего здания
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
            // Установка цвета для нового выбранного здания
            mapRef.current.setFeatureState(
              {
                source: "3d-buildings-source",
                sourceLayer: "building",
                id: featureId,
              },
              { color: highlightColor }
            );
          }

          // Обновление ID предыдущего здания
          setPreviousBuildingId(featureId.toString());
        } else {
          console.error("ID объекта не определен или равен null");
        }
      }
    },
    [highlightColor, previousBuildingId]
  );

  // Функция для увеличения высоты экструзии
  const increaseHeight = () => {
    if (selectedBuilding) {
      setExtrusionHeight((prevHeight) => prevHeight + 50);
    }
  };

  // Функция для изменения цвета здания
  const changeBuildingColor = () => {
    setHighlightColor(highlightColor === "#00ff00" ? "#ff0000" : "#00ff00");
  };

  // Обновление состояния цвета для выбранного здания при изменении
  useEffect(() => {
    if (mapRef.current && selectedBuilding) {
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
    <div className="w-full h-[90vh] relative">
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

      {/* Значок пользователя с меню */}
      <div className="absolute top-4 right-4">
        <Popover>
          <PopoverTrigger>
            <FaUserCircle className="text-4xl text-gray-700 cursor-pointer" />
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-4 bg-white rounded-lg shadow-lg">
              <ul>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">
                  Профиль
                </li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">
                  Настройки
                </li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Выход</li>
              </ul>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Информационное окно выбранного здания */}
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
            <strong>Height:</strong> {extrusionHeight} м
          </p>
        </div>
      )}

      {/* Нижнее меню действий */}
      <div className="absolute bottom-4 left-4 z-10 right-0 p-4 shadow-lg flex justify-around items-center">
        <Button
          onClick={increaseHeight}
          className="flex flex-col items-center text-gray-700"
        >
          <span className="text-white">Увеличить высоту</span>
        </Button>

        <Button
          onClick={changeBuildingColor}
          className="flex flex-col items-center text-gray-700"
        >
          <span className="text-white">Изменить цвет</span>
        </Button>
      </div>
    </div>
  );
};

export default MapComponent;
