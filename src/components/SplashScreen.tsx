import {APP_LOGO_PATH} from '../constants';

interface SplashScreenProps {
  exiting: boolean;
}

export function SplashScreen({exiting}: SplashScreenProps) {
  return (
    <div
      aria-label="جاري التحميل"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#07162E] via-[#0E2954] to-[#163F7A] transition-all duration-700 ease-out ${
        exiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Soft continuous blue ambient aura */}
        <div
          aria-hidden="true"
          className="animate-gentle-aura absolute -inset-8 rounded-full bg-radial from-[#3B82F6]/35 via-[#2563EB]/15 to-transparent blur-2xl"
        />

        {/* Attached logo image with smooth gentle pulse animation */}
        <div className="animate-gentle-pulse relative h-44 w-44 sm:h-52 sm:w-52 overflow-hidden rounded-3xl border border-[#60A5FA]/35 bg-[#09152B] p-1.5">
          <img
            src={APP_LOGO_PATH}
            alt="شعار أفكار"
            referrerPolicy="no-referrer"
            className="h-full w-full rounded-[20px] object-cover"
          />
        </div>
      </div>
    </div>
  );
}
