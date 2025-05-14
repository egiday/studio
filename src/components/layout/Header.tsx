import { Zap } from 'lucide-react'; // Using Zap as a placeholder for a "revolution" or "energy" icon

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Zap className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-xl font-bold text-primary">Cultural Revolution</h1>
        </div>
        {/* Future navigation or game status could go here */}
      </div>
    </header>
  );
}
