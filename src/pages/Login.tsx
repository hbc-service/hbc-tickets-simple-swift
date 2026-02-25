import { useState } from "react";
import { Phone, ArrowRight, Chrome } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getRoleRedirect } from "@/lib/role-redirect";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, profile } = useAuth();

  useEffect(() => {
    if (session && profile?.role) {
      navigate(getRoleRedirect(profile.role), { replace: true });
    }
  }, [session, profile, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);

    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }

    setOtpSent(true);
    toast({ title: "Code gesendet", description: `SMS an ${phone} gesendet.` });
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 brand-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary-foreground tracking-tight">HBC</h1>
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
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-bold text-primary tracking-tight">HBC</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">
              Ticketsystem
            </p>
          </div>

          <div className="login-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-1">HBC Ticketsystem</h2>
            <p className="text-sm text-muted-foreground mb-6">Bitte melden Sie sich an.</p>

            {/* Phone OTP Section */}
            <div className="space-y-4 mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Anmeldung per SMS
              </p>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+49 170 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Wird gesendet…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Code per SMS senden
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-card-foreground">
                    Code an <span className="font-medium">{phone}</span> gesendet.
                  </p>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    className="w-full h-11 font-medium"
                    disabled={loading || otp.length !== 6}
                    onClick={handleVerifyOtp}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Wird geprüft…
                      </span>
                    ) : (
                      "Bestätigen"
                    )}
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    Andere Nummer verwenden
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">oder</span>
              </div>
            </div>

            {/* Google SSO */}
            <Button
              variant="outline"
              className="w-full h-11 font-medium"
              onClick={handleGoogleLogin}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Mit Google anmelden
            </Button>
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
