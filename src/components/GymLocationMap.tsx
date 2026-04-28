"use client";

import React from 'react';
import { Map, Marker } from 'pigeon-maps';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from 'lucide-react';

// Coordenadas da Academia Panobianco
const DEFAULT_CENTER: [number, number] = [-23.56865, -46.85681]; 

export const GymLocationMap: React.FC = () => {
  return (
    <Card className="glow-card h-[450px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[hsl(var(--foreground))]">Localização da Academia</CardTitle>
        <MapPin className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <div className="h-full w-full rounded-b-lg overflow-hidden">
          <Map 
            center={DEFAULT_CENTER} 
            zoom={13} 
            height={380}
            defaultZoom={13}
            meta={{
              attribution: '© OpenStreetMap contributors',
              url: 'https://www.openstreetmap.org/copyright'
            }}
            // Usando um provedor de tiles padrão
            provider={(x, y, z) => {
              const url = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
              return url;
            }}
          >
            <Marker 
              anchor={DEFAULT_CENTER} 
              payload={1} 
              color="hsl(var(--primary))"
            />
          </Map>
        </div>
      </CardContent>
    </Card>
  );
};