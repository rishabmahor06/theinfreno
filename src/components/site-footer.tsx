import { Link } from "@tanstack/react-router";
import { Dumbbell, Facebook, Instagram, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl tracking-wider">IRONFIT</span>
          </div>
          <p className="mt-4 text-sm text-surface-dark-foreground/70">
            Premium CrossFit & strength training. Fast. Hard. Again.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" className="text-surface-dark-foreground/60 hover:text-primary"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="text-surface-dark-foreground/60 hover:text-primary"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="text-surface-dark-foreground/60 hover:text-primary"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-display text-lg tracking-wider">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm text-surface-dark-foreground/70">
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/programs" className="hover:text-primary">Programs</Link></li>
            <li><Link to="/schedule" className="hover:text-primary">Schedule</Link></li>
            <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg tracking-wider">Train</h4>
          <ul className="mt-4 space-y-2 text-sm text-surface-dark-foreground/70">
            <li><Link to="/workout-guide" className="hover:text-primary">Workout Guide</Link></li>
            <li><Link to="/diet-chart" className="hover:text-primary">Diet Chart</Link></li>
            <li><Link to="/login" className="hover:text-primary">Member Login</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg tracking-wider">Visit</h4>
          <address className="mt-4 space-y-1 text-sm not-italic text-surface-dark-foreground/70">
            <p>500 South Capitol Avenue,</p>
            <p>Indianapolis, IN 46225</p>
            <p>+1 79 123 5578</p>
            <p className="pt-2">Mon – Sat · 5am – 10pm</p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-surface-dark-foreground/50">
        © {new Date().getFullYear()} IRONFIT. Built with Lovable.
      </div>
    </footer>
  );
}
