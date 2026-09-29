import { PixelCrab } from './pixel-crab'

function Coral({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path fill={color} d="M18 44V30h-6v-4H8v-8H4V6h4v10h4v6h6V12h-4V4h4v6h4V0h4v16h4v-6h4V2h4v10h-4v8h-8v10h6v-4h4v-8h4v10h-4v6H24v10Z" />
      <path fill="#ffd4bc" opacity=".65" d="M4 6h4v6H4Zm10-2h4v4h-4Zm8-4h4v8h-4Zm12 2h4v6h-4Zm2 16h4v6h-4Z" />
      <path fill="#71466c" opacity=".25" d="M18 32h4v12h-4Zm6-14h8v4h-8Z" />
    </g>
  )
}

function Reef({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className={`ocean-reef ocean-reef-${side}`} viewBox="0 0 176 120" shapeRendering="crispEdges" aria-hidden="true">
      <g className="ocean-reef-rocks">
        <path fill="#163e58" d="M0 50h8v8h8v-8h8v8h8v12h12v8h8v8h12v8h16v10h20v4h12v8h24v4H0Z" />
        <path fill="#24566e" d="M0 70h8v-8h8v8h8v12h8v8h12v12h16v10h20v8H0Z" />
        <path fill="#316d81" d="M0 86h8v-8h8v12h8v8h8v10h12v12H0Zm48 6h8v8h12v4H56v-4h-8Zm32 14h12v4h8v6H84Z" />
        <path fill="#102f4b" d="M20 92h8v8h8v12h16v8H28v-12h-8Zm40 16h12v4h12v8H64Z" />
        <path fill="#508ca0" d="M4 80h4v8H4Zm12 12h4v8h-4Zm20 12h8v4h-8Zm48 6h8v4h-8Z" />
      </g>
      <g fill="#287978">
        <path d="M4 76V52H0V28h4v22h4v26Zm10-6V42h4V18h4V0h4v20h-4v24h-4v26Zm20 16V64h4V44h-4V32h4v10h4v24h-4v20Z" />
        <path fill="#59aba2" d="M4 28h4v18H4Zm18-18h4v10h-4Zm12 34h4v16h-4Z" />
      </g>
      <Coral x={24} y={52} color="#e5a0aa" scale={0.9} />
      <Coral x={68} y={86} color="#549995" scale={0.65} />
      <Coral x={4} y={82} color="#427d91" scale={0.85} />
      <g fill="#91c3b5">
        <path d="M112 120v-18h-4V90h4v10h4v10h4V94h4v16h-4v10Z" />
        <path fill="#388c91" d="M126 120v-8h4v-10h4v10h4v8Z" />
      </g>
      <path fill="#cbded6" d="M0 116h16v-4h12v4h36v-4h8v4h44v-4h12v4h20v-4h8v4h20v4H0Z" />
      <path fill="#f0ecda" d="M10 116h16v4H10Zm48 0h12v4H58Zm56 0h12v4h-12Zm28 0h12v4h-12Z" />
    </svg>
  )
}

export function OceanSeabed() {
  return (
    <div className="ocean-seabed" aria-hidden="true">
      <Reef side="left" />
      <Reef side="right" />
      <div className="ocean-sand" />
      <PixelCrab />
    </div>
  )
}
