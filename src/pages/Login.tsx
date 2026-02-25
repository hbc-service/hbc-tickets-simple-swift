import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Mock: simulate sending magic link
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);

    toast({
      title: "Magic Link gesendet!",
      description: `Eine E-Mail wurde an ${email} gesendet.`,
    });

    // Auto-redirect after short delay (mock login)
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 brand-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary-foreground tracking-tight">
              HBC
            </h1>
            <p className="text-lg text-primary-foreground/70 mt-1 font-light tracking-widest uppercase">
              Ticketsystem
            </p>
          </div>
          <div className="w-16 h-px bg-primary-foreground/30 mx-auto mb-8" />
          <p className="text-primary-foreground/60 text-sm leading-relaxed">
            Professionelles Facility Management.
            <br />
            Tickets, Projekte und Aufgaben an einem Ort.
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-bold text-primary tracking-tight">HBC</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">
              Ticketsystem
            </p>
          </div>

          <div className="login-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-1">
              Willkommen zurück
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Melden Sie sich mit Ihrer E-Mail-Adresse an.
            </p>

            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@firma.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Wird gesendet…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Magic Link senden
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <p className="text-sm font-medium text-card-foreground">
                  Prüfen Sie Ihr Postfach
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Der Link wurde an {email} gesendet.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            © 2026 HBC Facility Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
