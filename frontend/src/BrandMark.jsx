import { useBranding } from './branding'
export default function BrandMark() {
  const { name, logo } = useBranding()
  return logo ? <img src={logo} alt={name} className="h-full w-full object-contain" /> : <>{name.slice(0, 1)}</>
}
