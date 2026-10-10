"use client";

import { Star, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  formatPriceARS,
  type DemoCategorySlug,
} from "@/lib/demo";

export type DemoSort =
  | "relevancia"
  | "precio-asc"
  | "precio-desc"
  | "rating"
  | "novedad";

export type CategoriaFiltro = "todas" | DemoCategorySlug;

export interface DemoFiltersValue {
  categoria: CategoriaFiltro;
  precioMin: number;
  precioMax: number;
  modelos: string[];
  ratingMin: number;
  soloEnStock: boolean;
  colores: string[];
  soloOfertas: boolean;
}

export interface DemoPriceBounds {
  min: number;
  max: number;
}

interface DemoFiltersProps {
  value: DemoFiltersValue;
  bounds: DemoPriceBounds;
  allModelos: string[];
  allColores: string[];
  ofertasCount: number;
  activeCount: number;
  onChange: (next: DemoFiltersValue) => void;
  onClear: () => void;
}

export const RATING_OPTIONS = [0, 4, 4.5, 4.8] as const;

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item)
    ? list.filter((x) => x !== item)
    : [...list, item];
}

/**
 * Panel de filtros solo-demo.
 * Las opciones de categoría, modelos y colores se derivan de
 * DEMO_CATEGORIES / DEMO_PRODUCTS (nada hardcodeado), así el panel
 * sigue funcionando si demo.ts suma categorías (p. ej. "soportes",
 * "parlantes") o productos nuevos.
 */
export function DemoFilters({
  value,
  bounds,
  allModelos,
  allColores,
  ofertasCount,
  activeCount,
  onChange,
  onClear,
}: DemoFiltersProps) {
  const singleBound = bounds.min >= bounds.max;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          Filtros
          {activeCount > 0 && (
            <span className="ml-1.5 text-muted-foreground">
              ({activeCount} activo{activeCount === 1 ? "" : "s"})
            </span>
          )}
        </p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-1.5 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Categoría: opciones derivadas de DEMO_CATEGORIES (defensivo ante 6+ categorías) */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={value.categoria === "todas" ? "default" : "outline"}
            onClick={() => onChange({ ...value, categoria: "todas" })}
          >
            Todas ({DEMO_PRODUCTS.length})
          </Button>
          {DEMO_CATEGORIES.map((cat) => {
            const count = DEMO_PRODUCTS.filter(
              (p) => p.categoria === cat.slug,
            ).length;
            return (
              <Button
                key={cat.slug}
                size="sm"
                variant={
                  value.categoria === cat.slug ? "default" : "outline"
                }
                onClick={() => onChange({ ...value, categoria: cat.slug })}
              >
                {cat.nombre} ({count})
              </Button>
            );
          })}
        </div>
      </fieldset>

      {/* Precio: Slider min/max derivado de los datos (precio efectivo) */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Precio</legend>
        {singleBound ? (
          <p className="text-sm text-muted-foreground">
            Precio único: {formatPriceARS(bounds.min)}
          </p>
        ) : (
          <>
            <Slider
              value={[value.precioMin, value.precioMax]}
              min={bounds.min}
              max={bounds.max}
              step={100}
              onValueChange={([min, max]) =>
                onChange({
                  ...value,
                  precioMin: Math.min(min ?? bounds.min, max ?? bounds.max),
                  precioMax: Math.max(min ?? bounds.min, max ?? bounds.max),
                })
              }
              aria-label="Rango de precio"
              className="mt-2"
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <Badge variant="secondary">{formatPriceARS(value.precioMin)}</Badge>
              <span className="text-muted-foreground">—</span>
              <Badge variant="secondary">{formatPriceARS(value.precioMax)}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Rango disponible: {formatPriceARS(bounds.min)} a{" "}
              {formatPriceARS(bounds.max)}
            </p>
          </>
        )}
      </fieldset>

      {/* Marca/modelo: checkbox derivados de modelos[] */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Modelo</legend>
        {allModelos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin modelos.</p>
        ) : (
          <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
            {allModelos.map((modelo) => {
              const id = `filtro-modelo-${modelo}`;
              const checked = value.modelos.includes(modelo);
              return (
                <div key={modelo} className="flex items-center space-x-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={() =>
                      onChange({
                        ...value,
                        modelos: toggleInList(value.modelos, modelo),
                      })
                    }
                  />
                  <Label htmlFor={id} className="cursor-pointer font-normal">
                    {modelo}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
        {value.modelos.length > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {value.modelos.length} modelo{value.modelos.length === 1 ? "" : "s"}{" "}
            seleccionado{value.modelos.length === 1 ? "" : "s"}
          </p>
        )}
      </fieldset>

      {/* Rating mínimo */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Valoración mínima</legend>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={value.ratingMin === r ? "default" : "outline"}
              onClick={() => onChange({ ...value, ratingMin: r })}
              aria-pressed={value.ratingMin === r}
            >
              {r === 0 ? (
                "Todas"
              ) : (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {r.toFixed(1)}+
                </span>
              )}
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Color: píldoras derivadas de colores[] */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Color</legend>
        {allColores.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin colores.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allColores.map((color) => {
              const selected = value.colores.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      colores: toggleInList(value.colores, color),
                    })
                  }
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground hover:border-primary/60",
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Disponibilidad y ofertas */}
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">
          Disponibilidad y ofertas
        </legend>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="solo-stock"
            checked={value.soloEnStock}
            onCheckedChange={(v) =>
              onChange({ ...value, soloEnStock: v === true })
            }
          />
          <Label htmlFor="solo-stock" className="cursor-pointer font-normal">
            Solo en stock
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="solo-ofertas"
            checked={value.soloOfertas}
            onCheckedChange={(v) =>
              onChange({ ...value, soloOfertas: v === true })
            }
          />
          <Label
            htmlFor="solo-ofertas"
            className="flex cursor-pointer items-center gap-1.5 font-normal"
          >
            <Tag className="h-3.5 w-3.5 text-primary" />
            Solo ofertas ({ofertasCount})
          </Label>
        </div>
      </fieldset>
    </div>
  );
}
