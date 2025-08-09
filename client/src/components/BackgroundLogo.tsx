import logoPath from "@assets/Chicken Poop Bingo Logo_1754776738392.png";

export function BackgroundLogo() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[-1] bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: `url(${logoPath})`,
        backgroundSize: '60% auto',
        opacity: 0.25
      }}
    />
  );
}