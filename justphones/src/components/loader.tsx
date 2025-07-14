
import { Logo } from "./icons/logo";

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="animate-pulse">
        <Logo className="h-auto w-32" />
      </div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
