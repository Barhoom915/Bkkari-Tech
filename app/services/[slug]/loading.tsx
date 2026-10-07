export default function Loading() {
  return <main className="route-loading-shell"><div className="space-y-5"><div className="route-loading-block h-36 w-full"/><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="route-loading-block h-52 w-full"/>)}</div></div></main>;
}
