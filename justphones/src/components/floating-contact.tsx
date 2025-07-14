import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InstagramIcon } from "@/components/icons/instagram";
import { WhatsappIcon } from "@/components/icons/whatsapp";

export function FloatingContact() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-4">
      <Button asChild variant="default" size="icon" className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600">
        <Link href="https://wa.me/5493564338599" target="_blank" rel="noopener noreferrer">
          <WhatsappIcon className="h-8 w-8" />
          <span className="sr-only">WhatsApp</span>
        </Link>
      </Button>
      <Button asChild variant="default" size="icon" className="rounded-full h-14 w-14 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 hover:opacity-90">
        <Link href="https://www.instagram.com/just.phones.fv/" target="_blank" rel="noopener noreferrer">
          <InstagramIcon className="h-8 w-8" />
          <span className="sr-only">Instagram</span>
        </Link>
      </Button>
    </div>
  );
}
