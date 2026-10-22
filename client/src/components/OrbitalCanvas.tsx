import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, RotateCcw, ShieldAlert, CheckCircle2, ZoomIn, ZoomOut } from 'lucide-react';
import { ManeuverRecommendation } from '../types';

interface OrbitalCanvasProps {
  resolvedManeuver: ManeuverRecommendation | null;
  dodIngested: boolean;
  starlinkIngested: boolean;
}

export const OrbitalCanvas: React.FC<OrbitalCanvasProps> = ({
  resolvedManeuver,
  dodIngested,
  starlinkIngested,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState({ yaw: 0.45, pitch: 0.32 });
  const [zoom, setZoom] = useState(1.0);
  const [timeProgress, setTimeProgress] = useState(0.72);
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.31 * zoom;

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(39, 39, 42, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const project3D = (x: number, y: number, z: number) => {
        const x1 = x * Math.cos(rotation.yaw) - z * Math.sin(rotation.yaw);
        const z1 = x * Math.sin(rotation.yaw) + z * Math.cos(rotation.yaw);
        const y2 = y * Math.cos(rotation.pitch) - z1 * Math.sin(rotation.pitch);
        const z2 = y * Math.sin(rotation.pitch) + z1 * Math.cos(rotation.pitch);
        return { px: cx + x1 * radius, py: cy + y2 * radius, depth: z2 };
      };

      const grad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.35);
      grad.addColorStop(0, 'rgba(14, 116, 144, 0.16)');
      grad.addColorStop(1, 'rgba(9, 9, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(63, 63, 70, 0.55)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        const rLat = Math.cos(latRad);
        const yLat = Math.sin(latRad);
        ctx.beginPath();
        for (let lon = 0; lon <= 360; lon += 8) {
          const lonRad = (lon * Math.PI) / 180;
          const pt = project3D(rLat * Math.cos(lonRad), yLat, rLat * Math.sin(lonRad));
          if (lon === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
      }

      const orbitScale = 1.28;
      const getDoDPoint = (t: number) => {
        const inc = (62 * Math.PI) / 180;
        return {
          x: orbitScale * Math.cos(t),
          y: orbitScale * Math.sin(t) * Math.sin(inc),
          z: orbitScale * Math.sin(t) * Math.cos(inc),
        };
      };

      const getStarlinkPoint = (t: number, mitigated: boolean) => {
        const inc = (-53 * Math.PI) / 180;
        const shift = mitigated ? 0.14 : 0.0;
        const rScale = mitigated ? orbitScale + 0.09 : orbitScale;
        const angle = t - 0.85 * 2;
        return {
          x: rScale * Math.cos(angle),
          y: rScale * Math.sin(angle) * Math.sin(inc) + shift,
          z: rScale * Math.sin(angle) * Math.cos(inc),
        };
      };

      ctx.strokeStyle = dodIngested ? 'rgba(245, 158, 11, 0.75)' : 'rgba(245, 158, 11, 0.28)';
      ctx.lineWidth = dodIngested ? 2 : 1;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.06) {
        const v = getDoDPoint(a);
        const pt = project3D(v.x, v.y, v.z);
        if (a === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.stroke();

      ctx.strokeStyle = resolvedManeuver
        ? 'rgba(16, 185, 129, 0.85)'
        : starlinkIngested
        ? 'rgba(6, 182, 212, 0.75)'
        : 'rgba(6, 182, 212, 0.28)';
      ctx.lineWidth = starlinkIngested ? 2 : 1;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.06) {
        const v = getStarlinkPoint(a, Boolean(resolvedManeuver));
        const pt = project3D(v.x, v.y, v.z);
        if (a === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.stroke();

      const conj3D = getDoDPoint(0.85);
      const conjPt = project3D(conj3D.x, conj3D.y, conj3D.z);

      const pulse = (Math.sin(timestamp / 220) + 1) / 2;
      ctx.beginPath();
      ctx.arc(conjPt.px, conjPt.py, 14 + pulse * 10, 0, Math.PI * 2);
      ctx.fillStyle = resolvedManeuver ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fill();
      ctx.strokeStyle = resolvedManeuver ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const currentAngle = 0.85 - (1 - timeProgress) * 0.9;
      const dodNow = getDoDPoint(currentAngle);
      const starNow = getStarlinkPoint(0.85 + (1 - timeProgress) * 0.9, Boolean(resolvedManeuver));

      const dodProj = project3D(dodNow.x, dodNow.y, dodNow.z);
      const starProj = project3D(starNow.x, starNow.y, starNow.z);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(dodProj.px, dodProj.py, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fcd34d';
      ctx.font = '11px monospace';
      ctx.fillText('USA-326 [CLASSIFIED]', dodProj.px + 10, dodProj.py - 6);

      ctx.fillStyle = resolvedManeuver ? '#10b981' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(starProj.px, starProj.py, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = resolvedManeuver ? '#6ee7b7' : '#67e8f9';
      ctx.fillText(
        resolvedManeuver ? 'STARLINK-4921 [+0.38m/s BURN]' : 'STARLINK-4921 [COMMERCIAL]',
        starProj.px + 10,
        starProj.py + 14
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [rotation, zoom, timeProgress, resolvedManeuver, dodIngested, starlinkIngested]);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-200">
            Tactical LEO Conjunction Visualizer (550km Shell)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resolvedManeuver ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SAFE SEPARATION: {resolvedManeuver.postBurnMissDistanceKm} KM
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-700/60 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              CRITICAL MISS DISTANCE: 2.40 KM
            </span>
          )}
        </div>
      </div>

      <div
        className="relative flex-1 min-h-[340px] bg-zinc-950 rounded-lg border border-zinc-800/80 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          const dx = e.clientX - lastMouseRef.current.x;
          const dy = e.clientY - lastMouseRef.current.y;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
          setRotation((prev) => ({
            yaw: prev.yaw + dx * 0.008,
            pitch: Math.max(-1.2, Math.min(1.2, prev.pitch + dy * 0.008)),
          }));
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <canvas ref={canvasRef} width={760} height={420} className="w-full h-full object-cover" />

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setRotation({ yaw: 0.45, pitch: 0.32 });
              setZoom(1.0);
            }}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-2 flex items-center gap-4 text-xs">
        <span className="text-zinc-400 whitespace-nowrap">
          TCA Scrubber (T - {((1 - timeProgress) * 18.5).toFixed(1)}h):
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={timeProgress}
          onChange={(e) => setTimeProgress(parseFloat(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer"
        />
        <span className="text-amber-400 font-semibold whitespace-nowrap">TCA (0.0h)</span>
      </div>
    </div>
  );
};
